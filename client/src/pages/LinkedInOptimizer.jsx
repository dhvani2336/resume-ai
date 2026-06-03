import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function LinkedInOptimizer() {
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Inputs
  const [selectedResumeId, setSelectedResumeId] = useState("");

  // Outputs
  const [activeProfile, setActiveProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
      // 1. Fetch resumes
      const resResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await resResponse.json();
      if (!resResponse.ok) throw new Error(resData.error || "Failed to load resumes.");
      setResumes(resData.resumes || []);
      if (resData.resumes.length > 0) {
        setSelectedResumeId(resData.resumes[0].id);
      }

      // 2. Fetch linkedin history
      const historyResponse = await fetch(`${API_BASE}/api/linkedin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyResponse.json();
      if (!historyResponse.ok) throw new Error(historyData.error || "Failed to load LinkedIn logs.");
      setHistory(historyData.profiles || []);

      if (historyData.profiles.length > 0) {
        setActiveProfile(historyData.profiles[0]);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) return;

    setGenerating(true);
    setActiveProfile(null);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/linkedin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeId: selectedResumeId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to optimize LinkedIn profile.");

      setActiveProfile(data.profile);
      setHistory(prev => [data.profile, ...prev]);
      setMessage({ text: "LinkedIn optimizations generated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ text: "Copied to clipboard!", type: "success" });
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2fr", gap: "2rem" }}>
            <div className="glass-card" style={{ height: "22rem" }}></div>
            <div className="glass-card" style={{ height: "22rem" }}></div>
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-indigo)" }}></div>
          <span>LinkedIn Optimizer</span>
        </div>
        <div>
          <Link to="/profile" className="btn btn-sm btn-secondary">
            My Profile
          </Link>
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

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2.5fr", gap: "2rem", alignItems: "start" }} className="linkedin-layout">
          
          {/* LEFT COLUMN: Input form & log history */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Input Form */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-indigo)" }}>Brand Builder</h3>
              <form onSubmit={handleGenerate}>
                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>Select Source Resume</label>
                  <select 
                    value={selectedResumeId} 
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", color: "white" }}
                  >
                    <option value="">-- Choose Resume --</option>
                    {resumes.map(r => (
                      <option key={r.id} value={r.id}>{r.filename}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={generating || !selectedResumeId}>
                  {generating ? "Rewriting Profile..." : "Optimize Profile Brand"}
                </button>
              </form>
            </div>

            {/* Past Logs */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Saved Profile Optimizations</h3>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>No brand logs saved yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveProfile(item)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        border: "1px solid " + (activeProfile?.id === item.id ? "var(--color-indigo)" : "var(--color-border)"),
                        backgroundColor: activeProfile?.id === item.id ? "rgba(99, 102, 241, 0.08)" : "transparent",
                        borderRadius: "0.375rem",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        transition: "all 0.2s"
                      }}
                    >
                      👔 <b>Brand Package: Resume {item.resumeId.slice(-6)}</b>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        Optimized: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Output display */}
          <div style={{ flex: 1 }}>
            {generating && (
              <div className="glass-card" style={{ padding: "5rem 2rem", textAlign: "center" }}>
                <div className="spinner" style={{ 
                  width: "48px", 
                  height: "48px", 
                  border: "3px solid transparent", 
                  borderTopColor: "var(--color-indigo)", 
                  borderRadius: "50%", 
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite" 
                }}></div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Optimizing LinkedIn Profile sections</h3>
                <p style={{ color: "var(--color-text-secondary)" }}>Gemini AI is parsing details, formatting story-driven summaries, and listing top recommended keywords...</p>
              </div>
            )}

            {activeProfile && !generating && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* 1. Headline Options */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-indigo)" }}>Keyword-Rich Headlines</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {activeProfile.headline?.map((opt, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: "1rem", 
                          border: "1px solid var(--color-border)", 
                          borderRadius: "0.375rem", 
                          backgroundColor: "rgba(0, 0, 0, 0.15)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "1rem"
                        }}
                      >
                        <p style={{ fontSize: "0.875rem", color: "white" }}>&quot;{opt}&quot;</p>
                        <button onClick={() => copyText(opt)} className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Story-driven About Section */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-indigo)" }}>About / Summary Section</h3>
                    <button onClick={() => copyText(activeProfile.about)} className="btn btn-sm btn-secondary">
                      📋 Copy About
                    </button>
                  </div>
                  <div style={{ 
                    whiteSpace: "pre-wrap", 
                    fontSize: "0.875rem", 
                    color: "var(--color-text-secondary)", 
                    lineHeight: "1.6",
                    padding: "1rem",
                    backgroundColor: "rgba(0,0,0,0.15)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.375rem"
                  }}>
                    {activeProfile.about}
                  </div>
                </div>

                {/* 3. Experience templates */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--color-indigo)" }}>Role Templates</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {activeProfile.experience?.map((exp, idx) => (
                      <div key={idx} style={{ border: "1px solid var(--color-border)", borderRadius: "0.5rem", padding: "1.25rem", backgroundColor: "rgba(0,0,0,0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                          <h4 style={{ fontWeight: 600, fontSize: "0.9375rem" }}>💼 {exp.role} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>at {exp.company}</span></h4>
                          <button onClick={() => copyText(`${exp.role} at ${exp.company}:\n` + exp.bullets.map(b => `• ${b}`).join("\n"))} className="btn btn-sm btn-secondary" style={{ transform: "scale(0.9)" }}>
                            Copy Role
                          </button>
                        </div>
                        <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {exp.bullets?.map((b, bIdx) => <li key={bIdx}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Recommended Skills */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-indigo)" }}>Recommended Skill Keywords</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {activeProfile.skills?.map((skill, idx) => (
                      <span 
                        key={idx}
                        style={{ 
                          fontSize: "0.75rem", 
                          backgroundColor: "rgba(99, 102, 241, 0.15)", 
                          color: "var(--color-indigo)", 
                          padding: "0.35rem 0.75rem", 
                          borderRadius: "1rem",
                          border: "1px solid rgba(99, 102, 241, 0.3)"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {!activeProfile && !generating && (
              <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)" }}>Select a resume on the left to write optimized LinkedIn brand details.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default LinkedInOptimizer;
