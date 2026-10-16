import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { getDashboardStats, getRecentComplaints, escalateOverdueComplaints } from "../services/api";

function AdminOverview() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext();

  const [stats, setStats] = useState(outletCtx?.stats || null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, recentRes] = await Promise.all([
        getDashboardStats(),
        getRecentComplaints(6),
      ]);
      setStats(statsRes.data);
      setRecentComplaints(recentRes.data);
      if (outletCtx?.refreshStats) outletCtx.refreshStats();
    } catch (err) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEscalation = async () => {
    setIsEscalating(true);
    setActionMessage("");
    try {
      const res = await escalateOverdueComplaints();
      setActionMessage(res.message || "Overdue complaints escalated successfully.");
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to escalate overdue complaints.");
    } finally {
      setIsEscalating(false);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
        <div>Loading real-time grievance statistics from database…</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 36 }}>
        <p style={{ color: "var(--color-error)", marginBottom: 16 }}>{error}</p>
        <button className="btn btn-secondary" onClick={loadData}>
          Try Again
        </button>
      </div>
    );
  }

  const pendingCount =
    (stats?.statusBreakdown?.["Registered"] || 0) +
    (stats?.statusBreakdown?.["Under Review"] || 0);

  const inProgressCount = stats?.statusBreakdown?.["In Progress"] || 0;
  const resolvedCount = stats?.statusBreakdown?.["Resolved"] || 0;
  const highPriorityCount = stats?.priorityBreakdown?.["High"] || 0;

  return (
    <div>
      {/* Alert Banner for Overdue Complaints */}
      {stats?.overdueCount > 0 && (
        <div className="admin-alert-banner">
          <div className="admin-alert-content">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Action Required:</strong> {stats.overdueCount} complaint(s) have passed their SLA deadline without resolution.
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleEscalation}
            disabled={isEscalating}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              borderColor: "#f87171",
              color: "#b91c1c",
              background: "#ffffff",
            }}
          >
            {isEscalating ? "Running Sweep…" : "Trigger Escalation Sweep"}
          </button>
        </div>
      )}

      {actionMessage && (
        <div
          style={{
            padding: "12px 18px",
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            borderRadius: "var(--radius-md)",
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ✓ {actionMessage}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card kpi-total">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Logged</span>
            <div className="admin-kpi-icon">📁</div>
          </div>
          <div className="admin-kpi-value">{stats?.totalComplaints || 0}</div>
          <div className="admin-kpi-subtext">Cumulative grievance records</div>
        </div>

        <div className="admin-kpi-card kpi-pending">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Pending Review</span>
            <div className="admin-kpi-icon">⏳</div>
          </div>
          <div className="admin-kpi-value">{pendingCount}</div>
          <div className="admin-kpi-subtext">Awaiting administrative review</div>
        </div>

        <div className="admin-kpi-card kpi-progress">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">In Progress</span>
            <div className="admin-kpi-icon">⚙️</div>
          </div>
          <div className="admin-kpi-value">{inProgressCount}</div>
          <div className="admin-kpi-subtext">Assigned to active department</div>
        </div>

        <div className="admin-kpi-card kpi-resolved">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Resolved</span>
            <div className="admin-kpi-icon">✓</div>
          </div>
          <div className="admin-kpi-value">{resolvedCount}</div>
          <div className="admin-kpi-subtext">{stats?.resolutionRate || 0}% overall resolution rate</div>
        </div>

        <div className="admin-kpi-card kpi-overdue">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">SLA Overdue</span>
            <div className="admin-kpi-icon">⏰</div>
          </div>
          <div className="admin-kpi-value" style={{ color: stats?.overdueCount > 0 ? "var(--color-error)" : "inherit" }}>
            {stats?.overdueCount || 0}
          </div>
          <div className="admin-kpi-subtext">Breached target response time</div>
        </div>

        <div className="admin-kpi-card kpi-high">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">High Priority</span>
            <div className="admin-kpi-icon">🔥</div>
          </div>
          <div className="admin-kpi-value">{highPriorityCount}</div>
          <div className="admin-kpi-subtext">24-hour turnaround target</div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activity + Grievance Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        
        {/* Left: Recent Activity Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Recent Submissions</div>
              <div className="admin-card-subtitle">Latest grievances recorded in the database</div>
            </div>
            <Link to="/admin/complaints" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>
              View Table →
            </Link>
          </div>

          <div className="admin-table-container">
            {recentComplaints.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
                No complaints recorded in the system yet.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Passenger</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((c) => (
                    <tr key={c.complaintId || c._id}>
                      <td>
                        <span className="complaint-id-badge">{c.complaintId}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.passengerName}</div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <span className={`priority-chip priority-${c.priority || "Medium"}`}>
                          {c.priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${(c.status || "Registered").replace(/\s+/g, "-")}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => navigate(`/admin/complaints?id=${c.complaintId}`)}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Operational Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">System Status Overview</div>
              <div className="admin-card-subtitle">Current pipeline and priority distribution</div>
            </div>
            <Link to="/admin/analytics" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 13 }}>
              Full Analytics →
            </Link>
          </div>

          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Status Breakdown Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <span>Pipeline Breakdown</span>
                <span style={{ color: "var(--color-text-muted)" }}>
                  {stats?.totalComplaints || 0} Total
                </span>
              </div>
              <div style={{ height: 10, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", display: "flex" }}>
                {stats?.totalComplaints > 0 ? (
                  <>
                    <div
                      title={`Resolved: ${resolvedCount}`}
                      style={{
                        width: `${(resolvedCount / stats.totalComplaints) * 100}%`,
                        background: "var(--color-success)",
                      }}
                    />
                    <div
                      title={`In Progress: ${inProgressCount}`}
                      style={{
                        width: `${(inProgressCount / stats.totalComplaints) * 100}%`,
                        background: "var(--color-pending)",
                      }}
                    />
                    <div
                      title={`Pending: ${pendingCount}`}
                      style={{
                        width: `${(pendingCount / stats.totalComplaints) * 100}%`,
                        background: "var(--color-info)",
                      }}
                    />
                  </>
                ) : (
                  <div style={{ width: "100%", background: "#cbd5e1" }} />
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)" }} />
                  Resolved ({resolvedCount})
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-pending)" }} />
                  In Progress ({inProgressCount})
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-info)" }} />
                  Pending ({pendingCount})
                </span>
              </div>
            </div>

            {/* Category Leaderboard */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Frequent Complaint Categories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(stats?.categoryBreakdown || []).slice(0, 4).map((cat) => (
                  <div key={cat.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span>{cat.category}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="admin-nav-badge" style={{ background: "#e2e8f0", color: "#334155" }}>
                        {cat.count} complaints
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.categoryBreakdown || stats.categoryBreakdown.length === 0) && (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No categories recorded.</div>
                )}
              </div>
            </div>

            {/* SLA Metrics Box */}
            <div style={{ background: "#f8fafc", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 6 }}>
                Performance Metrics
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>Average Resolution Duration:</span>
                <strong>{stats?.avgResolutionHours ? `${stats.avgResolutionHours} hrs` : "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Active Escalations:</span>
                <strong style={{ color: stats?.escalatedCount > 0 ? "var(--color-pending)" : "inherit" }}>
                  {stats?.escalatedCount || 0}
                </strong>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminOverview;
