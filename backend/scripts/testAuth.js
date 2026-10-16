const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const authController = require("../controllers/authController");

function mockReqRes(body = {}) {
  const req = { body, cookies: {}, headers: {} };
  const res = {
    statusCode: 200,
    cookieData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookieData = { name, val, opts };
    },
  };
  return { req, res };
}

async function runTests() {
  await connectDB();
  console.log("Connected to MongoDB for auth verification.");

  const testEmail = `test_passenger_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  let testUserId = null;

  try {
    // 1. Register
    console.log("1. Testing Registration of new passenger...");
    const { req: regReq, res: regRes } = mockReqRes({
      fullName: "Test Passenger",
      email: testEmail,
      password: testPassword,
      role: "admin", // Public registration must ignore role and force passenger
    });
    await authController.register(regReq, regRes);
    console.log("   Registration status:", regRes.statusCode);
    console.log("   User role:", regRes.jsonData?.user?.role);
    if (regRes.statusCode !== 201 || regRes.jsonData?.user?.role !== "passenger") {
      throw new Error("Registration test failed: " + JSON.stringify(regRes.jsonData));
    }
    testUserId = regRes.jsonData.user.id;

    // 2. Duplicate registration
    console.log("2. Testing Duplicate email registration rejection...");
    const { req: dupReq, res: dupRes } = mockReqRes({
      fullName: "Another Passenger",
      email: testEmail,
      password: testPassword,
    });
    await authController.register(dupReq, dupRes);
    console.log("   Duplicate status:", dupRes.statusCode);
    console.log("   Duplicate message:", dupRes.jsonData?.message);
    if (dupRes.statusCode !== 409) {
      throw new Error("Duplicate email was not rejected with 409");
    }

    // 3. Login with correct password
    console.log("3. Testing Login with correct password...");
    const { req: logReq, res: logRes } = mockReqRes({
      identifier: testEmail,
      password: testPassword,
    });
    await authController.login(logReq, logRes);
    console.log("   Login status:", logRes.statusCode);
    console.log("   Cookie set:", Boolean(logRes.cookieData));
    if (logRes.statusCode !== 200 || !logRes.cookieData) {
      throw new Error("Login failed with correct credentials");
    }

    // 4. Login with incorrect password
    console.log("4. Testing Login with incorrect password...");
    const { req: badReq, res: badRes } = mockReqRes({
      identifier: testEmail,
      password: "WrongPassword999!",
    });
    await authController.login(badReq, badRes);
    console.log("   Incorrect password status:", badRes.statusCode);
    if (badRes.statusCode !== 401) {
      throw new Error("Incorrect password was not rejected with 401");
    }

    // 5. Admin login with email
    console.log("5. Testing Admin login with configured admin email...");
    const { req: adminReq, res: adminRes } = mockReqRes({
      identifier: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    await authController.login(adminReq, adminRes);
    console.log("   Admin login status:", adminRes.statusCode);
    console.log("   Admin role:", adminRes.jsonData?.user?.role);
    if (adminRes.statusCode !== 200 || adminRes.jsonData?.user?.role !== "admin") {
      throw new Error("Admin email login failed");
    }

    // 6. Admin login with ADMIN_USER_ID
    console.log("6. Testing Admin login with configured adminUserId...");
    const { req: adminIdReq, res: adminIdRes } = mockReqRes({
      identifier: process.env.ADMIN_USER_ID,
      password: process.env.ADMIN_PASSWORD,
    });
    await authController.login(adminIdReq, adminIdRes);
    console.log("   Admin user ID login status:", adminIdRes.statusCode);
    console.log("   Admin role:", adminIdRes.jsonData?.user?.role);
    if (adminIdRes.statusCode !== 200 || adminIdRes.jsonData?.user?.role !== "admin") {
      throw new Error("Admin user ID login failed");
    }

    console.log("\n>>> ALL 6 AUTHENTICATION TESTS PASSED SUCCESSFULLY! <<<");
  } finally {
    if (testUserId) {
      await User.deleteOne({ _id: testUserId });
      console.log("Cleaned up temporary test user.");
    }
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
