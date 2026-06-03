import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function ResumeVersions() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [versions, setVersions] = useState([]);
  
  // File upload states
  const [pdfFile, setPdfFile] = useState(null);
  const [changesSummary, setChangesSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Version comparison states
  const [v1Id, setV1Id] = useState("");
  const [v2Id, setV2Id] = useState("");
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, [navigate]);

  const fetchResumes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load resumes.");
      
      setResumes(data.resumes || []);
      if (data.resumes.length > 0) {
        await handleSelectResume(data.resumes[0]);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = async (resume) => {
    setSelectedResume(resume);
    setVersions([]);
    setComparison(null);
    setV1Id("");
    setV2Id("");
    
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/api/resumes/${resume.id}/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load versions.");
      setVersions(data.versions || []);
      
      // Pre-populate comparison dropdowns if versions exist
      if (data.versions.length >= 2) {
        setV1Id(data.versions[data.versions.length - 2].id);
        setV2Id(data.versions[data.versions.length - 1].id);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      setMessage({ text: "Please select a PDF file only.", type: "error" });
      setPdfFile(null);
    }
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!pdfFile || !selectedResume) return;

    setUploading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      // 1. Upload to /api/upload
      const formData = new FormData();
      formData.append("resume", pdfFile);
      
      const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || "File upload failed.");

      // 2. Save version in version history
      const versionResponse = await fetch(`${API_BASE}/api/resumes/${selectedResume.id}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: uploadData.filename,
          originalname: uploadData.originalname,
          changesSummary: changesSummary || "Updated PDF resume details."
        })
      });
      const versionData = await versionResponse.json();
      if (!versionResponse.ok) throw new Error(versionData.error || "Failed to save resume version.");

      setMessage({ text: `Version ${versionData.version.versionNumber} added successfully!`, type: "success" });
      setPdfFile(null);
      setChangesSummary("");
      
      // Refresh version history
      await handleSelectResume(selectedResume);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleCompareVersions = async (e) => {
    e.preventDefault();
    if (!v1Id || !v2Id || !selectedResume) return;

    setComparing(true);
    setComparison(null);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE}/api/resumes/${selectedResume.id}/versions/compare?v1=${v1Id}&v2=${v2Id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Version comparison failed.");
      
      setComparison(data.comparison);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", gap: "2rem" }}>
            <div className="glass-card" style={{ height: "20rem" }}></div>
            <div className="glass-card" style={{ height: "20rem" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Header */}
      <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)", marginBottom: "2rem" }}>
        <div className="db-brand">
          <Link to="/dashboard" className="nav-back-link" style={{ marginRight: "1rem" }}>
            ← Back
          </Link>
          <div className="db-logo-dot"></div>
          <span>Version Control</span>
        </div>
        <div>
          <select 
            value={selectedResume?.id || ""} 
            onChange={(e) => {
              const res = resumes.find(r => r.id === e.target.value);
              if (res) handleSelectResume(res);
            }}
            style={{
              padding: "0.5rem",
              backgroundColor: "rgba(17, 24, 39, 0.8)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.375rem",
              color: "white"
            }}
          >
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.filename}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="container">
        {message.text && (
          <div className="glass-card" style={{ 
            padding: "1rem", 
            marginBottom: "2rem", 
            borderLeft: `4px solid ${message.type === "success" ? "var(--color-emerald)" : "var(--color-rose)"}`,
            backgroundColor: "rgba(17, 24, 39, 0.8)"
          }}>
            <p style={{ color: message.type === "success" ? "var(--color-emerald)" : "var(--color-rose)", fontSize: "0.9375rem" }}>
              {message.text}
            </p>
          </div>
        )}

        {selectedResume ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2fr", gap: "2rem" }} className="versions-grid-layout">
            
            {/* LEFT COLUMN: Version History & Upload form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Version History Logs */}
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem" }}>History Log</h3>
                
                {versions.length === 0 ? (
                  <div style={{ padding: "2rem 1rem", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "0.375rem" }}>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>Original resume uploaded without logs. Add a new version below to begin tracking.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {versions.map(v => (
                      <div 
                        key={v.id} 
                        style={{ 
                          padding: "1rem", 
                          border: "1px solid var(--color-border)", 
                          borderRadius: "0.375rem",
                          backgroundColor: "rgba(17, 24, 39, 0.2)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: 600, color: "var(--color-cyan)" }}>Version {v.versionNumber}</span>
                          <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.06)", padding: "0.15rem 0.5rem", borderRadius: "0.25rem" }}>
                            ATS: {v.atsScore}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>{v.changesSummary}</p>
                        <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                          {new Date(v.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Version form */}
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Upload New Version</h3>
                <form onSubmit={handleUploadVersion}>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label>Select PDF Resume</label>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={handleFileChange} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label>Changes Summary</label>
                    <textarea 
                      rows="3" 
                      placeholder="e.g. Added full-stack project, rephrased bullets, updated keywords..."
                      value={changesSummary}
                      onChange={(e) => setChangesSummary(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-secondary btn-block" disabled={uploading || !pdfFile}>
                    {uploading ? "Analyzing & Saving..." : "Upload & Scan Version"}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: Version Comparison tools */}
            <div className="glass-card" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>AI Version Comparison</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Select two historic versions of your resume, and Gemini will perform a side-by-side analysis of code improvements, achievement edits, and matching score shifts.
              </p>

              <form onSubmit={handleCompareVersions} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "end", marginBottom: "2rem" }}>
                <div className="form-group">
                  <label>Baseline Version (v1)</label>
                  <select 
                    value={v1Id} 
                    onChange={(e) => setV1Id(e.target.value)}
                    style={{ padding: "0.5rem", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", color: "white" }}
                  >
                    <option value="">-- Select --</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>Version {v.versionNumber} (ATS: {v.atsScore})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Comparison Version (v2)</label>
                  <select 
                    value={v2Id} 
                    onChange={(e) => setV2Id(e.target.value)}
                    style={{ padding: "0.5rem", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", color: "white" }}
                  >
                    <option value="">-- Select --</option>
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>Version {v.versionNumber} (ATS: {v.atsScore})</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" disabled={comparing || !v1Id || !v2Id} style={{ height: "42px" }}>
                  {comparing ? "Comparing..." : "Compare"}
                </button>
              </form>

              {/* Comparison Results Card */}
              {comparing && (
                <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                  <div className="spinner" style={{ 
                    width: "36px", 
                    height: "36px", 
                    border: "2px solid transparent", 
                    borderTopColor: "var(--color-cyan)", 
                    borderRadius: "50%", 
                    margin: "0 auto 1rem",
                    animation: "spin 1s linear infinite" 
                  }}></div>
                  <p style={{ color: "var(--color-text-secondary)" }}>Gemini AI is parsing and comparing both PDF texts...</p>
                </div>
              )}

              {comparison && (
                <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Score Diff Hero */}
                  <div className="glass-card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid " + (comparison.atsScoreDiff >= 0 ? "var(--color-emerald)" : "var(--color-rose)") }}>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>Score Variance</h4>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem" }}>
                        Version {comparison.v1.versionNumber} ({comparison.v1.atsScore}) vs Version {comparison.v2.versionNumber} ({comparison.v2.atsScore})
                      </p>
                    </div>
                    <div style={{ 
                      fontSize: "1.75rem", 
                      fontWeight: 700, 
                      color: comparison.atsScoreDiff >= 0 ? "var(--color-emerald)" : "var(--color-rose)" 
                    }}>
                      {comparison.atsScoreDiff >= 0 ? `+${comparison.atsScoreDiff}` : comparison.atsScoreDiff}%
                    </div>
                  </div>

                  {/* List of Improvements */}
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "var(--color-cyan)" }}>Concrete Improvements Made</h4>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                      {comparison.improvements?.map((imp, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>{imp}</li>
                      ))}
                    </ul>
                  </div>

                  {/* New Skills / Achievements Added */}
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "var(--color-purple)" }}>New Skills & Achievements</h4>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                      {comparison.newSkillsAndAchievements?.map((nsa, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>{nsa}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Gaps remaining */}
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.5rem", color: "var(--color-rose)" }}>Remaining Opportunities / Gaps</h4>
                    <ul style={{ paddingLeft: "1.25rem", fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                      {comparison.remainingGaps?.map((gap, idx) => (
                        <li key={idx} style={{ marginBottom: "0.25rem" }}>{gap}</li>
                      ))}
                    </ul>
                  </div>

                  {/* AI Verdict */}
                  <div style={{ backgroundColor: "rgba(14, 165, 233, 0.05)", padding: "1.25rem", border: "1px solid rgba(14, 165, 233, 0.15)", borderRadius: "0.375rem" }}>
                    <h4 style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--color-cyan)", marginBottom: "0.5rem" }}>AI Verdict</h4>
                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: "1.5" }}>{comparison.verdict}</p>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <p style={{ color: "var(--color-text-muted)" }}>Please upload a resume first from the dashboard to create versions.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default ResumeVersions;
