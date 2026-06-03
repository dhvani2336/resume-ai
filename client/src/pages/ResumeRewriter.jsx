import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function ResumeRewriter() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [manualText, setManualText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [inputType, setInputType] = useState("dropdown"); // 'dropdown' | 'manual'
  const [rewriteHistory, setRewriteHistory] = useState([]);
  
  // Loading & State variables
  const [loading, setLoading] = useState(true);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState("");
  
  // Loaded Active Report (null means input form is visible)
  const [activeRewrite, setActiveRewrite] = useState(null);
  
  // Result Display Tab (for comparison)
  const [resultTab, setResultTab] = useState("rewritten"); // 'rewritten' | 'original' | 'compare'

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, [navigate]);

  const fetchInitialData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // 1. Fetch Resumes list
      const resumeRes = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resumeData = await resumeRes.json();
      if (resumeRes.ok && resumeData.success) {
        setResumes(resumeData.resumes || []);
        if (resumeData.resumes && resumeData.resumes.length > 0) {
          setSelectedResumeId(resumeData.resumes[0].id);
        }
      }

      // 2. Fetch Rewrite history
      const rewriteRes = await fetch(`${API_BASE}/api/rewrite`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const rewriteData = await rewriteRes.json();
      if (rewriteRes.ok && rewriteData.success) {
        setRewriteHistory(rewriteData.rewrites || []);
        if (rewriteData.rewrites && rewriteData.rewrites.length > 0) {
          // By default, load the most recent report if history exists
          setActiveRewrite(rewriteData.rewrites[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching initial rewrite data:", err);
      setError("Failed to load page data.");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  const refreshHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/rewrite`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRewriteHistory(data.rewrites || []);
      }
    } catch (err) {
      console.error("Error refreshing rewrite history:", err);
    }
  };

  // Run AI Rewrite
  const handleRewrite = async (e) => {
    e.preventDefault();
    if (inputType === "dropdown" && !selectedResumeId) {
      setError("Please select a resume profile to rewrite.");
      return;
    }
    if (inputType === "manual" && (!manualText || manualText.trim().length < 10)) {
      setError("Please paste the resume content manually (minimum 10 characters).");
      return;
    }
    if (!targetRole || targetRole.trim().length === 0) {
      setError("Please specify the target job role.");
      return;
    }

    setError("");
    setIsRewriting(true);
    const token = localStorage.getItem("token");

    const payload = {
      targetRole
    };
    if (inputType === "dropdown") {
      payload.resumeId = selectedResumeId;
    } else {
      payload.resumeText = manualText;
    }

    try {
      const response = await fetch(`${API_BASE}/api/rewrite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Resume rewriting failed.");
      }

      setActiveRewrite(data.rewrite);
      await refreshHistory();
      // Reset inputs
      setManualText("");
      setTargetRole("");
    } catch (err) {
      console.error("Rewrite process error:", err);
      setError(err.message);
    } finally {
      setIsRewriting(false);
    }
  };

  const loadPastRewrite = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/rewrite/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok && data.success) {
        setActiveRewrite(data.rewrite);
      }
    } catch (err) {
      console.error("Error loading past rewrite:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Feature: Copy to Clipboard
  const handleCopyToClipboard = () => {
    if (!activeRewrite) return;
    navigator.clipboard.writeText(activeRewrite.rewrittenContent);
    alert("Copied rewritten content to clipboard!");
  };

  // Feature: Download rewritten text file
  const handleDownloadTxt = () => {
    if (!activeRewrite) return;
    const element = document.createElement("a");
    const file = new Blob([activeRewrite.rewrittenContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `rewritten-${activeRewrite.originalname.replace(/\s+/g, '_')}-${activeRewrite.targetRole.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="db-brand">
            <div className="db-logo-dot"></div>
            <span>ResumeAI Dashboard</span>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1rem" }}></div>
            <div className="skeleton skeleton-btn" style={{ width: "4.5rem", height: "1.875rem", borderRadius: "0.375rem" }}></div>
          </div>
        </header>

        <div className="dashboard-grid container" style={{ marginTop: "2rem" }}>
          <div className="dashboard-left">
            <div className="glass-card" style={{ padding: "1.5rem", height: "30rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "10rem", height: "1rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.5rem", borderRadius: "0.375rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.5rem", borderRadius: "0.375rem" }}></div>
            </div>
          </div>
          <div className="dashboard-right">
            <div className="glass-card" style={{ padding: "2rem", minHeight: "25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                <div className="skeleton skeleton-text" style={{ width: "15rem", height: "1.5rem" }}></div>
              </div>
              <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2rem" }}>
                <div className="skeleton skeleton-block" style={{ flexGrow: 1, height: "10rem" }}></div>
                <div className="skeleton skeleton-block" style={{ flexGrow: 1, height: "10rem" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="dashboard-header">
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-cyan)" }}></div>
          <span>AI Resume Rewriter</span>
        </div>
        <div className="db-user-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="dashboard-grid container">
        
        {/* Left Column: History list */}
        <div className="dashboard-left">
          <div className="glass-card db-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <h3 className="card-section-title">Rewrite Logs</h3>
            
            {rewriteHistory.length === 0 ? (
              <div className="empty-history-box" style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  No rewrite history found. Choose a file or paste text on the right to start!
                </p>
              </div>
            ) : (
              <div className="db-history-list" style={{ flexGrow: 1, overflowY: "auto" }}>
                {rewriteHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadPastRewrite(item.id)}
                    className={`db-history-item ${activeRewrite?.id === item.id ? "active" : ""}`}
                    style={{ padding: "0.75rem 0.875rem" }}
                  >
                    <div className="db-hist-left" style={{ overflow: "hidden" }}>
                      <span className="db-hist-filename" style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {item.originalname}
                      </span>
                      <span className="db-hist-date" style={{ display: "block", fontSize: "0.625rem" }}>
                        Role: {item.targetRole}
                      </span>
                      <span className="db-hist-date" style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => {
                setActiveRewrite(null);
                setTargetRole("");
              }}
              className="btn btn-primary"
              style={{ marginTop: "1rem", width: "100%", fontSize: "0.75rem", padding: "0.5rem" }}
            >
              + Create New Rewrite
            </button>
          </div>
        </div>

        {/* Right Column: Work area / results comparison */}
        <div className="dashboard-right">
          
          {isRewriting ? (
            <div className="glass-card" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "25rem" }}>
              <div className="spinner" style={{ width: "3rem", height: "3rem", borderWidth: "3px", borderColor: "var(--color-cyan) transparent" }}></div>
              <h3 style={{ marginTop: "1.5rem", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>Rewriting Resume with Gemini AI...</h3>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", maxWidth: "20rem", textAlign: "center" }}>
                Improving verbs, structuring project bullets, and optimizing key phrases for ATS compliance.
              </p>
            </div>
          ) : activeRewrite ? (
            /* Results Screen */
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              <div className="glass-card" style={{ padding: "2rem" }}>
                
                {/* Header Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <span className="card-title-sub">Target Role: {activeRewrite.targetRole}</span>
                    <h3 className="card-title-main" style={{ fontSize: "1.125rem", wordBreak: "break-all", margin: 0 }}>{activeRewrite.originalname}</h3>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleCopyToClipboard} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", padding: "0.375rem 0.75rem" }}>
                      <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 4h6m-6 4h6m-6 4h1" />
                      </svg>
                      Copy
                    </button>
                    <button onClick={handleDownloadTxt} className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", padding: "0.375rem 0.75rem" }}>
                      <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>

                {/* Tab select headers */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
                  <button 
                    onClick={() => setResultTab("rewritten")}
                    className={`nav-link ${resultTab === "rewritten" ? "active" : ""}`}
                    style={{ background: "transparent", border: "none", fontSize: "0.8125rem", padding: "0.5rem 1rem", borderBottom: resultTab === "rewritten" ? "2px solid var(--color-cyan)" : "none", color: resultTab === "rewritten" ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                  >
                    AI Rewritten Version
                  </button>
                  <button 
                    onClick={() => setResultTab("original")}
                    className={`nav-link ${resultTab === "original" ? "active" : ""}`}
                    style={{ background: "transparent", border: "none", fontSize: "0.8125rem", padding: "0.5rem 1rem", borderBottom: resultTab === "original" ? "2px solid var(--color-cyan)" : "none", color: resultTab === "original" ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                  >
                    Original Version
                  </button>
                  <button 
                    onClick={() => setResultTab("compare")}
                    className={`nav-link ${resultTab === "compare" ? "active" : ""}`}
                    style={{ background: "transparent", border: "none", fontSize: "0.8125rem", padding: "0.5rem 1rem", borderBottom: resultTab === "compare" ? "2px solid var(--color-cyan)" : "none", color: resultTab === "compare" ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
                  >
                    Side-by-Side Compare
                  </button>
                </div>

                {/* Tab content wrapper */}
                <div>
                  {resultTab === "rewritten" && (
                    <div style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1.25rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", lineHeight: "1.6", maxHeight: "25rem", overflowY: "auto", textAlign: "left" }}>
                      {activeRewrite.rewrittenContent}
                    </div>
                  )}

                  {resultTab === "original" && (
                    <div style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1.25rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", whiteSpace: "pre-wrap", lineHeight: "1.6", maxHeight: "25rem", overflowY: "auto", textAlign: "left" }}>
                      {activeRewrite.originalContent}
                    </div>
                  )}

                  {resultTab === "compare" && (
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "0.5rem", textAlign: "left" }}>Original</div>
                        <div style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1rem", fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "pre-wrap", lineHeight: "1.5", height: "20rem", overflowY: "auto", textAlign: "left" }}>
                          {activeRewrite.originalContent}
                        </div>
                      </div>
                      <div style={{ flex: "1 1 300px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem", textAlign: "left" }}>AI Rewritten</div>
                        <div style={{ backgroundColor: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap", lineHeight: "1.5", height: "20rem", overflowY: "auto", textAlign: "left" }}>
                          {activeRewrite.rewrittenContent}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Improvements details */}
              <div className="dashboard-details-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                
                {/* Improvements Made */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-cyan)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-cyan)" }}>🚀 Improvements Made</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeRewrite.improvements.map((imp, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        ✓ {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ATS Impact Rating */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-emerald)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-emerald)" }}>📈 ATS Optimization Impact</h4>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: 0 }}>
                    {activeRewrite.atsImpact}
                  </p>
                </div>

              </div>

            </div>
          ) : (
            /* Input Form Screen */
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>AI Resume Rewriter</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0 0" }}>
                  Let Gemini AI optimize your experience bullets and formatting for ATS compatibility.
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px", padding: "0.75rem", marginBottom: "1.5rem", color: "var(--color-rose)", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRewrite} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Input Method Toggle */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                    Select Input Type
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => setInputType("dropdown")}
                      className={`btn btn-sm ${inputType === "dropdown" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, fontSize: "0.75rem" }}
                    >
                      Use Uploaded Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputType("manual")}
                      className={`btn btn-sm ${inputType === "manual" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, fontSize: "0.75rem" }}
                    >
                      Paste Text Manually
                    </button>
                  </div>
                  
                  {inputType === "dropdown" ? (
                    <div>
                      {resumes.length === 0 ? (
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          No resumes uploaded yet. Go to your Dashboard to upload a resume first.
                        </div>
                      ) : (
                        <select
                          value={selectedResumeId}
                          onChange={(e) => setSelectedResumeId(e.target.value)}
                          style={{ width: "100%", padding: "0.625rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", outline: "none", cursor: "pointer" }}
                        >
                          {resumes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.originalname} ({new Date(r.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : (
                    <textarea
                      rows={6}
                      placeholder="Paste your resume content, experience bullets, or project descriptions here..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                    />
                  )}
                </div>

                {/* Target Role input field */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                    Target Job Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior React Developer, Product Manager..."
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{ width: "100%", padding: "0.625rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", outline: "none" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRewriting}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.5px" }}
                >
                  Rewrite with AI
                </button>

              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ResumeRewriter;
