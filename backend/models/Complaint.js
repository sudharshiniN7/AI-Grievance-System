const mongoose = require("mongoose");

/**
 * Complaint Schema
 * -----------------
 * Mongoose schema/model for passenger complaints, backed by MongoDB.
 */

// ---------- Allowed enum values ----------
const TRANSPORT_MODES = ["Train", "Bus", "Metro", "Flight", "Ferry"];
const CATEGORIES = [
  "Delay",
  "Cleanliness",
  "Staff Behaviour",
  "Safety Concern",
  "Ticketing / Billing",
  "Other",
];
const STATUSES = [
  "Registered",
  "Under Review",
  "In Progress",
  "Resolved",
  "Rejected",
];
const PRIORITIES = ["Low", "Medium", "High"];
const SENTIMENTS = ["Positive", "Neutral", "Negative"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

// ---------- Status History sub-schema ----------
// Embedded document — logs every status transition for a complaint,
// used by the complaint tracking / timeline UI.
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// ---------- Resolution sub-schema ----------
// Captures how a complaint was closed out, once resolved.
const resolutionSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      default: null,
    },
    resolvedBy: {
      type: String,
      trim: true,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

// ---------- Main Complaint schema ----------
const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    // ----- Passenger details -----
    passengerName: {
      type: String,
      required: [true, "Passenger name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\d{10}$/, "Phone number must be a 10-digit number"],
    },

    // ----- Journey details -----
    transportMode: {
      type: String,
      required: [true, "Transport mode is required"],
      enum: {
        values: TRANSPORT_MODES,
        message: "{VALUE} is not a supported transport mode",
      },
    },
    route: {
      from: {
        type: String,
        required: [true, "Route origin is required"],
        trim: true,
      },
      to: {
        type: String,
        required: [true, "Route destination is required"],
        trim: true,
      },
    },
    travelDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      required: [true, "Location of incident is required"],
      trim: true,
    },

    // ----- Complaint details -----
    category: {
      type: String,
      required: [true, "Complaint category is required"],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a supported category",
      },
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
    },
    images: {
      type: [String], // stored file paths / URLs
      default: [],
    },

    // ----- AI-assigned fields -----
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "Medium",
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: null,
    },
    sentiment: {
      type: String,
      enum: SENTIMENTS,
      default: null,
    },
    extractedEntities: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Flexible object populated by the AI/NLP service, e.g.:
      // { stations: [...], dates: [...], staffMentions: [...], trainNumbers: [...] }
    },

    // ----- Assignment / workflow -----
    assignedDepartment: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "Registered",
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },

    // ----- SLA tracking -----
    slaDueAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },

    // ----- Resolution details -----
    resolution: {
      type: resolutionSchema,
      default: () => ({}),
    },

    // ----- History log -----
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    // Adds createdAt and updatedAt automatically, matching
    // "created date" / "updated date" requirements.
    timestamps: true,
  }
);

// ---------- Indexes ----------
// Speeds up common dashboard queries (filter by status, priority, SLA).
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ slaDueAt: 1 });

// ---------- Instance helper ----------
// Convenience method to append a status change to history in one call.
complaintSchema.methods.addStatusHistory = function (status, note = "") {
  this.statusHistory.push({ status, note, timestamp: new Date() });
  this.status = status;
  if (status === "Resolved") {
    this.resolvedAt = new Date();
  }
};

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
module.exports.TRANSPORT_MODES = TRANSPORT_MODES;
module.exports.CATEGORIES = CATEGORIES;
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.SENTIMENTS = SENTIMENTS;
module.exports.SEVERITIES = SEVERITIES;