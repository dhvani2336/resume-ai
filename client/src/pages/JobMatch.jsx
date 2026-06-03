import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function JobMatch() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [matchHistory, setMatchHistory] = useState([]);
  
  // Loading & State variables
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  
  // Drag & drop for new resume
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Loaded Match Report (null means input form is visible)
  const [activeMatch, setActiveMatch] = useState(null);

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

      // 2. Fetch Job Match history
      const matchRes = await fetch(`${API_BASE}/api/job-match`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matchData = await matchRes.json();
      if (matchRes.ok && matchData.success) {
        setMatchHistory(matchData.matches || []);
        if (matchData.matches && matchData.matches.length > 0) {
          // By default, load the most recent report if history exists
          setActiveMatch(matchData.matches[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching initial job match data:", err);
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
      const response = await fetch(`${API_BASE}/api/job-match`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMatchHistory(data.matches || []);
      }
    } catch (err) {
      console.error("Error refreshing match history:", err);
    }
  };

  // Uploader Handlers for New Resume
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = async (file) => {
    if (!file) return;

    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPDF) {
      setUploadError("Please upload a PDF file only.");
      return;
    }

    setUploadError("");
    setIsUploading(true);
    const token = localStorage.getItem("token");

    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append("resume", file);

      const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (uploadResponse.status === 401) {
        handleLogout();
        return;
      }

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || "File upload failed.");
      }

      // 2. Parse & Save Resume Profile
      const analyzeResponse = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: uploadData.filename,
          originalname: uploadData.originalname,
          size: uploadData.size
        })
      });

      const analyzeData = await analyzeResponse.json();
      if (!analyzeResponse.ok || !analyzeData.success) {
        throw new Error(analyzeData.error || "Failed to catalog resume.");
      }

      // 3. Re-fetch Resumes to select the newly uploaded one
      const listResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const listData = await listResponse.json();
      if (listResponse.ok && listData.success) {
        setResumes(listData.resumes || []);
        // The newly analyzed resume will be the first item (newest first)
        if (listData.resumes && listData.resumes.length > 0) {
          setSelectedResumeId(listData.resumes[0].id);
        }
      }

      alert(`Successfully uploaded and selected: ${uploadData.originalname}`);
    } catch (err) {
      console.error("Drag-upload error:", err);
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  // Run Job Match Analysis
  const handleAnalyzeMatch = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setError("Please select or upload a resume to match.");
      return;
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
      setError("Please paste a job description (minimum 20 characters).");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/job-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobDescription: jobDescription
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Job match analysis failed.");
      }

      setActiveMatch(data.match);
      await refreshHistory();
      setJobDescription("");
    } catch (err) {
      console.error("Match analysis error:", err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadPastMatch = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/job-match/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok && data.success) {
        setActiveMatch(data.match);
      }
    } catch (err) {
      console.error("Error loading past match:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Helper: Return CSS theme based on match score
  const getScoreTheme = (score) => {
    if (score >= 90) return { name: "Excellent", class: "score-excellent", color: "var(--color-emerald)" };
    if (score >= 75) return { name: "Good", class: "score-good", color: "var(--color-cyan)" };
    if (score >= 60) return { name: "Moderate", class: "score-moderate", color: "var(--color-purple)" };
    return { name: "Needs Improvement", class: "score-needs-improvement", color: "var(--color-rose)" };
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
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.5rem", borderRadius: "0.375rem" }}></div>
            </div>
          </div>
          <div className="dashboard-right">
            <div className="glass-card" style={{ padding: "2rem", minHeight: "25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                <div className="skeleton skeleton-text" style={{ width: "15rem", height: "1.5rem" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "4rem", height: "1.5rem" }}></div>
              </div>
              <div style={{ display: "flex", gap: "2rem", alignItems: "center", marginBottom: "2rem" }}>
                <div className="skeleton skeleton-circle" style={{ width: "6.5rem", height: "6.5rem", borderRadius: "50%" }}></div>
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1rem" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "100%", height: "0.875rem" }}></div>
                </div>
              </div>
              <div className="dashboard-details-grid">
                <div className="skeleton skeleton-block" style={{ height: "8rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ height: "8rem", borderRadius: "0.5rem" }}></div>
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-purple)" }}></div>
          <span>Role Match Analyzer</span>
        </div>
        <div className="db-user-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="dashboard-grid container">
        
        {/* Left Column: Match history sidebar */}
        <div className="dashboard-left">
          <div className="glass-card db-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <h3 className="card-section-title">Match History</h3>
            
            {matchHistory.length === 0 ? (
              <div className="empty-history-box" style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  No match scans found. Select a resume and JD on the right to start!
                </p>
              </div>
            ) : (
              <div className="db-history-list" style={{ flexGrow: 1, overflowY: "auto" }}>
                {matchHistory.map((item) => {
                  const theme = getScoreTheme(item.matchScore);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => loadPastMatch(item.id)}
                      className={`db-history-item ${activeMatch?.id === item.id ? "active" : ""}`}
                      style={{ padding: "0.75rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <div className="db-hist-left" style={{ overflow: "hidden", marginRight: "0.5rem" }}>
                        <span className="db-hist-filename" style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {item.originalname}
                        </span>
                        <span className="db-hist-date" style={{ fontSize: "0.625rem" }}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div 
                        className="db-hist-score"
                        style={{ 
                          fontSize: "0.6875rem",
                          padding: "0.1875rem 0.375rem",
                          color: theme.color,
                          backgroundColor: `rgba(255, 255, 255, 0.02)`,
                          borderColor: theme.color,
                          border: `1px solid ${theme.color}`
                        }}
                      >
                        {item.matchScore}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button 
              onClick={() => {
                setActiveMatch(null);
                setJobDescription("");
              }}
              className="btn btn-primary"
              style={{ marginTop: "1rem", width: "100%", fontSize: "0.75rem", padding: "0.5rem" }}
            >
              + New Match Scan
            </button>
          </div>
        </div>

        {/* Right Column: Work area / results */}
        <div className="dashboard-right">
          
          {isAnalyzing ? (
            <div className="glass-card" style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "25rem" }}>
              <div className="spinner" style={{ width: "3rem", height: "3rem", borderWidth: "3px", borderColor: "var(--color-purple) transparent" }}></div>
              <h3 style={{ marginTop: "1.5rem", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>Comparing Resume to Job Description...</h3>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-muted)", maxWidth: "20rem", textAlign: "center" }}>
                Gemini AI is scanning keyword alignments, matching core competencies, and compiling layout improvement tips.
              </p>
            </div>
          ) : activeMatch ? (
            /* Results Screen */
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              <div className="glass-card" style={{ padding: "2rem" }}>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                  <div>
                    <div className="card-title-sub">Job Match Scorecard</div>
                    <h3 className="card-title-main" style={{ fontSize: "1.125rem", wordBreak: "break-all" }}>{activeMatch.originalname}</h3>
                  </div>
                  
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      borderColor: getScoreTheme(activeMatch.matchScore).color,
                      color: getScoreTheme(activeMatch.matchScore).color,
                      border: `1px solid ${getScoreTheme(activeMatch.matchScore).color}`,
                      textTransform: "uppercase",
                      fontSize: "0.6875rem",
                      padding: "0.25rem 0.5rem"
                    }}
                  >
                    {getScoreTheme(activeMatch.matchScore).name}
                  </span>
                </div>

                <div className="card-score-row" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                  <div className="progress-container" style={{ width: "6.5rem", height: "6.5rem" }}>
                    <svg className="progress-svg">
                      <circle className="progress-circle-bg" r="34" cx="42" cy="42" style={{ stroke: "rgba(255, 255, 255, 0.05)" }} />
                      <circle
                        className="progress-circle-fill"
                        r="34"
                        cx="42"
                        cy="42"
                        style={{
                          stroke: getScoreTheme(activeMatch.matchScore).color,
                          strokeDashoffset: 214 - (214 * activeMatch.matchScore) / 100
                        }}
                      />
                    </svg>
                    <div className="progress-text" style={{ fontSize: "1.25rem", color: "var(--color-text-primary)" }}>{activeMatch.matchScore}%</div>
                  </div>

                  <div className="card-score-info" style={{ flexGrow: 1 }}>
                    <h4 style={{ fontSize: "0.9375rem", color: "var(--color-text-primary)", fontWeight: 700, margin: "0 0 0.25rem 0" }}>Role Relevance Level</h4>
                    <p className="score-desc" style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.5", margin: 0 }}>
                      This profile has a match score of <b>{activeMatch.matchScore}%</b> based on skills matching, structural formatting overlaps, and background experiences requested in the JD.
                    </p>
                  </div>
                </div>

              </div>

              {/* Match Feedback Details */}
              <div className="dashboard-details-grid">
                
                {/* Matching Skills */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-emerald)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-emerald)" }}>✓ Matching Competencies</h4>
                  <div className="pills-container" style={{ marginTop: "0.5rem" }}>
                    {activeMatch.matchingSkills.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>None identified.</span>
                    ) : (
                      activeMatch.matchingSkills.map((skill, idx) => (
                        <span key={idx} className="pill pill-success" style={{ textTransform: "none", fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-rose)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-rose)" }}>✗ Missing Keywords / Skills</h4>
                  <div className="pills-container" style={{ marginTop: "0.5rem" }}>
                    {activeMatch.missingKeywords.length === 0 ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Great! No major keyword gaps.</span>
                    ) : (
                      activeMatch.missingKeywords.map((kw, idx) => (
                        <span key={idx} className="pill pill-danger" style={{ textTransform: "none", fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}>
                          {kw}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-cyan)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-cyan)" }}>🏆 Strengths relevant to Role</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeMatch.strengths.map((str, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        ✓ {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-purple)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-purple)" }}>🚀 Recommendations</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeMatch.improvementSuggestions.map((sug, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        → {sug}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          ) : (
            /* Input Form Screen */
            <div className="glass-card" style={{ padding: "2.5rem" }}>
              <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Analyze Job Match Relevance</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0 0" }}>
                  Select or upload a resume PDF and paste a job description.
                </p>
              </div>

              {error && (
                <div style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: "6px", padding: "0.75rem", marginBottom: "1.5rem", color: "var(--color-rose)", fontSize: "0.8125rem", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleAnalyzeMatch} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Resume Selector */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                    Select Resume Profile
                  </label>
                  {resumes.length === 0 ? (
                    <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                      No resumes uploaded yet. Please upload a PDF below.
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      style={{ width: "100%", padding: "0.625rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", outline: "none", cursor: "pointer", marginBottom: "0.75rem" }}
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.originalname} ({new Date(r.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Micro uploader inside Match Page */}
                  <div
                    className={`upload-box db-upload-box ${dragActive ? "dragging" : ""}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    style={{ padding: "1.25rem 1rem", borderRadius: "0.5rem", border: "1px dashed var(--color-border)" }}
                  >
                    <input
                      type="file"
                      id="match-file-upload-input"
                      className="hidden-input"
                      style={{ display: "none" }}
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                    
                    {isUploading ? (
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
                        <div className="spinner" style={{ width: "1rem", height: "1rem" }}></div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>Uploading & cataloging file...</span>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Or drag/drop a new resume PDF here, or{" "}
                          <label htmlFor="match-file-upload-input" style={{ color: "var(--color-purple)", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                            browse files
                          </label>
                        </span>
                        {uploadError && (
                          <div style={{ color: "var(--color-rose)", fontSize: "0.6875rem", marginTop: "0.25rem", fontWeight: 600 }}>
                            {uploadError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description Textarea */}
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                    Paste Job Description
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Paste the full job description text here (skills, qualifications, expectations)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                    <span>Minimum 20 characters required.</span>
                    <span>Characters: {jobDescription.length}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || isUploading}
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.75rem", fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.5px" }}
                >
                  Analyze Job Match Relevance
                </button>

              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default JobMatch;
