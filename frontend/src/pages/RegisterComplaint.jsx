import { Link } from "react-router-dom";
import "./RegisterComplaint.css";

const CATEGORIES = [
  {
    key: "delay",
    label: "Delay",
    description: "Train, bus, or flight running significantly behind schedule.",
  },
  {
    key: "cleanliness",
    label: "Cleanliness",
    description: "Unhygienic coaches, platforms, waiting rooms, or restrooms.",
  },
  {
    key: "staff",
    label: "Staff Behaviour",
    description: "Misconduct, unhelpfulness, or unprofessional behaviour by staff.",
  },
  {
    key: "safety",
    label: "Safety Concern",
    description: "Security issues, faulty equipment, or unsafe conditions.",
  },
  {
    key: "billing",
    label: "Ticketing / Billing",
    description: "Refund issues, overcharging, or booking discrepancies.",
  },
  {
    key: "other",
    label: "Other",
    description: "Anything that doesn't fit the categories above.",
  },
];

function RegisterComplaint() {
  return (
    <div>
      <div className="page-header">
        <h1>Register a Complaint</h1>
        <p>Select the category that best describes your issue to get started.</p>
      </div>

      <div className="register-grid">
        {CATEGORIES.map((c) => (
          <Link
            to="/complaints/new"
            state={{ category: c.label }}
            className="card register-category-card"
            key={c.key}
          >
            <h3>{c.label}</h3>
            <p>{c.description}</p>
            <span className="register-category-cta">Continue →</span>
          </Link>
        ))}
      </div>

      <div className="card register-note">
        <h3>Not sure which category fits?</h3>
        <p>
          Choose the closest match — our AI analysis will review the details you provide
          and reclassify the complaint automatically if needed.
        </p>
        <Link to="/complaints/new" className="btn btn-secondary">
          Skip and fill the form directly
        </Link>
      </div>
    </div>
  );
}

export default RegisterComplaint;