import { Link } from "react-router-dom";
import "./PassengerDashboard.css";

const SUMMARY = [
  { label: "Total Complaints", value: 8 },
  { label: "In Progress", value: 3 },
  { label: "Resolved", value: 4 },
  { label: "Rejected", value: 1 },
];

const RECENT_COMPLAINTS = [
  {
    id: "GR-20481",
    category: "Cleanliness",
    route: "Chennai Central → Bengaluru City",
    status: "pending",
    statusLabel: "In Progress",
    date: "18 Sep 2026",
  },
  {
    id: "GR-20463",
    category: "Staff Behaviour",
    route: "Coimbatore Jn → Chennai Egmore",
    status: "resolved",
    statusLabel: "Resolved",
    date: "10 Sep 2026",
  },
  {
    id: "GR-20440",
    category: "Delay",
    route: "Madurai Jn → Chennai Central",
    status: "rejected",
    statusLabel: "Rejected",
    date: "02 Sep 2026",
  },
  {
    id: "GR-20431",
    category: "Safety Concern",
    route: "Local Bus Route 21G",
    status: "pending",
    statusLabel: "Under Review",
    date: "29 Aug 2026",
  },
];

function statusBadgeClass(status) {
  if (status === "resolved") return "status-badge status-badge-resolved";
  if (status === "rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function PassengerDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, Priya</h1>
        <p>Here's an overview of your complaints and recent activity.</p>
      </div>

      <div className="dashboard-actions">
        <Link to="/complaints/new" className="btn btn-primary">
          + Register New Complaint
        </Link>
        <Link to="/complaints/track" className="btn btn-secondary">
          Track a Complaint
        </Link>
      </div>

      <div className="dashboard-summary-grid">
        {SUMMARY.map((s) => (
          <div className="card dashboard-summary-card" key={s.label}>
            <span className="dashboard-summary-value">{s.value}</span>
            <span className="dashboard-summary-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="card dashboard-recent">
        <div className="dashboard-recent-header">
          <h2>Recent Complaints</h2>
          <Link to="/complaints/history">View all</Link>
        </div>

        <div className="dashboard-table">
          <div className="dashboard-table-row dashboard-table-head">
            <span>Complaint ID</span>
            <span>Category</span>
            <span>Route</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          {RECENT_COMPLAINTS.map((c) => (
            <Link
              to={`/complaints/${c.id}`}
              className="dashboard-table-row"
              key={c.id}
            >
              <span className="dashboard-table-id">{c.id}</span>
              <span>{c.category}</span>
              <span className="dashboard-table-route">{c.route}</span>
              <span>{c.date}</span>
              <span>
                <span className={statusBadgeClass(c.status)}>{c.statusLabel}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PassengerDashboard;