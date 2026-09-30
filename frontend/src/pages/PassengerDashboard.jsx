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

  const summaryCards = stats
    ? [
        { label: "Total Complaints", value: stats.totalComplaints },
        {
          label: "In Progress",
          value:
            (stats.statusBreakdown["In Progress"] || 0) +
            (stats.statusBreakdown["Under Review"] || 0),
        },
        { label: "Resolved", value: stats.statusBreakdown["Resolved"] || 0 },
        { label: "Overdue", value: stats.overdueCount },
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