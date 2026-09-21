import { Link, useParams } from "react-router-dom";
import "./ComplaintDetails.css";

const MOCK_DETAILS = {
  id: "GR-20481",
  status: "pending",
  statusLabel: "In Progress",
  category: "Cleanliness",
  transportMode: "Train",
  route: "Chennai Central → Bengaluru City",
  location: "Coach S4, near seat 34",
  travelDate: "17 Sep 2026",
  submittedOn: "18 Sep 2026, 10:24 AM",
  passengerName: "Priya Sharma",
  contact: "priya.sharma@email.com · +91 98765 43210",
  description:
    "The coach was not cleaned before departure. Washroom in S4 had no water and the floor was littered with waste from the previous trip. Raised this with the attendant but no action was taken during the journey.",
  images: [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&q=60",
    "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=300&q=60",
  ],
  assignedTo: "Station Maintenance — Chennai Division",
  aiPriority: "Medium",
};

function statusBadgeClass(status) {
  if (status === "resolved") return "status-badge status-badge-resolved";
  if (status === "rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function ComplaintDetails() {
  const { id } = useParams();
  const complaint = { ...MOCK_DETAILS, id: id || MOCK_DETAILS.id };

  return (
    <div>
      <div className="details-breadcrumb">
        <Link to="/complaints/history">Complaint History</Link>
        <span>/</span>
        <span>{complaint.id}</span>
      </div>

      <div className="details-header">
        <div>
          <h1>{complaint.id}</h1>
          <p>{complaint.route}</p>
        </div>
        <div className="details-header-actions">
          <span className={statusBadgeClass(complaint.status)}>
            {complaint.statusLabel}
          </span>
          <Link
            to={`/complaints/${complaint.id}/ai-analysis`}
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

          {complaint.images.length > 0 && (
            <>
              <h3>Attached Evidence</h3>
              <div className="details-images">
                {complaint.images.map((src, i) => (
                  <img src={src} alt={`Evidence ${i + 1}`} key={src} />
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
              <strong>{complaint.contact}</strong>
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
              <strong>{complaint.travelDate}</strong>
            </div>
          </div>

          <div className="card details-info-card">
            <h3>Complaint Meta</h3>
            <div className="details-info-row">
              <span>Category</span>
              <strong>{complaint.category}</strong>
            </div>
            <div className="details-info-row">
              <span>Submitted On</span>
              <strong>{complaint.submittedOn}</strong>
            </div>
            <div className="details-info-row">
              <span>AI Priority</span>
              <strong>{complaint.aiPriority}</strong>
            </div>
            <div className="details-info-row">
              <span>Assigned To</span>
              <strong>{complaint.assignedTo}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;