const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

/**
 * Admin Seed Script
 * --------------------
 * Provisions exactly one designated administrator account from
 * environment variables. Safe to run multiple times — idempotent:
 *   - If no admin exists yet, creates one from env vars.
 *   - If an admin with the configured email already exists, does NOT
 *     create a duplicate or silently overwrite it. Reports its state
 *     and exits, requiring a deliberate manual step to change credentials.
 *   - If a non-admin user already has the configured admin email, this
 *     is flagged as a conflict and the script refuses to proceed
 *     automatically (never silently promotes/overwrites an existing
 *     passenger account to admin).
 *
 * This script is NEVER run automatically on server start — it must be
 * invoked deliberately via `node backend/scripts/seedAdmin.js`.
 *
 * Required environment variables (in backend/.env):
 *   ADMIN_NAME
 *   ADMIN_EMAIL
 *   ADMIN_USER_ID
 *   ADMIN_PASSWORD
 */

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_USER_ID, ADMIN_PASSWORD } = process.env;

  // ---------- Validate required env vars are present ----------
  const missing = [];
  if (!ADMIN_NAME) missing.push("ADMIN_NAME");
  if (!ADMIN_EMAIL) missing.push("ADMIN_EMAIL");
  if (!ADMIN_USER_ID) missing.push("ADMIN_USER_ID");
  if (!ADMIN_PASSWORD) missing.push("ADMIN_PASSWORD");

  if (missing.length > 0) {
    console.error("Cannot provision admin — missing required environment variable(s):");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\nAdd these to backend/.env and run this script again:");
    console.error("  ADMIN_NAME=Your Admin Name");
    console.error("  ADMIN_EMAIL=admin@example.com");
    console.error("  ADMIN_USER_ID=admin001");
    console.error("  ADMIN_PASSWORD=ChooseAStrongPassword123");
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD is too short. Use at least 8 characters.");
    process.exit(1);
  }

  const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();

  await connectDB();

  // ---------- Check for an existing primary admin ----------
  const existingPrimaryAdmin = await User.findOne({ isPrimaryAdmin: true });

  if (existingPrimaryAdmin) {
    console.log("A primary administrator account already exists:");
    console.log(`  Email: ${existingPrimaryAdmin.email}`);
    console.log(`  Admin User ID: ${existingPrimaryAdmin.adminUserId}`);
    console.log(`  Created: ${existingPrimaryAdmin.createdAt}`);
    console.log("\nNo changes made. This script never overwrites an existing admin.");
    console.log(
      "If you need to change admin credentials, do so deliberately via a dedicated " +
        "password-change flow once authenticated, or manually in the database."
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  // ---------- Check for an email/ID conflict with a non-admin user ----------
  const emailConflict = await User.findOne({ email: normalizedEmail });
  if (emailConflict) {
    console.error(
      `A user with email "${normalizedEmail}" already exists and is NOT an admin ` +
        `(role: ${emailConflict.role}).`
    );
    console.error(
      "Refusing to overwrite or promote an existing account automatically. " +
        "Choose a different ADMIN_EMAIL, or resolve this conflict manually."
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const idConflict = await User.findOne({ adminUserId: ADMIN_USER_ID.trim() });
  if (idConflict) {
    console.error(`ADMIN_USER_ID "${ADMIN_USER_ID.trim()}" is already in use.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  // ---------- Create the admin ----------
  const admin = new User({
    fullName: ADMIN_NAME.trim(),
    email: normalizedEmail,
    role: "admin",
    isPrimaryAdmin: true,
    adminUserId: ADMIN_USER_ID.trim(),
    isActive: true,
  });

  await admin.setPassword(ADMIN_PASSWORD);
  await admin.save();

  console.log("Administrator account provisioned successfully:");
  console.log(`  Name: ${admin.fullName}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Admin User ID: ${admin.adminUserId}`);
  console.log("\nPassword was hashed and stored securely. It is not displayed here.");
  console.log("You can now log in using this email/user ID and the password you configured.");

  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error("Admin seeding failed with an unexpected error:");
  console.error(error);
  process.exit(1);
});