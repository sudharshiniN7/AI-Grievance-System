const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRecentComplaints,
} = require("../controllers/dashboardController");

/**
 * Dashboard Routes
 * -----------------
 * Base path (mounted in server.js): /api/dashboard
 */

// GET /api/dashboard/stats   -> aggregate statistics
router.get("/stats", getDashboardStats);

// GET /api/dashboard/recent  -> recent complaints (optional ?limit=)
router.get("/recent", getRecentComplaints);

module.exports = router;