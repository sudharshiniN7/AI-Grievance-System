import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllComplaints } from "../services/api";
import AdminComplaintModal from "../components/AdminComplaintModal";

const TRANSPORT_MODES = ["All", "Train", "Bus", "Metro", "Flight", "Ferry"];
const CATEGORIES = [
  "All",
  "Delay",
  "Cleanliness",
  "Staff Behaviour",
  "Safety Concern",
  "Ticketing / Billing",
  "Other",
];
const PRIORITIES = ["All", "High", "Medium", "Low"];

function AdminComplaints() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || (searchParams.get("filter") === "overdue" ? "overdue" : "All"));
  const [selectedTransport, setSelectedTransport] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected complaint for modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllComplaints();
      setComplaints(res.data || []);

      // Check if URL has ?id=GR-XXXXX
      const targetId = searchParams.get("id");
      if (targetId && res.data) {
        const found = res.data.find((c) => c.complaintId === targetId);
        if (found) setSelectedComplaint(found);
      }
    } catch (err) {
      setError(err.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Update tab if query params change
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const filterParam = searchParams.get("filter");
    if (statusParam) setActiveTab(statusParam);
    else if (filterParam === "overdue") setActiveTab("overdue");
  }, [searchParams]);

  // Handle Tab Click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === "All") {
      setSearchParams({});
    } else if (tab === "overdue") {
      setSearchParams({ filter: "overdue" });
    } else {
      setSearchParams({ status: tab });
    }
  };

  // Filtered and Sorted Complaints
  const filteredComplaints = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();

    return complaints.filter((c) => {
      // 1. Tab Status Filter
      if (activeTab === "Pending") {
        if (!["Registered", "Under Review"].includes(c.status)) return false;
      } else if (activeTab === "overdue") {
        const isOpen = ["Registered", "Under Review", "In Progress"].includes(c.status);
        const isOverdue = isOpen && new Date(c.slaDueAt) < now;
        if (!isOverdue && !c.isEscalated) return false;
      } else if (activeTab !== "All" && c.status !== activeTab) {
        return false;
      }

      // 2. Transport Mode Filter
      if (selectedTransport !== "All" && c.transportMode !== selectedTransport) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategory !== "All" && c.category !== selectedCategory) {
        return false;
      }

      // 4. Priority Filter
      if (selectedPriority !== "All" && c.priority !== selectedPriority) {
        return false;
      }

      // 5. Search Query Filter
      if (query) {
        const searchable = [
          c.complaintId,
          c.passengerName,
          c.email,
          c.phone,
          c.location,
          c.route?.from,
          c.route?.to,
          c.category,
          c.subcategory,
          c.description,
          c.assignedDepartment,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "priority") {
        const weight = { High: 3, Medium: 2, Low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      if (sortBy === "sla") {
        return new Date(a.slaDueAt) - new Date(b.slaDueAt);
      }
      return 0;
    });
  }, [
    complaints,
    activeTab,
    selectedTransport,
    selectedCategory,
    selectedPriority,
    searchQuery,
    sortBy,
  ]);

  // Paginated Complaints
  const totalPages = Math.ceil(filteredComplaints.length / pageSize) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredComplaints.slice(start, start + pageSize);
  }, [filteredComplaints, currentPage, pageSize]);

  const handleComplaintUpdated = (updated) => {
    setComplaints((prev) =>
      prev.map((c) => (c.complaintId === updated.complaintId ? updated : c))
    );
    setSelectedComplaint(updated);
  };

  return (
    <div>
      {/* Modal Drawer when Complaint is clicked */}
      {selectedComplaint && (
        <AdminComplaintModal
          complaint={selectedComplaint}
          onClose={() => {
            setSelectedComplaint(null);
            const currentParams = new URLSearchParams(searchParams);
            currentParams.delete("id");
            setSearchParams(currentParams);
          }}
          onUpdated={handleComplaintUpdated}
        />
      )}

      {/* Page Title & Stats Banner */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>Complaint Management</h1>
        <p>Review, assign departments, track SLAs, and resolve passenger grievances.</p>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Status Tab Navigation */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
          {[
            { label: "All Grievances", value: "All" },
            { label: "Pending Review", value: "Pending" },
            { label: "In Progress", value: "In Progress" },
            { label: "Resolved", value: "Resolved" },
            { label: "Rejected", value: "Rejected" },
            { label: "Overdue / Escalated", value: "overdue" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabClick(tab.value)}
              style={{
                padding: "14px 20px",
                border: "none",
                background: "transparent",
                fontWeight: activeTab === tab.value ? 700 : 500,
                color: activeTab === tab.value ? "var(--color-navy)" : "var(--color-text-muted)",
                borderBottom: activeTab === tab.value ? "3px solid var(--color-amber)" : "3px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="admin-filter-bar">
          <input
            type="text"
            className="admin-search-input"
            placeholder="🔍 Search by ID, passenger, phone, route, keyword..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />

          <select
            className="admin-filter-select"
            value={selectedTransport}
            onChange={(e) => {
              setSelectedTransport(e.target.value);
              setCurrentPage(1);
            }}
          >
            {TRANSPORT_MODES.map((m) => (
              <option key={m} value={m}>
                Mode: {m}
              </option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          <select
            className="admin-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="priority">Sort: High Priority</option>
            <option value="sla">Sort: SLA Due Soonest</option>
          </select>

          {(searchQuery || selectedTransport !== "All" || selectedCategory !== "All" || selectedPriority !== "All") && (
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => {
                setSearchQuery("");
                setSelectedTransport("All");
                setSelectedCategory("All");
                setSelectedPriority("All");
                setCurrentPage(1);
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Complaints Table */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
              Loading grievance database records…
            </div>
          ) : error ? (
            <div style={{ padding: 36, textAlign: "center" }}>
              <p style={{ color: "var(--color-error)", marginBottom: 14 }}>{error}</p>
              <button className="btn btn-secondary" onClick={fetchComplaints}>
                Retry
              </button>
            </div>
          ) : paginatedComplaints.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600 }}>No complaints match the selected criteria.</div>
              <p style={{ fontSize: 13, marginTop: 4 }}>Try clearing search keywords or filter dropdowns.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Passenger</th>
                  <th>Transport & Route</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status & SLA</th>
                  <th>Department</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map((c) => {
                  const isOverdue =
                    ["Registered", "Under Review", "In Progress"].includes(c.status) &&
                    new Date(c.slaDueAt) < new Date();

                  return (
                    <tr key={c.complaintId || c._id}>
                      <td>
                        <span
                          className="complaint-id-badge"
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelectedComplaint(c)}
                        >
                          {c.complaintId}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: "var(--color-navy)" }}>
                          {c.passengerName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {c.email}
                        </div>
                      </td>

                      <td>
                        <div className="transport-badge">
                          <span>
                            {c.transportMode === "Train" && "🚆"}
                            {c.transportMode === "Bus" && "🚌"}
                            {c.transportMode === "Metro" && "🚇"}
                            {c.transportMode === "Flight" && "✈️"}
                            {c.transportMode === "Ferry" && "🚢"}
                          </span>
                          <strong>{c.transportMode}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {c.route?.from} → {c.route?.to}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 500 }}>{c.category}</div>
                        {c.subcategory && (
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            {c.subcategory}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`priority-chip priority-${c.priority || "Medium"}`}>
                          {c.priority || "Medium"}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill status-${(c.status || "Registered").replace(/\s+/g, "-")}`}>
                          {c.status}
                        </span>
                        {isOverdue && <div className="sla-overdue-tag">Overdue</div>}
                        {c.isEscalated && <div className="sla-escalated-tag">Escalated</div>}
                      </td>

                      <td>
                        {c.assignedDepartment ? (
                          <span style={{ fontWeight: 500, fontSize: 12 }}>
                            {c.assignedDepartment}
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-faint)", fontSize: 12, fontStyle: "italic" }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td style={{ whiteSpace: "nowrap", fontSize: 12, color: "var(--color-text-muted)" }}>
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelectedComplaint(c)}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {!loading && filteredComplaints.length > 0 && (
          <div className="admin-pagination">
            <div>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong>{Math.min(currentPage * pageSize, filteredComplaints.length)}</strong> of{" "}
              <strong>{filteredComplaints.length}</strong> records
            </div>

            <div className="admin-pagination-actions">
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                ← Prev
              </button>
              <span style={{ alignSelf: "center", padding: "0 8px", fontWeight: 600 }}>
                {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminComplaints;
