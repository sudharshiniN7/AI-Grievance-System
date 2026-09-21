import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./ComplaintHistory.css";

const ALL_COMPLAINTS = [
  {
    id: "GR-20481",
    category: "Cleanliness",
    route: "Chennai Central → Bengaluru City",
    status: "pending",
    statusLabel: "In Progress",
    date: "18 Sep 2026",
  },
  {
    id: "GR-20463",
    category: "Staff Behaviour",
    route: "Coimbatore Jn → Chennai Egmore",
    status: "resolved",
    statusLabel: "Resolved",
    date: "10 Sep 2026",
  },
  {
    id: "GR-20440",
    category: "Delay",
    route: "Madurai Jn → Chennai Central",
    status: "rejected",
    statusLabel: "Rejected",
    date: "02 Sep 2026",
  },
  {
    id: "GR-20431",
    category: "Safety Concern",
    route: "Local Bus Route 21G",
    status: "pending",
    statusLabel: "Under Review",
    date: "29 Aug 2026",
  },
  {
    id: "GR-20402",
    category: "Ticketing / Billing",
    route: "Trichy Jn → Chennai Central",
    status: "resolved",
    statusLabel: "Resolved",
    date: "21 Aug 2026",
  },
  {
    id: "GR-20390",
    category: "Delay",
    route: "Chennai Metro — Blue Line",
    status: "resolved",
    statusLabel: "Resolved",
    date: "14 Aug 2026",
  },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "rejected", label: "Rejected" },
];

function statusBadgeClass(status) {
  if (status === "resolved") return "status-badge status-badge-resolved";
  if (status === "rejected") return "status-badge status-badge-rejected";
  return "status-badge status-badge-pending";
}

function ComplaintHistory() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return ALL_COMPLAINTS.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesQuery =
        query.trim() === "" ||
        c.id.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        c.route.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [statusFilter, query]);

  return (
    <div>
      <div className="page-header">
        <h1>Complaint History</h1>
        <p>All complaints you've filed, with their current status.</p>
      </div>

      <div className="history-controls">
        <div className="history-filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              className={
                "history-filter-btn" +
                (statusFilter === f.key ? " history-filter-btn-active" : "")
              }
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="history-search-input"
          placeholder="Search by ID, category, or route"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card history-table-wrap">
        <div className="dashboard-table">
          <div className="dashboard-table-row dashboard-table-head">
            <span>Complaint ID</span>
            <span>Category</span>
            <span>Route</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          {filtered.map((c) => (
            <Link to={`/complaints/${c.id}`} className="dashboard-table-row" key={c.id}>
              <span className="dashboard-table-id">{c.id}</span>
              <span>{c.category}</span>
              <span className="dashboard-table-route">{c.route}</span>
              <span>{c.date}</span>
              <span>
                <span className={statusBadgeClass(c.status)}>{c.statusLabel}</span>
              </span>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="history-empty">
              No complaints match your search or filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComplaintHistory;