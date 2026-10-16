import { useState } from "react";
import {
  updateComplaintStatus,
  assignDepartment,
  updatePriority,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const DEPARTMENTS = [
  "Operations",
  "Station Maintenance",
  "Ticketing & Commercial",
  "Cleanliness & Catering",
  "Security / RPF",
  "Electrical & Mechanical",
  "General Grievance Cell",
];

function AdminComplaintModal({ complaint, onClose, onUpdated }) {
  const { user } = useAuth();

  const [currentComplaint, setCurrentComplaint] = useState(complaint);
  const [selectedStatus, setSelectedStatus] = useState(complaint.status);
  const [statusNote, setStatusNote] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState(
    complaint.resolution?.summary || ""
  );
  const [selectedDept, setSelectedDept] = useState(
    complaint.assignedDepartment || ""
  );
  const [customDept, setCustomDept] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(
    complaint.priority || "Medium"
  );

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingDept, setIsUpdatingDept] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setIsUpdatingStatus(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await updateComplaintStatus(currentComplaint.complaintId, {
        status: selectedStatus,
        note: statusNote.trim() || undefined,
        resolutionSummary:
          selectedStatus === "Resolved"
            ? resolutionSummary.trim() || "Resolved by administrative team."
            : undefined,
        resolvedBy: user?.fullName || "Administrator",
      });
      setCurrentComplaint(res.data);
      setStatusNote("");
      showMsg(`Status successfully updated to "${selectedStatus}".`);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      showMsg(err.message || "Failed to update complaint status.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeptChange = async (e) => {
    e.preventDefault();
    const deptToAssign = customDept.trim() || selectedDept;
    if (!deptToAssign) {
      showMsg("Please select or enter a department.", "error");
      return;
    }
    setIsUpdatingDept(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await assignDepartment(currentComplaint.complaintId, {
        department: deptToAssign,
      });
      setCurrentComplaint(res.data);
      setSelectedDept(res.data.assignedDepartment || "");
      setCustomDept("");
      showMsg(`Department assigned to "${deptToAssign}".`);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      showMsg(err.message || "Failed to assign department.", "error");
    } finally {
      setIsUpdatingDept(false);
    }
  };

  const handlePriorityChange = async (e) => {
    e.preventDefault();
    setIsUpdatingPriority(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await updatePriority(currentComplaint.complaintId, {
        priority: selectedPriority,
      });
      setCurrentComplaint(res.data);
      showMsg(`Priority updated to "${selectedPriority}". SLA recalculated.`);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      showMsg(err.message || "Failed to update priority.", "error");
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // SLA Calculation
  const now = new Date();
  const slaDue = new Date(currentComplaint.slaDueAt);
  const isOpen = ["Registered", "Under Review", "In Progress"].includes(
    currentComplaint.status
  );
  const msDiff = slaDue.getTime() - now.getTime();
  const hoursDiff = Math.round(msDiff / (1000 * 60 * 60));
  const isOverdue = isOpen && msDiff < 0;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="complaint-id-badge" style={{ fontSize: 16 }}>
                {currentComplaint.complaintId}
              </span>
              <span
                className={`status-pill status-${(
                  currentComplaint.status || "Registered"
                ).replace(/\s+/g, "-")}`}
              >
                {currentComplaint.status}
              </span>
              {currentComplaint.isEscalated && (
                <span className="sla-escalated-tag">Escalated</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>
              Submitted on {new Date(currentComplaint.createdAt).toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: 13 }}
          >
            ✕ Close
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal-body">
          {message.text && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background:
                  message.type === "error"
                    ? "var(--color-error-bg)"
                    : "var(--color-success-bg)",
                color:
                  message.type === "error"
                    ? "var(--color-error)"
                    : "var(--color-success)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {message.type === "error" ? "⚠" : "✓"} {message.text}
            </div>
          )}

          {/* Passenger & Journey Overview */}
          <div className="admin-detail-grid">
            <div className="admin-detail-item">
              <label>Passenger Name</label>
              <span>{currentComplaint.passengerName}</span>
            </div>
            <div className="admin-detail-item">
              <label>Email Address</label>
              <span style={{ fontSize: 13 }}>{currentComplaint.email}</span>
            </div>
            <div className="admin-detail-item">
              <label>Phone Number</label>
              <span>{currentComplaint.phone}</span>
            </div>
            <div className="admin-detail-item">
              <label>Transport Mode</label>
              <span>{currentComplaint.transportMode}</span>
            </div>
            <div className="admin-detail-item">
              <label>Route</label>
              <span>
                {currentComplaint.route?.from} → {currentComplaint.route?.to}
              </span>
            </div>
            <div className="admin-detail-item">
              <label>Incident Location</label>
              <span>{currentComplaint.location}</span>
            </div>
          </div>

          {/* Complaint Category & Full Description */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: "var(--color-navy)", fontSize: 15 }}>
                  {currentComplaint.category}
                </span>
                {currentComplaint.subcategory && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      background: "#f1f5f9",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}
                  >
                    {currentComplaint.subcategory}
                  </span>
                )}
              </div>
              <span className={`priority-chip priority-${currentComplaint.priority || "Medium"}`}>
                {currentComplaint.priority || "Medium"} Priority
              </span>
            </div>

            <p style={{ fontSize: 14, color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {currentComplaint.description}
            </p>

            {/* AI Tags if available */}
            {(currentComplaint.sentiment || currentComplaint.severity) && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--color-border)",
                  fontSize: 12,
                }}
              >
                {currentComplaint.sentiment && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Sentiment: </span>
                    <strong>{currentComplaint.sentiment}</strong>
                  </div>
                )}
                {currentComplaint.severity && (
                  <div>
                    <span style={{ color: "var(--color-text-muted)" }}>Severity: </span>
                    <strong>{currentComplaint.severity}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SLA Status Tracker */}
          <div
            style={{
              padding: 14,
              borderRadius: "var(--radius-md)",
              background: isOverdue ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${isOverdue ? "#fecaca" : "#bbf7d0"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ fontWeight: 600 }}>Target SLA Due Date: </span>
              {slaDue.toLocaleString()}
            </div>
            {isOpen && (
              <div
                style={{
                  fontWeight: 700,
                  color: isOverdue ? "var(--color-error)" : "var(--color-success)",
                }}
              >
                {isOverdue ? `Overdue by ${Math.abs(hoursDiff)} hrs` : `${hoursDiff} hrs remaining`}
              </div>
            )}
          </div>

          {/* Existing Resolution Summary (if resolved) */}
          {currentComplaint.resolution?.summary && (
            <div
              style={{
                background: "var(--color-success-bg)",
                border: "1px solid #bbf7d0",
                padding: 16,
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase" }}>
                Resolution Information
              </div>
              <p style={{ fontSize: 13, color: "var(--color-text)", marginTop: 6, fontWeight: 500 }}>
                {currentComplaint.resolution.summary}
              </p>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                Resolved by <strong>{currentComplaint.resolution.resolvedBy || "Administrator"}</strong> on{" "}
                {currentComplaint.resolution.resolvedAt
                  ? new Date(currentComplaint.resolution.resolvedAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          )}

          {/* ADMINISTRATIVE ACTIONS SECTION */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Update Status Card */}
            <form onSubmit={handleStatusChange} className="admin-action-section">
              <h4>Update Complaint Status</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                    New Status
                  </label>
                  <select
                    className="admin-filter-select"
                    style={{ width: "100%" }}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="Registered">Registered</option>
                    <option value="Under Review">Under Review</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {selectedStatus === "Resolved" && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                      Resolution Summary *
                    </label>
                    <textarea
                      rows={2}
                      className="admin-search-input"
                      style={{ width: "100%", resize: "vertical", fontSize: 13 }}
                      placeholder="Explain action taken to resolve this grievance..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                    Timeline Note (Optional)
                  </label>
                  <input
                    type="text"
                    className="admin-search-input"
                    style={{ width: "100%", fontSize: 13 }}
                    placeholder="e.g. Forwarded to station supervisor..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdatingStatus}
                  style={{ alignSelf: "flex-start", padding: "6px 14px", fontSize: 13 }}
                >
                  {isUpdatingStatus ? "Updating…" : "Update Status"}
                </button>
              </div>
            </form>

            {/* Department & Priority Card */}
            <div className="admin-action-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Assign Department */}
              <form onSubmit={handleDeptChange}>
                <h4>Assign Department</h4>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select
                    className="admin-filter-select"
                    style={{ flex: 1 }}
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={isUpdatingDept}
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    {isUpdatingDept ? "Assigning…" : "Assign"}
                  </button>
                </div>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ width: "100%", fontSize: 12, padding: "6px 10px" }}
                  placeholder="Or enter custom department name..."
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                />
              </form>

              {/* Update Priority */}
              <form onSubmit={handlePriorityChange} style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
                <h4>Update Priority & SLA</h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <select
                    className="admin-filter-select"
                    style={{ flex: 1 }}
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <option value="Low">Low Priority (120 hrs SLA)</option>
                    <option value="Medium">Medium Priority (72 hrs SLA)</option>
                    <option value="High">High Priority (24 hrs SLA)</option>
                  </select>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={isUpdatingPriority}
                    style={{ padding: "6px 12px", fontSize: 13 }}
                  >
                    {isUpdatingPriority ? "Saving…" : "Set"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Audit / Status History Timeline */}
          <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)", marginBottom: 12 }}>
              Activity History Timeline
            </h4>
            <div className="admin-timeline">
              {(currentComplaint.statusHistory || []).map((h, i) => (
                <div key={i} className="admin-timeline-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{h.status}</div>
                    {h.note && (
                      <div style={{ color: "var(--color-text)", marginTop: 2 }}>{h.note}</div>
                    )}
                  </div>
                  <div className="admin-timeline-time">
                    {new Date(h.timestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminComplaintModal;
