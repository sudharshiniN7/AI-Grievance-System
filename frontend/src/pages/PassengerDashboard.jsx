import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats, getRecentComplaints } from "../services/api";
import "./PassengerDashboard.css";

function statusBadgeClass(status) {
  if (status === "Resolved") return "status-badge status-badge-resolved";
  if (status === "Rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PassengerDashboard() {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [statsResponse, recentResponse] = await Promise.all([
          getDashboardStats(),
          getRecentComplaints(5),
        ]);
        if (isMounted) {
          setStats(statsResponse.data);
          setRecentComplaints(recentResponse.data);
        }
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || "Failed to load dashboard.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);
  const ICONS = {
  total: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12h6M9 16h6M9 8h6" />
      <rect x="4" y="3" width="16" height="18" rx="2" />
    </svg>
  ),
  progress: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  resolved: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  ),
  overdue: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7 3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  ),
};
  const summaryCards = stats
  ? [
      {
        key: "total",
        label: "Total Complaints",
        value: stats.totalComplaints,
        className: "dashboard-summary-card-total",
      },
      {
        key: "progress",
        label: "In Progress",
        value:
          (stats.statusBreakdown["In Progress"] || 0) +
          (stats.statusBreakdown["Under Review"] || 0),
        className: "dashboard-summary-card-progress",
      },
      {
        key: "resolved",
        label: "Resolved",
        value: stats.statusBreakdown["Resolved"] || 0,
        className: "dashboard-summary-card-resolved",
      },
      {
        key: "overdue",
        label: "Overdue",
        value: stats.overdueCount,
        className: "dashboard-summary-card-overdue",
      },
    ]
  : [];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back</h1>
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

      {isLoading && (
        <div className="card">
          <p>Loading dashboard…</p>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="card">
          <p>{errorMessage}</p>
        </div>
      )}

      {!isLoading && !errorMessage && stats && (
        <>
          <div className="dashboard-summary-grid">
  {summaryCards.map((s) => (
    <div className={`card dashboard-summary-card ${s.className}`} key={s.label}>
      <span className="dashboard-summary-icon" aria-hidden="true">
        {ICONS[s.key]}
      </span>
      <span className="dashboard-summary-text">
        <span className="dashboard-summary-value">{s.value}</span>
        <span className="dashboard-summary-label">{s.label}</span>
      </span>
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
                <span>Passenger</span>
                <span>Date</span>
                <span>Status</span>
              </div>

              {recentComplaints.map((c) => (
                <Link
                  to={`/complaints/${c.complaintId}`}
                  className="dashboard-table-row"
                  key={c.complaintId}
                >
                  <span className="dashboard-table-id">{c.complaintId}</span>
                  <span>{c.category}</span>
                  <span className="dashboard-table-route">{c.passengerName}</span>
                  <span>{formatDate(c.createdAt)}</span>
                  <span>
                    <span className={statusBadgeClass(c.status)}>{c.status}</span>
                  </span>
                </Link>
              ))}

              {recentComplaints.length === 0 && (
                <div className="history-empty">No complaints yet.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PassengerDashboard;