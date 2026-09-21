import { Link, useParams } from "react-router-dom";
import "./AIAnalysisResult.css";

const MOCK_ANALYSIS = {
  id: "GR-20481",
  predictedCategory: "Cleanliness",
  confidence: 92,
  priority: "Medium",
  sentiment: "Negative",
  urgencyScore: 6,
  suggestedDepartment: "Station Maintenance — Chennai Division",
  keyPhrases: ["not cleaned", "no water", "washroom", "littered", "no action taken"],
  summary:
    "Passenger reports an uncleaned coach with a non-functional washroom and littered floor. No corrective action was taken by staff during the journey, indicating a service-lapse rather than an isolated incident.",
  similarComplaints: 14,
};

function AIAnalysisResult() {
  const { id } = useParams();
  const analysis = { ...MOCK_ANALYSIS, id: id || MOCK_ANALYSIS.id };

  return (
    <div>
      <div className="details-breadcrumb">
        <Link to={`/complaints/${analysis.id}`}>{analysis.id}</Link>
        <span>/</span>
        <span>AI Analysis</span>
      </div>

      <div className="page-header">
        <h1>AI Analysis Result</h1>
        <p>Automated categorisation and priority assessment for complaint {analysis.id}.</p>
      </div>

      <div className="ai-grid">
        <div className="card ai-summary-card">
          <h2>Summary</h2>
          <p>{analysis.summary}</p>

          <h3>Key Phrases Detected</h3>
          <div className="ai-tags">
            {analysis.keyPhrases.map((phrase) => (
              <span className="ai-tag" key={phrase}>
                {phrase}
              </span>
            ))}
          </div>
        </div>

        <div className="ai-sidebar">
          <div className="card ai-metric-card">
            <span className="ai-metric-label">Predicted Category</span>
            <span className="ai-metric-value">{analysis.predictedCategory}</span>
            <div className="ai-confidence-bar">
              <div
                className="ai-confidence-bar-fill"
                style={{ width: `${analysis.confidence}%` }}
              />
            </div>
            <span className="ai-confidence-label">{analysis.confidence}% confidence</span>
          </div>

          <div className="card ai-metric-row-card">
            <div className="ai-metric-row">
              <span>Priority Level</span>
              <span className="status-badge status-badge-pending">{analysis.priority}</span>
            </div>
            <div className="ai-metric-row">
              <span>Sentiment</span>
              <span className="status-badge status-badge-rejected">{analysis.sentiment}</span>
            </div>
            <div className="ai-metric-row">
              <span>Urgency Score</span>
              <strong>{analysis.urgencyScore} / 10</strong>
            </div>
            <div className="ai-metric-row">
              <span>Similar Complaints</span>
              <strong>{analysis.similarComplaints} this month</strong>
            </div>
          </div>

          <div className="card ai-routing-card">
            <span className="ai-metric-label">Routed To</span>
            <span className="ai-routing-department">{analysis.suggestedDepartment}</span>
            <p>
              Based on category, location, and historical resolution data, this
              department is best suited to act on this complaint.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAnalysisResult;