import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getComplaintById } from "../services/api";
import "./ComplaintTracking.css";

// Maps backend status values to a display label + timeline ordering.
// Backend statuses: Registered, Under Review, In Progress, Resolved, Rejected
const TIMELINE_STEPS = ["Registered", "Under Review", "In Progress", "Resolved"];

function buildTimeline(complaint) {
  // If rejected, show a short two-step timeline instead of the full flow.
  if (complaint.status === "Rejected") {
    return [
      {
        title: "Complaint Registered",
        description: "Your complaint was received and logged.",
        date: formatDate(complaint.createdAt),
        state: "done",
      },
      {
        title: "Rejected",
        description:
          complaint.statusHistory?.slice(-1)[0]?.note ||
          "This complaint was reviewed and rejected.",
        date: formatDate(complaint.updatedAt),
        state: "rejected",
      },
    ];
  }

  const currentIndex = TIMELINE_STEPS.indexOf(complaint.status);

  return TIMELINE_STEPS.map((step, index) => {
    // Find a matching history entry for this step, if one exists, for its date/note.
    const historyEntry = complaint.statusHistory?.find((h) => h.status === step);

    let state = "upcoming";
    if (index < currentIndex) state = "done";
    else if (index === currentIndex) state = "active";

    return {
      title: step,
      description: historyEntry?.note || defaultStepDescription(step),
      date: historyEntry ? formatDate(historyEntry.timestamp) : "Pending",
      state,
    };
  });
}

function defaultStepDescription(step) {
  switch (step) {
    case "Registered":
      return "Complaint received and logged.";
    case "Under Review":
      return "Your complaint is being reviewed.";
    case "In Progress":
      return "Concerned department is acting on your complaint.";
    case "Resolved":
      return "Awaiting confirmation of resolution.";
    default:
      return "";
  }
}

function formatDate(dateString) {
  if (!dateString) return "Pending";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status) {
  if (status === "Resolved") return "status-badge status-badge-resolved";
  if (status === "Rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function ComplaintTracking() {
  const location = useLocation();
  const prefilledId = location.state?.complaintId || "";

  const [complaintId, setComplaintId] = useState(prefilledId);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function runSearch(id) {
    const trimmedId = id.trim();
    if (!trimmedId) return;

    setIsLoading(true);
    setSearched(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await getComplaintById(trimmedId);
      setResult(response.data);
    } catch (error) {
      setErrorMessage(error.message || "Complaint not found.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    runSearch(complaintId);
  }

  // If we arrived here right after submitting a complaint, auto-search it.
  useEffect(() => {
    if (prefilledId) {
      runSearch(prefilledId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledId]);

  return (
    <div>
      <div className="page-header">
        <h1>Track Complaint</h1>
        <p>Enter your complaint reference ID to view its current status.</p>
      </div>

      <form className="card tracking-search" onSubmit={handleSearch}>
        <div className="form-field">
          <label htmlFor="complaintId">Complaint ID</label>
          <input
            id="complaintId"
            type="text"
            placeholder="e.g. GR-20481"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? "Searching…" : "Track"}
        </button>
      </form>

      {searched && !isLoading && !result && (
        <div className="card tracking-empty">
          <h3>No complaint found</h3>
          <p>{errorMessage || "We couldn't find a complaint with that ID. Double-check the reference number."}</p>
        </div>
      )}

      {result && (
        <div className="card tracking-result">
          <div className="tracking-result-header">
            <div>
              <h2>{result.complaintId}</h2>
              <p>
                {result.route?.from} → {result.route?.to}
              </p>
            </div>
            <span className={statusBadgeClass(result.status)}>{result.status}</span>
          </div>

          <div className="tracking-result-meta">
            <div>
              <span>Category</span>
              <strong>{result.category}</strong>
            </div>
            <div>
              <span>Submitted On</span>
              <strong>{formatDate(result.createdAt)}</strong>
            </div>
          </div>

          <div className="tracking-timeline">
            {buildTimeline(result).map((step, index) => (
              <div className={`tracking-step tracking-step-${step.state}`} key={step.title}>
                <div className="tracking-step-marker">
                  {step.state === "done" ? "✓" : step.state === "rejected" ? "✕" : index + 1}
                </div>
                <div className="tracking-step-content">
                  <div className="tracking-step-title-row">
                    <h4>{step.title}</h4>
                    <span>{step.date}</span>
                  </div>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintTracking;