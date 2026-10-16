const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRecentComplaints,
  getAdminAnalytics,
} = require("../controllers/dashboardController");

const { protect, requireRole } = require("../middleware/authMiddleware");

/**
 * Dashboard Routes
 * -----------------
 * Base path (mounted in server.js): /api/dashboard
 */

// GET /api/dashboard/stats      -> aggregate statistics
router.get("/stats", getDashboardStats);

// GET /api/dashboard/recent     -> recent complaints (optional ?limit=)
router.get("/recent", getRecentComplaints);

// GET /api/dashboard/analytics  -> grievance intelligence & aggregations (admin only)
router.get("/analytics", protect, requireRole("admin"), getAdminAnalytics);

module.exports = router;