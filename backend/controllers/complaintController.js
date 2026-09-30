const Complaint = require("../models/Complaint");

/**
 * Complaint Controller
 * ----------------------
 * Core CRUD logic for complaints: create, list, retrieve by ID,
 * update status, assign department, update priority.
 * SLA/escalation and dashboard statistics are handled in separate
 * controller files (coming in later steps).
 */

// SLA hours by priority — mirrors the logic used when a complaint is created.
const SLA_HOURS = { High: 24, Medium: 72, Low: 120 };

function calculateSlaDueDate(priority, fromDate = new Date()) {
  const hours = SLA_HOURS[priority] || SLA_HOURS.Medium;
  const due = new Date(fromDate);
  due.setHours(due.getHours() + hours);
  return due;
}

async function generateComplaintId() {
  const count = await Complaint.countDocuments();
  return `GR-${20481 + count + 1}`;
}

/**
 * POST /api/complaints
 * Creates a new complaint.
 */
async function createComplaint(req, res) {
  try {
    const {
      passengerName,
      email,
      phone,
      transportMode,
      routeFrom,
      routeTo,
      travelDate,
      location,
      category,
      description,
      images,
      priority,
    } = req.body;

    const complaintId = await generateComplaintId();
    const resolvedPriority = priority || "Medium";
    const now = new Date();

    const complaint = await Complaint.create({
      complaintId,
      passengerName,
      email,
      phone,
      transportMode,
      route: { from: routeFrom, to: routeTo },
      travelDate: travelDate || null,
      location,
      category,
      description,
      images: images || [],
      priority: resolvedPriority,
      status: "Registered",
      slaDueAt: calculateSlaDueDate(resolvedPriority, now),
      statusHistory: [
        {
          status: "Registered",
          note: "Complaint received and logged.",
          timestamp: now,
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully.",
      data: complaint,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(" ") });
    }
    console.error("createComplaint error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create complaint." });
  }
}

/**
 * GET /api/complaints
 * Lists complaints, with optional filtering via query params:
 * ?status=In Progress&category=Cleanliness&department=Station Maintenance
 */
async function getAllComplaints(req, res) {
  try {
    const { status, category, department, priority } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (department) filter.assignedDepartment = department;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints,
    });
  } catch (error) {
    console.error("getAllComplaints error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch complaints." });
  }
}

/**
 * GET /api/complaints/:id
 * Retrieves a single complaint by its complaintId (e.g. GR-20482).
 */
async function getComplaintById(req, res) {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    return res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    console.error("getComplaintById error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch complaint." });
  }
}

/**
 * PATCH /api/complaints/:id/status
 * Updates a complaint's status and logs it to statusHistory.
 * Body: { status: "In Progress", note: "optional note" }
 */
async function updateStatus(req, res) {
  try {
    const { status, note } = req.body;
    const complaint = await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    complaint.addStatusHistory(status, note || "");
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to "${status}".`,
      data: complaint,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(" ") });
    }
    console.error("updateStatus error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update status." });
  }
}

/**
 * PATCH /api/complaints/:id/assign
 * Assigns a complaint to a department.
 * Body: { department: "Station Maintenance — Chennai Division" }
 */
async function assignDepartment(req, res) {
  try {
    const { department } = req.body;

    if (!department || !department.trim()) {
      return res.status(400).json({ success: false, message: "Department is required." });
    }

    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.id },
      { assignedDepartment: department },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Complaint assigned to ${department}.`,
      data: complaint,
    });
  } catch (error) {
    console.error("assignDepartment error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to assign department." });
  }
}

/**
 * PATCH /api/complaints/:id/priority
 * Updates a complaint's priority and recalculates its SLA due date.
 * Body: { priority: "High" }
 */
async function updatePriority(req, res) {
  try {
    const { priority } = req.body;

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value." });
    }

    const complaint = await Complaint.findOne({ complaintId: req.params.id });

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    complaint.priority = priority;
    complaint.slaDueAt = calculateSlaDueDate(priority, complaint.createdAt);
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Priority updated to "${priority}".`,
      data: complaint,
    });
  } catch (error) {
    console.error("updatePriority error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update priority." });
  }
}

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateStatus,
  assignDepartment,
  updatePriority,
};