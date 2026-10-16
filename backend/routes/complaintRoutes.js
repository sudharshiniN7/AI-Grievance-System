const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateStatus,
  assignDepartment,
  updatePriority,
} = require("../controllers/complaintController");

const {
  validateComplaintCreate,
  validateStatusUpdate,
  validatePriorityUpdate,
} = require("../middleware/validateComplaint");

const {
  getOverdueComplaints,
  getSlaStatus,
  escalateOverdueComplaints,
} = require("../controllers/slaController");

/**
 * Complaint Routes
 * -----------------
 * Base path (mounted in server.js): /api/complaints
 *
 * Order matters: specific/static paths (e.g. "/sla/overdue") must be
 * declared before dynamic "/:id" routes, otherwise Express would treat
 * "sla" as a complaint ID.
 */

const { protect, requireRole } = require("../middleware/authMiddleware");

// POST   /api/complaints            -> create a new complaint
// GET    /api/complaints            -> list complaints (supports ?status, ?category, ?department, ?priority)
router.route("/").post(validateComplaintCreate, createComplaint).get(getAllComplaints);

// GET    /api/complaints/sla/overdue   -> list all overdue, open complaints
// POST   /api/complaints/sla/escalate  -> run escalation sweep on overdue complaints (admin only)
router.get("/sla/overdue", getOverdueComplaints);
router.post("/sla/escalate", protect, requireRole("admin"), escalateOverdueComplaints);

// GET    /api/complaints/:id        -> get a single complaint by complaintId (e.g. GR-20482)
router.route("/:id").get(getComplaintById);

// GET    /api/complaints/:id/sla    -> get SLA status for a single complaint
router.get("/:id/sla", getSlaStatus);

// PATCH  /api/complaints/:id/status    -> update status (admin only)
router.patch("/:id/status", protect, requireRole("admin"), validateStatusUpdate, updateStatus);

// PATCH  /api/complaints/:id/assign    -> assign department (admin only)
router.patch("/:id/assign", protect, requireRole("admin"), assignDepartment);

// PATCH  /api/complaints/:id/priority  -> update priority (admin only)
router.patch("/:id/priority", protect, requireRole("admin"), validatePriorityUpdate, updatePriority);

module.exports = router;