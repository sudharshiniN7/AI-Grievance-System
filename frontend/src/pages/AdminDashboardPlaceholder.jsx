import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AdminDashboardPlaceholder() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ padding: 48, maxWidth: 640, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
          Logged in as <strong>{user?.fullName}</strong> ({user?.email}).
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
          The full admin complaint-management dashboard is not built yet. This is a
          placeholder confirming that admin authentication and role-based routing are
          working correctly.
        </p>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default AdminDashboardPlaceholder;