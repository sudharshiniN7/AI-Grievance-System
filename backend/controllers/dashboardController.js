const Complaint = require("../models/Complaint");

/**
 * Dashboard Controller
 * ----------------------
 * Aggregates complaint data into summary statistics for the passenger
 * dashboard / admin overview screens: totals, status breakdown,
 * category breakdown, priority breakdown, and overdue counts.
 */

const OPEN_STATUSES = ["Registered", "Under Review", "In Progress"];

/**
 * GET /api/dashboard/stats
 * Returns aggregate statistics across all complaints.
 */
async function getDashboardStats(req, res) {
  try {
    const now = new Date();

    // ----- Total counts -----
    const totalComplaints = await Complaint.countDocuments();

    // ----- Status breakdown -----
    // e.g. [{ _id: "Resolved", count: 4 }, { _id: "In Progress", count: 3 }, ...]
    const statusAgg = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusBreakdown = statusAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // ----- Category breakdown -----
    const categoryAgg = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const categoryBreakdown = categoryAgg.map((item) => ({
      category: item._id,
      count: item.count,
    }));

    // ----- Priority breakdown -----
    const priorityAgg = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const priorityBreakdown = priorityAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // ----- Overdue / escalated counts -----
    const overdueCount = await Complaint.countDocuments({
      status: { $in: OPEN_STATUSES },
      slaDueAt: { $lt: now },
    });

    const escalatedCount = await Complaint.countDocuments({ isEscalated: true });

    // ----- Resolution rate -----
    const resolvedCount = statusBreakdown["Resolved"] || 0;
    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

    // ----- Average resolution time (in hours), for resolved complaints -----
    const resolvedComplaints = await Complaint.find({
      status: "Resolved",
      resolvedAt: { $ne: null },
    }).select("createdAt resolvedAt");

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        const diffMs = c.resolvedAt.getTime() - c.createdAt.getTime();
        return sum + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedComplaints.length);
    }

    return res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        statusBreakdown,
        categoryBreakdown,
        priorityBreakdown,
        overdueCount,
        escalatedCount,
        resolutionRate, // percentage
        avgResolutionHours,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics." });
  }
}

/**
 * GET /api/dashboard/recent
 * Returns the most recent complaints (default: 5), for a dashboard
 * "recent activity" widget.
 */
async function getRecentComplaints(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    const recent = await Complaint.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("complaintId passengerName category status priority createdAt");

    return res.status(200).json({
      success: true,
      count: recent.length,
      data: recent,
    });
  } catch (error) {
    console.error("getRecentComplaints error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch recent complaints." });
  }
}

module.exports = {
  getDashboardStats,
  getRecentComplaints,
};