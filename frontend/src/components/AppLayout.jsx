import { NavLink, Outlet, Link } from "react-router-dom";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/complaints/register", label: "Register Complaint" },
  { to: "/complaints/track", label: "Track Complaint" },
  { to: "/complaints/history", label: "Complaint History" },
  { to: "/notifications", label: "Notifications" },
];

function AppLayout() {
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
              {item.label}
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
              <span className="app-topbar-user-avatar">PS</span>
              <span className="app-topbar-user-name">Priya Sharma</span>
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