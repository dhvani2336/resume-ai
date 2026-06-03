import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../utils/api.js";
import CircularScore from "../components/CircularScore.jsx";

function ResumeScanner() {
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload & Analysis States
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'uploading' | 'success'
  const [fileName, setFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active Display State (either a new scan or a past selected scan)
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  // Resume History Management States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc"); // 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'
  const [isFetchingResume, setIsFetchingResume] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // Fetch user profile details
      const profileResponse = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profileData = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Session expired. Please log in again.");
      }

      setUser(profileData.user);

      // Fetch analyses list from the resumes endpoint
      const resumesResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resumesData = await resumesResponse.json();

      if (!resumesResponse.ok) {
        throw new Error(resumesData.error || "Failed to retrieve resume history.");
      }

      const list = resumesData.resumes || [];
      setAnalyses(list);

      // Read query parameter for a specific resume ID
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get("id");

      // Load specific or most recent scan
      if (idParam) {
        await handleViewAnalysis(idParam);
      } else if (list.length > 0 && !activeAnalysis) {
        await handleViewAnalysis(list[0].id);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } finally {
      // Minor delay to showcase the premium shimmering skeleton UI loaders
      setTimeout(() => {
        setLoading(false);
      }, 750);
    }
  };

  // Listen for query parameter changes to load different scans dynamically
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idParam = params.get("id");
    if (idParam && analyses.length > 0) {
      handleViewAnalysis(idParam);
    }
  }, [location.search, analyses.length]);

  const handleViewAnalysis = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsFetchingResume(true);
    try {
      const response = await fetch(`${API_BASE}/api/resumes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load analysis details.");
      }

      setActiveAnalysis(data.resume);
      setFileName(data.resume.originalname);
    } catch (err) {
      console.error("View analysis error:", err);
      setUploadError(err.message);
    } finally {
      setIsFetchingResume(false);
    }
  };

  const handleDeleteResume = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this resume scan and analysis scorecard?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/resumes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete resume.");
      }

      // If the deleted resume is the one active, clear it or load the next one
      const updatedList = analyses.filter(item => item.id !== id);
      setAnalyses(updatedList);

      if (activeAnalysis?.id === id) {
        if (updatedList.length > 0) {
          await handleViewAnalysis(updatedList[0].id);
        } else {
          setActiveAnalysis(null);
          setFileName("");
        }
      }
    } catch (err) {
      console.error("Delete resume error:", err);
      alert(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Uploader Handlers
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
      setResumeFile(null);
      setUploadState("idle");
      return;
    }

    setUploadError("");
    setResumeFile(file);
    setFileName(file.name);
    setUploadState("uploading");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed.");
      }

      setUploadState("success");
      setUploadedFilename(data.filename);
    } catch (err) {
      setUploadError(err.message);
      setUploadState("idle");
      setResumeFile(null);
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

  const handleAnalyze = async () => {
    if (!uploadedFilename) return;
    setIsAnalyzing(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: uploadedFilename,
          originalname: fileName,
          size: resumeFile ? resumeFile.size : 0,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed.");
      }

      // Re-fetch profile history to get the saved analysis entry
      await fetchProfile();
      setUploadState("idle");
      setResumeFile(null);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setUploadState("idle");
    setFileName("");
    setResumeFile(null);
    setUploadError("");
    setUploadedFilename("");
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
          <div className="dashboard-left" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "6rem", height: "1rem", marginBottom: "1rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "7.5rem", borderRadius: "0.5rem" }}></div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem", flexGrow: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1rem", marginBottom: "0.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "2.5rem", borderRadius: "0.375rem" }}></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.75rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.75rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ width: "100%", height: "3.75rem", borderRadius: "0.5rem" }}></div>
              </div>
            </div>
          </div>

          <div className="dashboard-right" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="glass-card" style={{ padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton skeleton-text" style={{ width: "6rem", height: "0.75rem" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "15rem", height: "1.25rem" }}></div>
                </div>
                <div className="skeleton skeleton-text" style={{ width: "4rem", height: "1.5rem" }}></div>
              </div>
              <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                <div className="skeleton skeleton-circle" style={{ width: "6rem", height: "6rem", borderRadius: "50%" }}></div>
                <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1rem" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "100%", height: "0.75rem" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "80%", height: "0.75rem" }}></div>
                </div>
              </div>
            </div>

            <div className="dashboard-details-grid">
              <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort analyses history list
  const filteredAnalyses = analyses
    .filter((item) =>
      item.originalname.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "score-desc") {
        return b.atsScore - a.atsScore;
      }
      if (sortBy === "score-asc") {
        return a.atsScore - b.atsScore;
      }
      return 0;
    });

  return (
    <div className="dashboard-wrapper animate-fade-in">
      {/* Dashboard Top Header Bar */}
      <header className="dashboard-header">
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-cyan)" }}></div>
          <span>Resume Scanner Workspace</span>
        </div>
        <div className="db-user-actions">
          <span className="db-welcome-text">User: <b>{user?.name}</b></span>
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ marginRight: "0.5rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm db-logout-btn">
            Log Out
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="dashboard-grid container">

        {/* Left Column: Actions and History List */}
        <div className="dashboard-left">

          {/* Section: Upload Resume */}
          <div className="glass-card db-card">
            <h3 className="card-section-title">Scan New Resume</h3>

            <div
              className={`upload-box db-upload-box ${dragActive ? "dragging" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{ padding: "1.75rem 1rem", borderRadius: "0.75rem" }}
            >
              <input
                type="file"
                id="db-file-upload-input"
                className="hidden-input"
                style={{ display: "none" }}
                accept=".pdf"
                onChange={handleFileSelect}
              />

              {uploadState === "idle" && (
                <>
                  <div className="upload-icon" style={{ width: "2.5rem", height: "2.5rem" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700 }}>Drag & drop resume PDF</h4>
                  <label htmlFor="db-file-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: "pointer", padding: "0.375rem 0.75rem", fontSize: "0.6875rem" }}>
                    Browse Files
                  </label>
                  {uploadError && (
                    <p style={{ color: "var(--color-rose)", fontSize: "0.75rem", fontWeight: 600 }}>
                      {uploadError}
                    </p>
                  )}
                </>
              )}

              {uploadState === "uploading" && (
                <>
                  <div className="spinner"></div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 600 }}>Uploading {fileName}...</h4>
                </>
              )}

              {uploadState === "success" && (
                <>
                  <div className="upload-icon" style={{ width: "2.5rem", height: "2.5rem", backgroundColor: "rgba(14, 165, 233, 0.08)", borderColor: "rgba(14, 165, 233, 0.15)", color: "var(--color-cyan)" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-cyan)" }}>Upload Ready</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{fileName}</p>

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      style={{ fontSize: "0.6875rem", padding: "0.375rem 0.75rem" }}
                    >
                      {isAnalyzing ? "Analyzing..." : "Run AI Analysis"}
                    </button>
                    <button onClick={resetUpload} className="btn btn-secondary btn-sm" style={{ fontSize: "0.6875rem", padding: "0.375rem 0.75rem" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section: Scan History list */}
          <div className="glass-card db-card" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <div className="db-history-header-row" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
              <h3 className="card-section-title" style={{ margin: 0 }}>Scan History</h3>

              {/* Search & Sort Panel */}
              <div className="db-history-controls" style={{ display: "flex", gap: "0.5rem" }}>
                <div className="search-wrapper" style={{ position: "relative", flexGrow: 1 }}>
                  <svg className="search-icon" style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", width: "0.75rem", height: "0.75rem", color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="db-search-input"
                    style={{ width: "100%", padding: "0.375rem 0.5rem 0.375rem 1.625rem", fontSize: "0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", outline: "none" }}
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="db-sort-select"
                  style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", borderRadius: "0.375rem", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-secondary)", outline: "none", cursor: "pointer" }}
                >
                  <option value="date-desc">Newest Date</option>
                  <option value="date-asc">Oldest Date</option>
                  <option value="score-desc">ATS: High-Low</option>
                  <option value="score-asc">ATS: Low-High</option>
                </select>
              </div>
            </div>

            {analyses.length === 0 ? (
              <div className="empty-history-box" style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "10rem" }}>
                <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>No scans logged yet. Upload your first resume above to begin!</p>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="empty-history-box" style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "10rem" }}>
                <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>No matches found for &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <div className="db-history-list" style={{ overflowY: "auto", flexGrow: 1, maxHeight: "25rem" }}>
                {filteredAnalyses.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleViewAnalysis(item.id)}
                    className={`db-history-item ${activeAnalysis?.id === item.id ? "active" : ""}`}
                    style={{ padding: "0.75rem 0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div className="db-hist-left" style={{ overflow: "hidden", marginRight: "0.5rem" }}>
                      <span className="db-hist-filename" style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{item.originalname}</span>
                      <span className="db-hist-date" style={{ fontSize: "0.625rem" }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div
                        className="db-hist-score"
                        style={{
                          fontSize: "0.6875rem",
                          padding: "0.1875rem 0.375rem",
                          color: item.atsScore >= 70 ? "var(--color-emerald)" : "var(--color-rose)",
                          backgroundColor: item.atsScore >= 70 ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)",
                          borderColor: item.atsScore >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)"
                        }}
                      >
                        {item.atsScore}%
                      </div>

                      <div className="db-history-actions" style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          title="View Analysis"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAnalysis(item.id);
                          }}
                          className="db-action-icon-btn"
                          style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", padding: "0.25rem", borderRadius: "4px" }}
                        >
                          <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          title="Delete Resume"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResume(item.id);
                          }}
                          className="db-action-icon-btn delete-hover"
                          style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", padding: "0.25rem", borderRadius: "4px" }}
                        >
                          <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Scorecard Details */}
        <div className="dashboard-right">
          {isFetchingResume ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }} className="animate-fade-in">
              <div className="glass-card" style={{ padding: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div className="skeleton skeleton-text" style={{ width: "6rem", height: "0.75rem" }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "15rem", height: "1.25rem" }}></div>
                  </div>
                  <div className="skeleton skeleton-text" style={{ width: "4rem", height: "1.5rem" }}></div>
                </div>
                <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
                  <div className="skeleton skeleton-circle" style={{ width: "6rem", height: "6rem", borderRadius: "50%" }}></div>
                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1rem" }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "100%", height: "0.75rem" }}></div>
                    <div className="skeleton skeleton-text" style={{ width: "80%", height: "0.75rem" }}></div>
                  </div>
                </div>
              </div>
              <div className="dashboard-details-grid">
                <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
                <div className="skeleton skeleton-block" style={{ height: "9.5rem", borderRadius: "0.5rem" }}></div>
              </div>
            </div>
          ) : activeAnalysis ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

              {/* Dynamic Scorecard */}
              <div className="glass-card" style={{ padding: "2rem" }}>

                <div className="card-header" style={{ borderBottom: "none", paddingBottom: "0", marginBottom: "1.5rem" }}>
                  <div>
                    <div className="card-title-sub">Scan Results Evaluation</div>
                    <h3 className="card-title-main" style={{ fontSize: "1.125rem", wordBreak: "break-all" }}>{fileName}</h3>
                  </div>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: activeAnalysis.atsScore >= 70 ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
                      borderColor: activeAnalysis.atsScore >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                      color: activeAnalysis.atsScore >= 70 ? "var(--color-emerald)" : "var(--color-rose)"
                    }}
                  >
                    {activeAnalysis.atsScore >= 70 ? "PASSED" : "WARNING"}
                  </span>
                </div>

                <div className="card-score-row" style={{ gap: "2rem", display: "flex", alignItems: "center" }}>
                  <CircularScore
                    score={activeAnalysis.atsScore}
                    size="6.5rem"
                    fontSize="1.25rem"
                    glow={true}
                  />

                  <div className="card-score-info">
                    <div className="score-title" style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem 0", color: "var(--color-text-primary)" }}>ATS Match Score</div>
                    <p className="score-desc" style={{ fontSize: "0.8125rem", maxWidth: "24rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      This resume matches {activeAnalysis.atsScore}% of target formatting guidelines, action-oriented verbs, and structural applicant tracking filters.
                    </p>
                  </div>
                </div>

              </div>

              {/* Dynamic Feedback Columns */}
              <div className="dashboard-details-grid">

                {/* Strengths */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-emerald)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-emerald)" }}>🏆 Strengths</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeAnalysis.strengths.map((str, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        ✓ {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-rose)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-rose)" }}>⚠️ Gaps & Formatting Gaps</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeAnalysis.weaknesses.map((weak, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        ⚠ {weak}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Missing Skills */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-purple)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-purple)" }}>💡 Missing Keywords</h4>
                  <div className="pills-container" style={{ marginTop: "0.5rem" }}>
                    {activeAnalysis.missingSkills.map((skill, idx) => (
                      <span key={idx} className="pill pill-danger" style={{ textTransform: "none", fontSize: "0.6875rem", padding: "0.25rem 0.5rem" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="feature-card" style={{ borderLeft: "4px solid var(--color-cyan)" }}>
                  <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-cyan)" }}>🚀 Recommendations</h4>
                  <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {activeAnalysis.suggestions.map((sug, idx) => (
                      <li key={idx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                        → {sug}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          ) : (
            <div className="empty-analysis-box glass-card">
              <svg style={{ width: "3.5rem", height: "3.5rem", color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No Active Scan Loaded</h3>
              <p>Upload a new resume PDF on the left panel, or select an entry from your Scan History to load detailed evaluations.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ResumeScanner;
