const {
  TRANSPORT_MODES,
  CATEGORIES,
} = require("../models/Complaint");

/**
 * Validation Middleware
 * ------------------------
 * Validates incoming complaint data before it reaches the controller,
 * so bad requests are rejected early with clear error messages.
 */

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^\d{10}$/;

/**
 * Validates the body of a POST /api/complaints request.
 */
function validateComplaintCreate(req, res, next) {
  const errors = [];
  const {
    passengerName,
    email,
    phone,
    transportMode,
    routeFrom,
    routeTo,
    location,
    category,
    description,
  } = req.body;

  if (!passengerName || !passengerName.trim()) {
    errors.push("Passenger name is required.");
  }

  if (!email || !email.trim()) {
    errors.push("Email is required.");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("Email must be a valid email address.");
  }

  if (!phone || !phone.trim()) {
    errors.push("Phone number is required.");
  } else if (!PHONE_REGEX.test(phone.trim())) {
    errors.push("Phone number must be exactly 10 digits.");
  }

  if (!transportMode || !transportMode.trim()) {
    errors.push("Transport mode is required.");
  } else if (!TRANSPORT_MODES.includes(transportMode)) {
    errors.push(`Transport mode must be one of: ${TRANSPORT_MODES.join(", ")}.`);
  }

  if (!routeFrom || !routeFrom.trim()) {
    errors.push("Route origin (routeFrom) is required.");
  }

  if (!routeTo || !routeTo.trim()) {
    errors.push("Route destination (routeTo) is required.");
  }

  if (!location || !location.trim()) {
    errors.push("Location of incident is required.");
  }

  if (!category || !category.trim()) {
    errors.push("Complaint category is required.");
  } else if (!CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${CATEGORIES.join(", ")}.`);
  }

  if (!description || !description.trim()) {
    errors.push("Complaint description is required.");
  } else if (description.trim().length < 10) {
    errors.push("Complaint description must be at least 10 characters long.");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(" ") });
  }

  next();
}

/**
 * Validates the body of a PATCH /api/complaints/:id/status request.
 */
function validateStatusUpdate(req, res, next) {
  const { STATUSES } = require("../models/Complaint");
  const { status } = req.body;

  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${STATUSES.join(", ")}.`,
    });
  }

  next();
}

/**
 * Validates the body of a PATCH /api/complaints/:id/priority request.
 */
function validatePriorityUpdate(req, res, next) {
  const { PRIORITIES } = require("../models/Complaint");
  const { priority } = req.body;

  if (!priority || !PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${PRIORITIES.join(", ")}.`,
    });
  }

  next();
}

module.exports = {
  validateComplaintCreate,
  validateStatusUpdate,
  validatePriorityUpdate,
};