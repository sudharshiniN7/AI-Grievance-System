const Complaint = require("../models/Complaint");

/**
 * SLA Controller
 * ----------------
 * Handles SLA (Service Level Agreement) tracking and escalation of
 * overdue complaints — i.e. complaints still open past their slaDueAt.
 */

const OPEN_STATUSES = ["Registered", "Under Review", "In Progress"];

/**
 * GET /api/complaints/sla/overdue
 * Returns all currently open complaints that have passed their SLA due date.
 */
async function getOverdueComplaints(req, res) {
  try {
    const now = new Date();

    const overdue = await Complaint.find({
      status: { $in: OPEN_STATUSES },
      slaDueAt: { $lt: now },
    }).sort({ slaDueAt: 1 });

    return res.status(200).json({
      success: true,
      count: overdue.length,
      data: overdue,
    });
  } catch (error) {
    console.error("getOverdueComplaints error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch overdue complaints." });
  }
}

/**
 * GET /api/complaints/:id/sla
 * Returns SLA status for a single complaint: due date, whether it's
 * overdue, and hours remaining/overdue.
 */
async function getSlaStatus(req, res) {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const now = new Date();
    const isOpen = OPEN_STATUSES.includes(complaint.status);
    const msDiff = complaint.slaDueAt.getTime() - now.getTime();
    const hoursDiff = Math.round(msDiff / (1000 * 60 * 60));
    const isOverdue = isOpen && msDiff < 0;

    return res.status(200).json({
      success: true,
      data: {
        complaintId: complaint.complaintId,
        status: complaint.status,
        priority: complaint.priority,
        slaDueAt: complaint.slaDueAt,
        isOverdue,
        isEscalated: complaint.isEscalated,
        hoursRemaining: isOpen ? hoursDiff : null,
      },
    });
  } catch (error) {
    console.error("getSlaStatus error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch SLA status." });
  }
}

/**
 * POST /api/complaints/sla/escalate
 * Finds all open, overdue, not-yet-escalated complaints and escalates them:
 * marks isEscalated = true, bumps priority to High (if not already), and
 * logs the escalation to statusHistory.
 *
 * Designed to be called either manually (via this endpoint) or from a
 * scheduled job (e.g. a cron task calling this same logic periodically).
 */
async function escalateOverdueComplaints(req, res) {
  try {
    const result = await runEscalationSweep();

    return res.status(200).json({
      success: true,
      message: `Escalation sweep complete. ${result.escalatedCount} complaint(s) escalated.`,
      data: result.escalated,
    });
  } catch (error) {
    console.error("escalateOverdueComplaints error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to run escalation sweep." });
  }
}

/**
 * Core escalation logic, separated from the HTTP handler so it can also
 * be called directly (e.g. by a future cron job) without needing req/res.
 */
async function runEscalationSweep() {
  const now = new Date();

  const overdueUnescalated = await Complaint.find({
    status: { $in: OPEN_STATUSES },
    slaDueAt: { $lt: now },
    isEscalated: false,
  });

  const escalated = [];

  for (const complaint of overdueUnescalated) {
    complaint.isEscalated = true;

    if (complaint.priority !== "High") {
      complaint.priority = "High";
    }

    complaint.statusHistory.push({
      status: complaint.status, // status itself doesn't change, just flagged
      note: "Escalated automatically — complaint exceeded its SLA due date.",
      timestamp: now,
    });

    await complaint.save();
    escalated.push(complaint);
  }

  return { escalatedCount: escalated.length, escalated };
}

module.exports = {
  getOverdueComplaints,
  getSlaStatus,
  escalateOverdueComplaints,
  runEscalationSweep,
};