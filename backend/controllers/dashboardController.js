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

async function getAdminAnalytics(req, res) {
  try {
    const now = new Date();

    const [
      totalCount,
      categoryAgg,
      transportAgg,
      priorityAgg,
      statusAgg,
      locationAgg,
      routeAgg,
      sentimentAgg,
      recurringAgg,
      trendsAgg,
      overdueCount,
      escalatedCount,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            resolvedCount: {
              $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: "$transportMode",
            count: { $sum: 1 },
            highPriorityCount: {
              $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { location: { $exists: true, $ne: "" } } },
        { $group: { _id: "$location", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Complaint.aggregate([
        {
          $match: {
            "route.from": { $exists: true, $ne: "" },
            "route.to": { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: { from: "$route.from", to: "$route.to" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Complaint.aggregate([
        { $match: { sentiment: { $ne: null } } },
        { $group: { _id: "$sentiment", count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { subcategory: { $ne: null, $ne: "" } } },
        {
          $group: {
            _id: { category: "$category", subcategory: "$subcategory" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            resolved: {
              $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 14 },
      ]),
      Complaint.countDocuments({
        status: { $in: OPEN_STATUSES },
        slaDueAt: { $lt: now },
      }),
      Complaint.countDocuments({ isEscalated: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalComplaints: totalCount,
        overdueCount,
        escalatedCount,
        categoryDistribution: categoryAgg.map((item) => ({
          category: item._id || "Unspecified",
          count: item.count,
          resolvedCount: item.resolvedCount,
        })),
        transportDistribution: transportAgg.map((item) => ({
          transportMode: item._id || "Other",
          count: item.count,
          highPriorityCount: item.highPriorityCount,
        })),
        priorityDistribution: priorityAgg.reduce((acc, item) => {
          acc[item._id || "Medium"] = item.count;
          return acc;
        }, {}),
        statusDistribution: statusAgg.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topLocations: locationAgg.map((item) => ({
          location: item._id,
          count: item.count,
        })),
        topRoutes: routeAgg.map((item) => ({
          from: item._id.from,
          to: item._id.to,
          count: item.count,
        })),
        sentimentDistribution: sentimentAgg.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recurringPatterns: recurringAgg.map((item) => ({
          category: item._id.category,
          subcategory: item._id.subcategory,
          count: item.count,
        })),
        recentTrends: trendsAgg.map((item) => ({
          date: item._id,
          total: item.count,
          resolved: item.resolved,
        })),
      },
    });
  } catch (error) {
    console.error("getAdminAnalytics error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate grievance intelligence analytics.",
    });
  }
}

module.exports = {
  getDashboardStats,
  getRecentComplaints,
  getAdminAnalytics,
};