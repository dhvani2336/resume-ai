import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function PublicReportView({ type }) {
  const { token } = useParams();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [token, type]);

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = type === "resume" 
        ? `${API_BASE}/api/public/reports/${token}`
        : `${API_BASE}/api/public/job-match/${token}`;

      const response = await fetch(endpoint);
      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Shared report not found or sharing has been disabled by owner.");
      }

      setData(type === "resume" ? resData.resume : resData.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "5rem", textAlign: "center" }}>
          <div className="spinner" style={{ 
            width: "48px", 
            height: "48px", 
            border: "3px solid transparent", 
            borderTopColor: "var(--color-cyan)", 
            borderRadius: "50%", 
            margin: "0 auto 1.5rem",
            animation: "spin 1s linear infinite" 
          }}></div>
          <p style={{ color: "var(--color-text-secondary)" }}>Retrieving public scorecard details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "5rem", textAlign: "center" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            borderRadius: "50%", 
            backgroundColor: "rgba(244, 63, 94, 0.1)", 
            color: "var(--color-rose)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 1.5rem"
          }}>
            <svg style={{ width: "32px", height: "32px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Report Not Found</h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem" }}>{error}</p>
          <Link to="/" className="btn btn-primary">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const isResume = type === "resume";

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ paddingBottom: "5rem" }}>
      {/* Navbar Brand Header (Static / Non-Dashboard style) */}
      <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)", marginBottom: "3rem" }}>
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: isResume ? "var(--color-cyan)" : "var(--color-purple)" }}></div>
          <span>ResumeAI Scorecard</span>
        </div>
        <div>
          <Link to="/" className="btn btn-sm btn-secondary">
            Analyze Your Own Resume
          </Link>
        </div>
      </header>

      <div className="container">
        
        {/* Header summary block */}
        <div className="glass-card" style={{ padding: "2.5rem 2rem", marginBottom: "2.5rem", borderLeft: `5px solid ${isResume ? "var(--color-cyan)" : "var(--color-purple)"}` }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", tracking: "0.05em", color: isResume ? "var(--color-cyan)" : "var(--color-purple)", fontWeight: 600 }}>
            Public Share Link • Verified Report
          </span>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "white", marginTop: "0.25rem", marginBottom: "0.5rem" }}>
            {data.originalname}
          </h2>
          <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            Generated on {new Date(data.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2.25fr", gap: "2.5rem", alignItems: "start" }} className="public-report-grid">
          
          {/* Score display card */}
          <div className="glass-card" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--color-text-secondary)", textTransform: "uppercase", tracking: "0.05em", marginBottom: "1.5rem" }}>
              {isResume ? "Overall ATS Score" : "Job Match Compatibility"}
            </h3>
            
            {/* Circle Match dial */}
            <div style={{ 
              position: "relative", 
              width: "160px", 
              height: "160px", 
              margin: "0 auto 1.5rem",
              borderRadius: "50%",
              border: `4px solid rgba(${isResume ? "14, 165, 233" : "168, 85, 247"}, 0.1)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.15)"
            }}>
              <div style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                border: "4px solid transparent",
                borderTopColor: isResume ? "var(--color-cyan)" : "var(--color-purple)",
                animation: "spin 2s linear infinite"
              }}></div>
              <div style={{ fontSize: "3.25rem", fontWeight: 800, color: isResume ? "var(--color-cyan)" : "var(--color-purple)" }}>
                {isResume ? data.atsScore : data.matchScore}%
              </div>
            </div>

            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", lineHeight: "1.4" }}>
              * Calculated by ResumeAI's Gemini processor examining layout density, quantifications, matching keywords, and experience credentials.
            </p>
          </div>

          {/* Details breakdown card */}
          {isResume ? (
            /* RENDER RESUME ATS REPORT */
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Strengths */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-emerald)", marginBottom: "1rem" }}>
                  🟢 Resume Strengths
                </h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                  {data.strengths?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-rose)", marginBottom: "1rem" }}>
                  🔴 Weaknesses & Friction Areas
                </h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                  {data.weaknesses?.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-cyan)", marginBottom: "1.25rem" }}>
                  🔍 Missing Technical Skills
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {data.missingSkills?.map((skill, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontSize: "0.8125rem", 
                        backgroundColor: "rgba(14, 165, 233, 0.12)", 
                        color: "var(--color-cyan)", 
                        padding: "0.375rem 0.75rem", 
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(14, 165, 233, 0.25)"
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-purple)", marginBottom: "1rem" }}>
                  💡 Actionable Improvement Suggestions
                </h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                  {data.suggestions?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            /* RENDER JOB MATCH REPORT */
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Job Description expander */}
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "white", marginBottom: "0.75rem" }}>Job Description Context</h4>
                <div style={{ 
                  maxHeight: "120px", 
                  overflowY: "auto", 
                  fontSize: "0.8125rem", 
                  color: "var(--color-text-secondary)", 
                  padding: "0.75rem", 
                  backgroundColor: "rgba(0,0,0,0.2)", 
                  borderRadius: "0.25rem",
                  whiteSpace: "pre-wrap"
                }}>
                  {data.jobDescription}
                </div>
              </div>

              {/* Matching Skills */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-emerald)", marginBottom: "1.25rem" }}>
                  ✅ Matching Competencies
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {data.matchingSkills?.map((skill, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontSize: "0.8125rem", 
                        backgroundColor: "rgba(16, 185, 129, 0.12)", 
                        color: "var(--color-emerald)", 
                        padding: "0.375rem 0.75rem", 
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(16, 185, 129, 0.2)"
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-rose)", marginBottom: "1.25rem" }}>
                  ⚠️ Missing Keywords & Core Skills
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {data.missingKeywords?.map((kw, idx) => (
                    <span 
                      key={idx}
                      style={{ 
                        fontSize: "0.8125rem", 
                        backgroundColor: "rgba(244, 63, 94, 0.12)", 
                        color: "var(--color-rose)", 
                        padding: "0.375rem 0.75rem", 
                        borderRadius: "0.375rem",
                        border: "1px solid rgba(244, 63, 94, 0.2)"
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-cyan)", marginBottom: "1rem" }}>
                  🔵 Role-Relevant Strengths
                </h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                  {data.strengths?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="glass-card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--color-purple)", marginBottom: "1rem" }}>
                  💡 Suggested Actionable Adjustments
                </h3>
                <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.9375rem" }}>
                  {data.improvementSuggestions?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default PublicReportView;
