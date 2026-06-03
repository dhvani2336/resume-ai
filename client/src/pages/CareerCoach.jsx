import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function CareerCoach() {
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Form input states
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("1-3 Years");

  // Output states
  const [activeCoachRecord, setActiveCoachRecord] = useState(null);
  
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
      // 1. Fetch Resumes
      const resumeResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resumeData = await resumeResponse.json();
      if (!resumeResponse.ok) throw new Error(resumeData.error || "Failed to load resumes.");
      setResumes(resumeData.resumes || []);
      if (resumeData.resumes.length > 0) {
        setSelectedResumeId(resumeData.resumes[0].id);
      }

      // 2. Fetch Coach History
      const historyResponse = await fetch(`${API_BASE}/api/coach/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyResponse.json();
      if (!historyResponse.ok) throw new Error(historyData.error || "Failed to load coach history.");
      setHistory(historyData.history || []);
      
      if (historyData.history.length > 0) {
        setActiveCoachRecord(historyData.history[0]);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !targetRole || !experienceLevel) return;

    setGenerating(true);
    setActiveCoachRecord(null);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/coach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          targetRole,
          experienceLevel
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate career roadmap.");

      setActiveCoachRecord(data.coach);
      setHistory(prev => [data.coach, ...prev]);
      setMessage({ text: "AI Career Roadmap generated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const selectHistoryItem = (record) => {
    setActiveCoachRecord(record);
    setTargetRole(record.targetRole);
    setExperienceLevel(record.experienceLevel);
    setExpandedMilestoneIdx(0);
    setMessage({ text: "", type: "" });
  };

  const [expandedMilestoneIdx, setExpandedMilestoneIdx] = useState(0);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-purple)" }}></div>
          <span>AI Career Coach</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2.5fr", gap: "2rem", alignItems: "start" }} className="coach-grid-layout">
          
          {/* LEFT COLUMN: Setup Form & History list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Input Form */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-purple)" }}>Roadmap Designer</h3>
              <form onSubmit={handleGenerateRoadmap}>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label>Select Resume</label>
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

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="target-role">Target Job Role</label>
                  <input 
                    type="text" 
                    id="target-role"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label>Target Seniority Level</label>
                  <select 
                    value={experienceLevel} 
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", color: "white" }}
                  >
                    <option value="Fresher">Fresher (Entry Level)</option>
                    <option value="1-3 Years">Junior (1-3 Years)</option>
                    <option value="3-5 Years">Mid-Senior (3-5 Years)</option>
                    <option value="5+ Years">Senior (5+ Years)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={generating || !selectedResumeId}>
                  {generating ? "Mapping Roadmap..." : "Generate Career Roadmap"}
                </button>
              </form>
            </div>

            {/* Coach History */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Saved Roadmaps</h3>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>No roadmaps saved yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectHistoryItem(item)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        border: "1px solid " + (activeCoachRecord?.id === item.id ? "var(--color-purple)" : "var(--color-border)"),
                        backgroundColor: activeCoachRecord?.id === item.id ? "rgba(168, 85, 247, 0.08)" : "transparent",
                        borderRadius: "0.375rem",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        transition: "all 0.2s"
                      }}
                    >
                      🎯 <b>{item.targetRole}</b>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        Level: {item.experienceLevel} • {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Roadmap display */}
          <div style={{ flex: 1 }}>
            {generating && (
              <div className="glass-card" style={{ padding: "5rem 2rem", textAlign: "center" }}>
                <div className="spinner" style={{ 
                  width: "48px", 
                  height: "48px", 
                  border: "3px solid transparent", 
                  borderTopColor: "var(--color-purple)", 
                  borderRadius: "50%", 
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite" 
                }}></div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>AI Executive Coach Mapping</h3>
                <p style={{ color: "var(--color-text-secondary)" }}>Gemini AI is designing milestones, aggregating recommended certifications, and building skills checksheets...</p>
              </div>
            )}

            {activeCoachRecord && !generating && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                
                {/* 1. Roadmap Timeline Card */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--color-purple)" }}>Career Transition Roadmap</h3>
                  
                  {/* Timeline milestone markers */}
                  <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem", overflowX: "auto" }}>
                    {activeCoachRecord.roadmap?.map((phase, idx) => (
                      <button
                        key={idx}
                        onClick={() => setExpandedMilestoneIdx(idx)}
                        style={{
                          padding: "0.75rem 1.25rem",
                          border: "none",
                          borderBottom: expandedMilestoneIdx === idx ? "2px solid var(--color-purple)" : "2px solid transparent",
                          backgroundColor: "transparent",
                          color: expandedMilestoneIdx === idx ? "var(--color-purple)" : "var(--color-text-secondary)",
                          fontWeight: expandedMilestoneIdx === idx ? 600 : 400,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          fontSize: "0.875rem"
                        }}
                      >
                        Phase {idx + 1}: {phase.timeframe}
                      </button>
                    ))}
                  </div>

                  {/* Selected Milestone Tasks details */}
                  {activeCoachRecord.roadmap?.[expandedMilestoneIdx] && (
                    <div className="animate-fade-in" style={{ backgroundColor: "rgba(17, 24, 39, 0.4)", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)" }}>
                      <h4 style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.75rem" }}>
                        🎯 Milestone Focus: {activeCoachRecord.roadmap[expandedMilestoneIdx].milestone}
                      </h4>
                      <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", tracking: "0.05em", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>Required Actions:</h5>
                      <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                        {activeCoachRecord.roadmap[expandedMilestoneIdx].tasks?.map((task, tidx) => (
                          <li key={tidx} style={{ color: "var(--color-text-secondary)" }}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. Skills Checklist Card */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--color-cyan)" }}>Skills Checksheet</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    
                    {/* Technical Skills */}
                    <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem" }}>
                      <h4 style={{ fontWeight: 600, color: "var(--color-cyan)", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>Technical & Hard Skills</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {activeCoachRecord.skills?.technical?.map((skill, sidx) => (
                          <label key={sidx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                            <input type="checkbox" style={{ accentColor: "var(--color-cyan)" }} />
                            <span>{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem" }}>
                      <h4 style={{ fontWeight: 600, color: "var(--color-purple)", marginBottom: "0.75rem", fontSize: "0.9375rem" }}>Soft & Executive Skills</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {activeCoachRecord.skills?.soft?.map((skill, sidx) => (
                          <label key={sidx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                            <input type="checkbox" style={{ accentColor: "var(--color-purple)" }} />
                            <span>{skill}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 3. Learning recommendations card */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--color-emerald)" }}>Recommended Certifications & Learning</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {activeCoachRecord.learningSuggestions?.map((item, idx) => (
                      <div key={idx} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", backgroundColor: "rgba(16, 185, 129, 0.02)" }}>
                        <h4 style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>📚 {item.topic}</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {item.resources?.map((res, rIdx) => (
                            <span 
                              key={rIdx} 
                              style={{ 
                                fontSize: "0.75rem", 
                                backgroundColor: "rgba(255,255,255,0.06)", 
                                color: "var(--color-text-secondary)", 
                                padding: "0.25rem 0.5rem", 
                                borderRadius: "0.25rem",
                                border: "1px solid var(--color-border)"
                              }}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {!activeCoachRecord && !generating && (
              <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)" }}>Configure details on the left to design a customized AI Career roadmap.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default CareerCoach;
