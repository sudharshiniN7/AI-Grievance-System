import { Link } from "react-router-dom";
import "./LandingPage.css";

const FEATURES = [
  {
    title: "File a complaint in minutes",
    description:
      "Report issues with trains, buses, or stations through a short guided form — no jargon, no repeated forms.",
  },
  {
    title: "AI-assisted categorisation",
    description:
      "Complaints are automatically analysed and routed to the right department, cutting down manual triage delays.",
  },
  {
    title: "Track every complaint",
    description:
      "Follow your complaint from submission to resolution with a clear status timeline, at any time.",
  },
  {
    title: "Stay notified",
    description:
      "Get updates the moment your complaint status changes — no need to keep checking back.",
  },
];

const STEPS = [
  { label: "Register", detail: "Sign in and describe your issue with details and evidence." },
  { label: "AI Analysis", detail: "The system categorises and prioritises your complaint automatically." },
  { label: "Resolution", detail: "Concerned staff act on it, and you're notified at each step." },
];

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-nav-brand-mark">GR</span>
          <span>Grievance Redressal</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <Link to="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-hero-eyebrow">Passenger Grievance Redressal System</span>
          <h1>Report transport issues. Get them resolved, faster.</h1>
          <p>
            A single place for passengers to register complaints about delays, cleanliness,
            staff conduct, or safety — with AI-assisted routing that gets your complaint to
            the right desk without the runaround.
          </p>
          <div className="landing-hero-actions">
            <Link to="/complaints/register" className="btn btn-primary">
              Register a Complaint
            </Link>
            <Link to="/complaints/track" className="btn btn-secondary">
              Track Existing Complaint
            </Link>
          </div>
        </div>

        <div className="landing-hero-panel">
          <div className="landing-hero-panel-row">
            <span>Complaint ID</span>
            <strong>#GR-20481</strong>
          </div>
          <div className="landing-hero-panel-row">
            <span>Category</span>
            <strong>Cleanliness</strong>
          </div>
          <div className="landing-hero-panel-row">
            <span>Status</span>
            <span className="status-badge status-badge-pending">In Progress</span>
          </div>
          <div className="landing-hero-panel-divider" />
          <div className="landing-hero-panel-row">
            <span>AI Priority</span>
            <strong>Medium</strong>
          </div>
          <div className="landing-hero-panel-row">
            <span>Assigned To</span>
            <strong>Station Maintenance</strong>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features">
        <h2>Everything you need to raise and follow up on an issue</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-steps">
        <h2>How it works</h2>
        <div className="landing-steps-row">
          {STEPS.map((s, i) => (
            <div className="landing-step" key={s.label}>
              <div className="landing-step-number">{i + 1}</div>
              <div>
                <h3>{s.label}</h3>
                <p>{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>Passenger Grievance Redressal System — Academic Demo Project</span>
      </footer>
    </div>
  );
}

export default LandingPage;