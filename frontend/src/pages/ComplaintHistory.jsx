import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllComplaints } from "../services/api";
import "./ComplaintHistory.css";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "Under Review", label: "Under Review" },
  { key: "In Progress", label: "In Progress" },
  { key: "Resolved", label: "Resolved" },
  { key: "Rejected", label: "Rejected" },
];

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

function ComplaintHistory() {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadComplaints() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await getAllComplaints();
        if (isMounted) setComplaints(response.data);
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || "Failed to load complaint history.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComplaints();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const routeText = `${c.route?.from || ""} ${c.route?.to || ""}`;
      const matchesQuery =
        query.trim() === "" ||
        c.complaintId.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase()) ||
        routeText.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [complaints, statusFilter, query]);

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

      {isLoading && (
        <div className="card history-table-wrap">
          <div className="history-empty">Loading complaints…</div>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="card history-table-wrap">
          <div className="history-empty">{errorMessage}</div>
        </div>
      )}

      {!isLoading && !errorMessage && (
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
              <Link
                to={`/complaints/${c.complaintId}`}
                className="dashboard-table-row"
                key={c.complaintId}
              >
                <span className="dashboard-table-id">{c.complaintId}</span>
                <span>{c.category}</span>
                <span className="dashboard-table-route">
                  {c.route?.from} → {c.route?.to}
                </span>
                <span>{formatDate(c.createdAt)}</span>
                <span>
                  <span className={statusBadgeClass(c.status)}>{c.status}</span>
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
      )}
    </div>
  );
}

export default ComplaintHistory;