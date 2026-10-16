import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardStats, escalateOverdueComplaints } from "../services/api";
import "../pages/AdminDashboard.css";

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState(null);
  const [isEscalating, setIsEscalating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getDashboardStats()
      .then((res) => {
        if (isMounted) setStats(res.data);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleQuickEscalation = async () => {
    setIsEscalating(true);
    try {
      const res = await escalateOverdueComplaints();
      showToast(res.message || "Escalation sweep completed successfully.");
      const refreshedStats = await getDashboardStats();
      setStats(refreshedStats.data);
    } catch (err) {
      showToast(err.message || "Failed to run escalation sweep.", "error");
    } finally {
      setIsEscalating(false);
    }
  };

  const adminInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AD";

  const getPageTitle = () => {
    if (location.pathname === "/admin/complaints") return "Complaint Management";
    if (location.pathname === "/admin/analytics") return "Grievance Intelligence & Analytics";
    return "Administrator Control Center";
  };

  return (
    <div className="admin-shell">
      {/* Toast Notification */}
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.message}
        </div>
      )}

      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-sidebar-brand">
          <div className="admin-brand-mark">GR</div>
          <div>
            <div className="admin-brand-text">Grievance Redressal</div>
            <span className="admin-brand-badge">Admin Portal</span>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">Operations</div>

          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
            }
          >
            <span className="admin-nav-link-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/complaints"
            end
            className={({ isActive }) =>
              "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
            }
          >
            <span className="admin-nav-link-icon">📋</span>
            <span>All Complaints</span>
            {stats?.totalComplaints > 0 && (
              <span className="admin-nav-badge">{stats.totalComplaints}</span>
            )}
          </NavLink>

          <div className="admin-nav-section-title">Status Queues</div>

          <NavLink
            to="/admin/complaints?status=Pending"
            className={({ isActive }) =>
              "admin-nav-link" +
              (isActive && location.search.includes("Pending")
                ? " admin-nav-link-active"
                : "")
            }
          >
            <span className="admin-nav-link-icon">⏳</span>
            <span>Pending Review</span>
            {stats && (
              <span className="admin-nav-badge">
                {(stats.statusBreakdown?.["Registered"] || 0) +
                  (stats.statusBreakdown?.["Under Review"] || 0)}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/complaints?status=In%20Progress"
            className={({ isActive }) =>
              "admin-nav-link" +
              (isActive && location.search.includes("In%20Progress")
                ? " admin-nav-link-active"
                : "")
            }
          >
            <span className="admin-nav-link-icon">🔄</span>
            <span>In Progress</span>
            {stats?.statusBreakdown?.["In Progress"] > 0 && (
              <span className="admin-nav-badge">
                {stats.statusBreakdown["In Progress"]}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/complaints?status=Resolved"
            className={({ isActive }) =>
              "admin-nav-link" +
              (isActive && location.search.includes("Resolved")
                ? " admin-nav-link-active"
                : "")
            }
          >
            <span className="admin-nav-link-icon">✅</span>
            <span>Resolved</span>
            {stats?.statusBreakdown?.["Resolved"] > 0 && (
              <span className="admin-nav-badge">
                {stats.statusBreakdown["Resolved"]}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/admin/complaints?filter=overdue"
            className={({ isActive }) =>
              "admin-nav-link" +
              (isActive && location.search.includes("overdue")
                ? " admin-nav-link-active"
                : "")
            }
          >
            <span className="admin-nav-link-icon">⚠️</span>
            <span>Overdue & Escalated</span>
            {stats?.overdueCount > 0 && (
              <span className="admin-nav-badge admin-nav-badge-alert">
                {stats.overdueCount}
              </span>
            )}
          </NavLink>

          <div className="admin-nav-section-title">Intelligence</div>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              "admin-nav-link" + (isActive ? " admin-nav-link-active" : "")
            }
          >
            <span className="admin-nav-link-icon">📈</span>
            <span>Grievance Analytics</span>
          </NavLink>
        </nav>

        {/* Admin Footer & Profile */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">{adminInitials}</div>
            <div className="admin-user-info">
              <div className="admin-user-name">{user?.fullName || "Administrator"}</div>
              <div className="admin-user-email">{user?.email || "admin@system.local"}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">{getPageTitle()}</div>

          <div className="admin-topbar-actions">
            {stats?.overdueCount > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleQuickEscalation}
                disabled={isEscalating}
                style={{
                  fontSize: 13,
                  padding: "6px 14px",
                  borderColor: "var(--color-error)",
                  color: "var(--color-error)",
                }}
              >
                {isEscalating ? "Escalating…" : `⚡ Escalate Overdue (${stats.overdueCount})`}
              </button>
            )}

            <Link
              to="/admin/complaints"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: "6px 14px" }}
            >
              Browse All Complaints
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <Outlet context={{ stats, refreshStats: () => getDashboardStats().then(r => setStats(r.data)) }} />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
