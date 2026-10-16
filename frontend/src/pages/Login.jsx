import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email/ID and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(identifier.trim(), password);
      const fromPath = typeof location.state?.from === "string"
        ? location.state.from
        : location.state?.from?.pathname;
      const redirectTo = fromPath || (user.role === "admin" ? "/admin" : "/dashboard");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div>
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark">GR</span>
          <span className="auth-brand-text">Grievance Redressal</span>
        </Link>

        <div className="card auth-card">
          <h1>Welcome back</h1>
          <p>Log in to track and manage your complaints.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label htmlFor="identifier">Email</label>
              <input
                id="identifier"
                type="text"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-password-row">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;