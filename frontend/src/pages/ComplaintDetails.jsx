import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getComplaintById } from "../services/api";
import "./ComplaintDetails.css";

function statusBadgeClass(status) {
  if (status === "Resolved") return "status-badge status-badge-resolved";
  if (status === "Rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function formatDateTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ComplaintDetails() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadComplaint() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await getComplaintById(id);
        if (isMounted) setComplaint(response.data);
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || "Complaint not found.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComplaint();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="card">
        <p>Loading complaint details…</p>
      </div>
    );
  }

  if (errorMessage || !complaint) {
    return (
      <div className="card">
        <h2>Complaint not found</h2>
        <p>{errorMessage || "We couldn't find a complaint with this ID."}</p>
        <Link to="/complaints/history" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Back to History
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="details-breadcrumb">
        <Link to="/complaints/history">Complaint History</Link>
        <span>/</span>
        <span>{complaint.complaintId}</span>
      </div>

      <div className="details-header">
        <div>
          <h1>{complaint.complaintId}</h1>
          <p>
            {complaint.route?.from} → {complaint.route?.to}
          </p>
        </div>
        <div className="details-header-actions">
          <span className={statusBadgeClass(complaint.status)}>{complaint.status}</span>
          <Link
            to={`/complaints/${complaint.complaintId}/ai-analysis`}
            className="btn btn-secondary"
          >
            View AI Analysis
          </Link>
        </div>
      </div>

      <div className="details-grid">
        <div className="card details-main">
          <h2>Complaint Description</h2>
          <p className="details-description">{complaint.description}</p>

          {complaint.images?.length > 0 && (
            <>
              <h3>Attached Evidence</h3>
              <div className="details-images">
                {complaint.images.map((name, i) => (
                  <div className="image-upload-preview" key={name + i} style={{ width: 140, height: 100 }}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        fontSize: 12,
                        color: "var(--color-text-muted)",
                        textAlign: "center",
                        padding: "0 8px",
                      }}
                    >
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="details-sidebar">
          <div className="card details-info-card">
            <h3>Passenger Details</h3>
            <div className="details-info-row">
              <span>Name</span>
              <strong>{complaint.passengerName}</strong>
            </div>
            <div className="details-info-row">
              <span>Contact</span>
              <strong>
                {complaint.email} · {complaint.phone}
              </strong>
            </div>
          </div>

          <div className="card details-info-card">
            <h3>Journey Details</h3>
            <div className="details-info-row">
              <span>Mode</span>
              <strong>{complaint.transportMode}</strong>
            </div>
            <div className="details-info-row">
              <span>Location</span>
              <strong>{complaint.location}</strong>
            </div>
            <div className="details-info-row">
              <span>Travel Date</span>
              <strong>{formatDate(complaint.travelDate)}</strong>
            </div>
          </div>

          <div className="card details-info-card">
            <h3>Complaint Meta</h3>
            <div className="details-info-row">
              <span>Category</span>
              <strong>{complaint.category}</strong>
            </div>
            {complaint.subcategory && (
              <div className="details-info-row">
                <span>Subcategory</span>
                <strong>{complaint.subcategory}</strong>
              </div>
            )}
            <div className="details-info-row">
              <span>Submitted On</span>
              <strong>{formatDateTime(complaint.createdAt)}</strong>
            </div>
            <div className="details-info-row">
              <span>Priority</span>
              <strong>{complaint.priority}</strong>
            </div>
            {complaint.severity && (
              <div className="details-info-row">
                <span>Severity</span>
                <strong>{complaint.severity}</strong>
              </div>
            )}
            <div className="details-info-row">
              <span>Assigned To</span>
              <strong>{complaint.assignedDepartment || "Not yet assigned"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;