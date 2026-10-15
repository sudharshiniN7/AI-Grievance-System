import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getComplaintById } from "../services/api";
import "./AIAnalysisResult.css";

function AIAnalysisResult() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadComplaint() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await getComplaintById(id);
        if (isMounted) setComplaint(response.data);
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || "Complaint not found.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComplaint();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="card">
        <p>Loading AI analysis…</p>
      </div>
    );
  }

  if (errorMessage || !complaint) {
    return (
      <div className="card">
        <h2>Analysis unavailable</h2>
        <p>{errorMessage || "We couldn't find a complaint with this ID."}</p>
        <Link to="/complaints/history" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Back to History
        </Link>
      </div>
    );
  }

  const hasAiData = Boolean(complaint.sentiment || complaint.severity || complaint.subcategory);

  const entities = complaint.extractedEntities || {};
  const entityGroups = [
    { label: "Stations", values: entities.stations },
    { label: "Dates", values: entities.dates },
    { label: "Times", values: entities.times },
    { label: "Staff Mentions", values: entities.staffMentions },
    { label: "Vehicle Numbers", values: entities.vehicleNumbers },
  ].filter((group) => Array.isArray(group.values) && group.values.length > 0);

  return (
    <div>
      <div className="details-breadcrumb">
        <Link to={`/complaints/${complaint.complaintId}`}>{complaint.complaintId}</Link>
        <span>/</span>
        <span>AI Analysis</span>
      </div>

      <div className="page-header">
        <h1>AI Analysis Result</h1>
        <p>Automated categorisation and priority assessment for complaint {complaint.complaintId}.</p>
      </div>

      {!hasAiData && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p>
            AI analysis hasn't been applied to this complaint yet. Fields below will populate
            once analysis is available.
          </p>
        </div>
      )}

      <div className="ai-grid">
        <div className="card ai-summary-card">
          <h2>Complaint Description</h2>
          <p>{complaint.description}</p>

          {entityGroups.length > 0 && (
            <>
              <h3>Extracted Entities</h3>
              {entityGroups.map((group) => (
                <div key={group.label} style={{ marginBottom: 12 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      marginBottom: 6,
                    }}
                  >
                    {group.label}
                  </span>
                  <div className="ai-tags">
                    {group.values.map((value) => (
                      <span className="ai-tag" key={value}>
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {entityGroups.length === 0 && (
            <>
              <h3>Extracted Entities</h3>
              <p style={{ fontSize: 13.5, color: "var(--color-text-muted)" }}>
                No entities extracted from this complaint.
              </p>
            </>
          )}
        </div>

        <div className="ai-sidebar">
          <div className="card ai-metric-card">
            <span className="ai-metric-label">Predicted Category</span>
            <span className="ai-metric-value">{complaint.category || "Not yet classified"}</span>
            {complaint.subcategory && (
              <span className="ai-confidence-label">{complaint.subcategory}</span>
            )}
          </div>

          <div className="card ai-metric-row-card">
            <div className="ai-metric-row">
              <span>Priority</span>
              <span className="status-badge status-badge-pending">
                {complaint.priority || "—"}
              </span>
            </div>
            <div className="ai-metric-row">
              <span>Severity</span>
              <strong>{complaint.severity || "—"}</strong>
            </div>
            <div className="ai-metric-row">
              <span>Sentiment</span>
              <span className="status-badge status-badge-rejected">
                {complaint.sentiment || "—"}
              </span>
            </div>
          </div>

          <div className="card ai-routing-card">
            <span className="ai-metric-label">Routed To</span>
            <span className="ai-routing-department">
              {complaint.assignedDepartment || "Not yet assigned"}
            </span>
            <p>
              This is an AI-suggested routing based on complaint category and content. It
              reflects a suspected pattern for human review, not a confirmed root cause or
              final dispatch decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAnalysisResult;