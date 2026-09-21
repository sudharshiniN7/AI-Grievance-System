import { useState } from "react";
import "./ComplaintTracking.css";

const MOCK_COMPLAINT = {
  id: "GR-20481",
  category: "Cleanliness",
  route: "Chennai Central → Bengaluru City",
  submittedOn: "18 Sep 2026",
  status: "In Progress",
  timeline: [
    {
      title: "Complaint Registered",
      description: "Your complaint was received and assigned reference ID GR-20481.",
      date: "18 Sep, 10:24 AM",
      state: "done",
    },
    {
      title: "AI Analysis Completed",
      description: "Categorised as Cleanliness, priority set to Medium.",
      date: "18 Sep, 10:26 AM",
      state: "done",
    },
    {
      title: "Assigned to Department",
      description: "Forwarded to Station Maintenance team for action.",
      date: "18 Sep, 02:10 PM",
      state: "done",
    },
    {
      title: "Under Review",
      description: "Maintenance team is inspecting the reported coach.",
      date: "19 Sep, 09:00 AM",
      state: "active",
    },
    {
      title: "Resolved",
      description: "Awaiting confirmation of resolution.",
      date: "Pending",
      state: "upcoming",
    },
  ],
};

function ComplaintTracking() {
  const [complaintId, setComplaintId] = useState("");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    setSearched(true);
    // Frontend only — matches against a single mock complaint for demo purposes.
    if (complaintId.trim().toUpperCase() === MOCK_COMPLAINT.id) {
      setResult(MOCK_COMPLAINT);
    } else {
      setResult(null);
    }
  }

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
        <button type="submit" className="btn btn-primary">
          Track
        </button>
      </form>

      {searched && !result && (
        <div className="card tracking-empty">
          <h3>No complaint found</h3>
          <p>
            We couldn't find a complaint with that ID. Double-check the reference
            number, or try <strong>GR-20481</strong> for a demo result.
          </p>
        </div>
      )}

      {result && (
        <div className="card tracking-result">
          <div className="tracking-result-header">
            <div>
              <h2>{result.id}</h2>
              <p>{result.route}</p>
            </div>
            <span className="status-badge status-badge-pending">{result.status}</span>
          </div>

          <div className="tracking-result-meta">
            <div>
              <span>Category</span>
              <strong>{result.category}</strong>
            </div>
            <div>
              <span>Submitted On</span>
              <strong>{result.submittedOn}</strong>
            </div>
          </div>

          <div className="tracking-timeline">
            {result.timeline.map((step, index) => (
              <div className={`tracking-step tracking-step-${step.state}`} key={step.title}>
                <div className="tracking-step-marker">
                  {step.state === "done" ? "✓" : index + 1}
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