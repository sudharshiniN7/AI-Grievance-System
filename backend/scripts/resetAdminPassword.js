require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

/**
 * One-Time Admin Password Reset Script
 * ---------------------------------------
 * Resets the PASSWORD ONLY of the existing primary admin account,
 * using the ADMIN_PASSWORD currently set in backend/.env.
 *
 * Does NOT:
 *   - create a new admin
 *   - create a duplicate
 *   - delete anything
 *   - change role, email, or adminUserId
 *   - print the password or password hash anywhere
 *
 * Requires explicit confirmation to run, to prevent accidental use:
 *   node backend/scripts/resetAdminPassword.js --confirm
 */

async function resetAdminPassword() {
  const confirmed = process.argv.includes("--confirm");

  if (!confirmed) {
    console.error("This script resets the primary admin's password.");
    console.error("Re-run with the --confirm flag to proceed:");
    console.error("  node backend/scripts/resetAdminPassword.js --confirm");
    process.exit(1);
  }

  const { ADMIN_PASSWORD } = process.env;

  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in backend/.env. Nothing to reset to.");
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD in .env is too short (minimum 8 characters).");
    process.exit(1);
  }

  await connectDB();

  const admin = await User.findOne({ isPrimaryAdmin: true });

  if (!admin) {
    console.error("No primary admin account exists yet.");
    console.error("Run backend/scripts/seedAdmin.js instead to create one.");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Found existing primary admin:");
  console.log(`  Email: ${admin.email}`);
  console.log(`  Admin User ID: ${admin.adminUserId}`);
  console.log(`  Created: ${admin.createdAt}`);
  console.log("\nResetting password to the value currently set in ADMIN_PASSWORD (.env)...");

  await admin.setPassword(ADMIN_PASSWORD);
  await admin.save();

  console.log("\nPassword reset successfully.");
  console.log("No password or hash has been printed. Role, email, and admin user ID are unchanged.");
  console.log("You can now log in with the ADMIN_PASSWORD currently set in backend/.env.");

  await mongoose.disconnect();
  process.exit(0);
}

resetAdminPassword().catch((error) => {
  console.error("Password reset failed with an unexpected error:");
  console.error(error.message);
  process.exit(1);
});