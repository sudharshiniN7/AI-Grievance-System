import { useState, useEffect } from "react";
import { getAdminAnalytics } from "../services/api";

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminAnalytics();
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to load grievance intelligence analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
        <div style={{ fontWeight: 600 }}>Aggregating grievance intelligence from MongoDB…</div>
        <p style={{ fontSize: 13, marginTop: 4 }}>Querying live collections and calculating distributions.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 36, maxWidth: 560, margin: "40px auto" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ marginBottom: 8, color: "var(--color-navy)" }}>Analytics Unavailable</h3>
        <p style={{ color: "var(--color-error)", marginBottom: 20, fontSize: 14 }}>{error}</p>
        <button className="btn btn-primary" onClick={loadAnalytics}>
          ↻ Retry Analytics Load
        </button>
      </div>
    );
  }

  const total = data?.totalComplaints || 0;
  const activeCount =
    (data?.statusDistribution?.["Registered"] || 0) +
    (data?.statusDistribution?.["Under Review"] || 0) +
    (data?.statusDistribution?.["In Progress"] || 0);
  const resolvedCount = data?.statusDistribution?.["Resolved"] || 0;
  const overdueCount = data?.overdueCount || 0;
  const escalatedCount = data?.escalatedCount || 0;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1>Grievance Intelligence & Analytics</h1>
          <p>Operational insights derived directly from passenger complaint records in MongoDB.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadAnalytics} style={{ padding: "6px 14px", fontSize: 13 }}>
          ↻ Refresh Data
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="admin-kpi-grid" style={{ marginBottom: 24 }}>
        <div className="admin-kpi-card kpi-total">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Total Complaints</span>
            <div className="admin-kpi-icon">📁</div>
          </div>
          <div className="admin-kpi-value">{total}</div>
          <div className="admin-kpi-subtext">Total database records</div>
        </div>

        <div className="admin-kpi-card kpi-progress">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Active / Open</span>
            <div className="admin-kpi-icon">⚙️</div>
          </div>
          <div className="admin-kpi-value">{activeCount}</div>
          <div className="admin-kpi-subtext">Registered, review or in progress</div>
        </div>

        <div className="admin-kpi-card kpi-resolved">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Resolved</span>
            <div className="admin-kpi-icon">✓</div>
          </div>
          <div className="admin-kpi-value">{resolvedCount}</div>
          <div className="admin-kpi-subtext">
            {total > 0 ? Math.round((resolvedCount / total) * 100) : 0}% resolution rate
          </div>
        </div>

        <div className="admin-kpi-card kpi-overdue">
          <div className="admin-kpi-header">
            <span className="admin-kpi-label">Overdue & Escalated</span>
            <div className="admin-kpi-icon">⏰</div>
          </div>
          <div className="admin-kpi-value" style={{ color: overdueCount > 0 ? "var(--color-error)" : "inherit" }}>
            {overdueCount}
          </div>
          <div className="admin-kpi-subtext">{escalatedCount} escalated to leadership</div>
        </div>
      </div>

      {/* Info notice about AI Enrichment */}
      <div
        style={{
          background: "var(--color-info-bg)",
          border: "1px solid #bfdbfe",
          borderRadius: "var(--radius-md)",
          padding: "12px 18px",
          marginBottom: 24,
          fontSize: 13,
          color: "var(--color-navy)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <div>
          <strong>System Intelligence Note:</strong> All distributions, counts, and hotspots are aggregated in real time from MongoDB. Sentiment tags and entity extractions reflect stored passenger complaint analyses.
        </div>
      </div>

      {/* Grid of Analytical Widgets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>

        {/* 1. Category Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Grievances by Category</div>
              <div className="admin-card-subtitle">Volume breakdown and resolution status</div>
            </div>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {(!data?.categoryDistribution || data.categoryDistribution.length === 0) ? (
              <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No category records available.</div>
            ) : (
              data.categoryDistribution.map((cat) => {
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                return (
                  <div key={cat.category}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                      <span>{cat.category}</span>
                      <span>{cat.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--color-blue)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 3 }}>
                      Resolved: {cat.resolvedCount || 0} of {cat.count}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Transport Mode Breakdown */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Grievances by Transport Mode</div>
              <div className="admin-card-subtitle">Cross-modal grievance volume</div>
            </div>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {(!data?.transportDistribution || data.transportDistribution.length === 0) ? (
              <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No transport mode records available.</div>
            ) : (
              data.transportDistribution.map((t) => {
                const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                return (
                  <div key={t.transportMode}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                      <span>
                        {t.transportMode === "Train" && "🚆 "}
                        {t.transportMode === "Bus" && "🚌 "}
                        {t.transportMode === "Metro" && "🚇 "}
                        {t.transportMode === "Flight" && "✈️ "}
                        {t.transportMode === "Ferry" && "🚢 "}
                        {t.transportMode}
                      </span>
                      <span>{t.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--color-amber)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    {t.highPriorityCount > 0 && (
                      <div style={{ fontSize: 11, color: "var(--color-error)", marginTop: 3, fontWeight: 600 }}>
                        {t.highPriorityCount} marked High Priority
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Top Locations & Corridors */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Incident Locations & Route Corridors</div>
              <div className="admin-card-subtitle">Frequently affected passenger transit points</div>
            </div>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Top Locations */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                Frequently Affected Incident Locations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(!data?.topLocations || data.topLocations.length === 0) ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No locations recorded.</div>
                ) : (
                  data.topLocations.map((loc, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                      <span>📍 {loc.location}</span>
                      <strong style={{ color: "var(--color-navy)" }}>{loc.count} complaints</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Routes */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                Route Corridors
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(!data?.topRoutes || data.topRoutes.length === 0) ? (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No route corridors recorded.</div>
                ) : (
                  data.topRoutes.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px dashed var(--color-border)" }}>
                      <span>🛣️ {r.from} ➔ {r.to}</span>
                      <strong>{r.count} complaints</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Priority Distribution & Sentiment */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-card-title">Priority & Sentiment Analysis</div>
              <div className="admin-card-subtitle">Severity level and passenger tone assessment</div>
            </div>
          </div>
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Priority Distribution */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 10 }}>
                Priority Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
                <div style={{ padding: 12, background: "#fee2e2", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#b91c1c" }}>
                    {data?.priorityDistribution?.["High"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginTop: 2 }}>High (24h)</div>
                </div>

                <div style={{ padding: 12, background: "#fef3c7", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#b45309" }}>
                    {data?.priorityDistribution?.["Medium"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginTop: 2 }}>Medium (72h)</div>
                </div>

                <div style={{ padding: 12, background: "#ecfdf5", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#047857" }}>
                    {data?.priorityDistribution?.["Low"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", marginTop: 2 }}>Low (120h)</div>
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 10 }}>
                Passenger Sentiment Distribution
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
                <div style={{ padding: 12, background: "#fee2e2", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#b91c1c" }}>
                    {data?.sentimentDistribution?.["Negative"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginTop: 2 }}>😡 Negative</div>
                </div>

                <div style={{ padding: 12, background: "#f1f5f9", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#475569" }}>
                    {data?.sentimentDistribution?.["Neutral"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginTop: 2 }}>😐 Neutral</div>
                </div>

                <div style={{ padding: 12, background: "#ecfdf5", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#047857" }}>
                    {data?.sentimentDistribution?.["Positive"] || 0}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#047857", marginTop: 2 }}>😊 Positive</div>
                </div>
              </div>
            </div>

            {/* Recurring Patterns */}
            {data?.recurringPatterns && data.recurringPatterns.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Recurring Subcategory Patterns
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {data.recurringPatterns.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        background: "#f1f5f9",
                        borderRadius: 4,
                        color: "var(--color-navy)",
                      }}
                    >
                      {p.category} → <strong>{p.subcategory}</strong> ({p.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Trends Over Time Section */}
      <div className="admin-card" style={{ marginTop: 24 }}>
        <div className="admin-card-header">
          <div>
            <div className="admin-card-title">Submission & Resolution Timeline</div>
            <div className="admin-card-subtitle">Daily intake and resolution patterns from complaint timestamps</div>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          {(!data?.recentTrends || data.recentTrends.length === 0) ? (
            <div style={{ color: "var(--color-text-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
              Timeline data aggregates automatically as passenger grievances are submitted.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.recentTrends.map((trend) => (
                <div key={trend.date} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
                  <span style={{ width: 100, fontWeight: 600, color: "var(--color-navy)" }}>{trend.date}</span>
                  <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
                    <div
                      style={{
                        height: 18,
                        width: `${Math.max(20, (trend.total / Math.max(...data.recentTrends.map(t => t.total))) * 100)}%`,
                        background: "var(--color-info-bg)",
                        border: "1px solid var(--color-blue)",
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--color-navy)",
                      }}
                    >
                      {trend.total} received
                    </div>
                    {trend.resolved > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-success)" }}>
                        ({trend.resolved} resolved)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
