import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppLayout.css";

const NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    to: "/complaints/register",
    label: "Register Complaint",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    to: "/complaints/track",
    label: "Track Complaint",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    to: "/complaints/history",
    label: "Complaint History",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13a9 9 0 1 0 2.13-7.36L3 8" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "PA";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/" className="app-sidebar-brand">
          <span className="app-sidebar-brand-mark">GR</span>
          <span className="app-sidebar-brand-text">
            Grievance<span>Redressal</span>
          </span>
        </Link>

        <nav className="app-sidebar-nav">
  {NAV_ITEMS.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        "app-sidebar-link" + (isActive ? " app-sidebar-link-active" : "")
      }
    >
      <span className="app-sidebar-link-icon" aria-hidden="true">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </NavLink>
  ))}
</nav>

        <div className="app-sidebar-footer">
          <p>Need help?</p>
          <a href="tel:139">Helpline: 139</a>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-title">Passenger Portal</div>
          <div className="app-topbar-actions">
            <Link to="/notifications" className="app-topbar-icon-btn" aria-label="Notifications">
              🔔
            </Link>
            <div className="app-topbar-user">
              <span className="app-topbar-user-avatar">{initials}</span>
              <span className="app-topbar-user-name">{user?.fullName || "Passenger"}</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogout}
                style={{ marginLeft: 12, padding: "6px 12px", fontSize: 13 }}
              >
                Log Out
              </button>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;