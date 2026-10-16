const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const dashboardController = require("../controllers/dashboardController");
const complaintController = require("../controllers/complaintController");
const slaController = require("../controllers/slaController");

function mockReqRes(params = {}, body = {}, query = {}, user = null) {
  const req = { params, body, query, user, cookies: {}, headers: {} };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return { req, res };
}

async function runAdminDashboardTests() {
  await connectDB();
  console.log("Connected to MongoDB for Admin Dashboard verification.");

  try {
    // TEST 1: Dashboard Stats
    console.log("1. Testing GET /api/dashboard/stats...");
    const { req: sReq, res: sRes } = mockReqRes();
    await dashboardController.getDashboardStats(sReq, sRes);
    console.log("   Stats status:", sRes.statusCode);
    console.log("   Total complaints:", sRes.jsonData?.data?.totalComplaints);
    if (sRes.statusCode !== 200 || typeof sRes.jsonData?.data?.totalComplaints !== "number") {
      throw new Error("Stats endpoint failed");
    }

    // TEST 2: Recent complaints
    console.log("2. Testing GET /api/dashboard/recent...");
    const { req: rReq, res: rRes } = mockReqRes({}, {}, { limit: 5 });
    await dashboardController.getRecentComplaints(rReq, rRes);
    console.log("   Recent status:", rRes.statusCode);
    console.log("   Recent count:", rRes.jsonData?.count);
    if (rRes.statusCode !== 200 || !Array.isArray(rRes.jsonData?.data)) {
      throw new Error("Recent complaints endpoint failed");
    }

    // TEST 3: Admin Analytics (Grievance Intelligence)
    console.log("3. Testing GET /api/dashboard/analytics...");
    const { req: aReq, res: aRes } = mockReqRes();
    await dashboardController.getAdminAnalytics(aReq, aRes);
    console.log("   Analytics status:", aRes.statusCode);
    console.log("   Categories analyzed:", aRes.jsonData?.data?.categoryDistribution?.length);
    console.log("   Transport modes analyzed:", aRes.jsonData?.data?.transportDistribution?.length);
    console.log("   Top locations count:", aRes.jsonData?.data?.topLocations?.length);
    if (aRes.statusCode !== 200 || !aRes.jsonData?.data?.categoryDistribution) {
      throw new Error("Analytics endpoint failed");
    }

    // TEST 4: Get sample complaint for action tests
    const sample = await Complaint.findOne();
    if (!sample) {
      console.log("No sample complaint found to test actions. Creating temporary test complaint...");
    } else {
      const complaintId = sample.complaintId;
      console.log(`Testing actions on complaint ${complaintId}...`);

      // TEST 4a: Update Status & Resolution
      console.log("4a. Testing PATCH /api/complaints/:id/status (with resolution)...");
      const { req: stReq, res: stRes } = mockReqRes(
        { id: complaintId },
        {
          status: "Under Review",
          note: "Automated verification test inspection note.",
        },
        {},
        { fullName: "Test Administrator", role: "admin" }
      );
      await complaintController.updateStatus(stReq, stRes);
      console.log("   Update status response:", stRes.statusCode, stRes.jsonData?.message);
      if (stRes.statusCode !== 200 || stRes.jsonData?.data?.status !== "Under Review") {
        throw new Error("Status update failed");
      }

      // TEST 4b: Assign Department
      console.log("4b. Testing PATCH /api/complaints/:id/assign...");
      const { req: dpReq, res: dpRes } = mockReqRes(
        { id: complaintId },
        { department: "Operations" },
        {},
        { role: "admin" }
      );
      await complaintController.assignDepartment(dpReq, dpRes);
      console.log("   Assign department response:", dpRes.statusCode, dpRes.jsonData?.message);
      if (dpRes.statusCode !== 200 || dpRes.jsonData?.data?.assignedDepartment !== "Operations") {
        throw new Error("Department assign failed");
      }

      // TEST 4c: Update Priority
      console.log("4c. Testing PATCH /api/complaints/:id/priority...");
      const { req: prReq, res: prRes } = mockReqRes(
        { id: complaintId },
        { priority: "High" },
        {},
        { role: "admin" }
      );
      await complaintController.updatePriority(prReq, prRes);
      console.log("   Update priority response:", prRes.statusCode, prRes.jsonData?.message);
      if (prRes.statusCode !== 200 || prRes.jsonData?.data?.priority !== "High") {
        throw new Error("Priority update failed");
      }

      // Revert status to Registered for cleanliness
      sample.status = "Registered";
      await sample.save();
    }

    // TEST 5: Overdue Complaints Query & Escalation Sweep
    console.log("5. Testing Overdue Complaints and Escalation Sweep...");
    const { req: ovReq, res: ovRes } = mockReqRes();
    await slaController.getOverdueComplaints(ovReq, ovRes);
    console.log("   Overdue complaints fetched:", ovRes.statusCode, "count:", ovRes.jsonData?.count);

    const { req: escReq, res: escRes } = mockReqRes({}, {}, {}, { role: "admin" });
    await slaController.escalateOverdueComplaints(escReq, escRes);
    console.log("   Escalation sweep response:", escRes.statusCode, escRes.jsonData?.message);
    if (escRes.statusCode !== 200) {
      throw new Error("Escalation sweep failed");
    }

    console.log("\n>>> ALL ADMIN DASHBOARD BACKEND TESTS PASSED SUCCESSFULLY! <<<");
  } finally {
    await mongoose.disconnect();
  }
}

runAdminDashboardTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
