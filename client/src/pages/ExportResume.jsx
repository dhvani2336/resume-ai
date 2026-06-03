import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function ExportResume() {
  // Resume Datasets States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [links, setLinks] = useState("");
  const [skillsText, setSkillsText] = useState("");

  // Work Experience Items
  const [experience, setExperience] = useState([]);

  // Projects Items
  const [projects, setProjects] = useState([]);

  // Education Items
  const [education, setEducation] = useState([]);

  // Exporter configs
  const [template, setTemplate] = useState("ats"); // 'ats' | 'modern' | 'minimal'
  const [exportHistory, setExportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // { text, type: 'success'|'error' }

  const navigate = useNavigate();

  useEffect(() => {
    // Auto-populate from logged-in user data
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name) setName(parsedUser.name);
        if (parsedUser.email) setEmail(parsedUser.email);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
    fetchExportHistory();
  }, [navigate]);

  const fetchExportHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/export/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setExportHistory(data.exports || []);
      }
    } catch (err) {
      console.error("Error loading export logs:", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Experiences List modifiers
  const handleAddExperience = () => {
    setExperience([...experience, { role: "", company: "", duration: "", description: "" }]);
  };
  const handleRemoveExperience = (idx) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };
  const handleUpdateExperience = (idx, field, val) => {
    const updated = experience.map((exp, i) => {
      if (i === idx) return { ...exp, [field]: val };
      return exp;
    });
    setExperience(updated);
  };

  // Projects List modifiers
  const handleAddProject = () => {
    setProjects([...projects, { title: "", technologies: [], description: "" }]);
  };
  const handleRemoveProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };
  const handleUpdateProject = (idx, field, val) => {
    const updated = projects.map((proj, i) => {
      if (i === idx) {
        if (field === "technologies") {
          return { ...proj, technologies: val.split(",").map(t => t.trim()) };
        }
        return { ...proj, [field]: val };
      }
      return proj;
    });
    setProjects(updated);
  };

  // Education List modifiers
  const handleAddEducation = () => {
    setEducation([...education, { degree: "", school: "", year: "" }]);
  };
  const handleRemoveEducation = (idx) => {
    setEducation(education.filter((_, i) => i !== idx));
  };
  const handleUpdateEducation = (idx, field, val) => {
    const updated = education.map((edu, i) => {
      if (i === idx) return { ...edu, [field]: val };
      return edu;
    });
    setEducation(updated);
  };

  // Export Request
  const handleExport = async (type) => {
    setIsExporting(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    const skillsArray = skillsText.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      template,
      resumeData: {
        name,
        email,
        phone,
        location,
        links,
        skills: skillsArray,
        experience,
        projects,
        education
      }
    };

    try {
      const response = await fetch(`${API_BASE}/api/export/${type}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to export ${type.toUpperCase()}`);
      }

      // Download file blob
      const blob = await response.blob();
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `resume_${name.toLowerCase().replace(/\s+/g, '_')}_${template}.${type}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setMessage({ text: `Successfully generated and downloaded ${type.toUpperCase()} resume!`, type: "success" });
      await fetchExportHistory();
    } catch (err) {
      console.error("Export failure:", err);
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsExporting(false);
    }
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
              <div className="skeleton skeleton-text" style={{ width: "12rem", height: "1.5rem", marginBottom: "1.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "12rem", borderRadius: "0.5rem" }}></div>
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-emerald)" }}></div>
          <span>Document Exporter Workspace</span>
        </div>
        <div className="db-user-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="dashboard-grid container" style={{ gridTemplateColumns: "1fr 2.5fr" }}>
        
        {/* Left Column: Settings and Export History */}
        <div className="dashboard-left" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Section: Template Selection */}
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 className="card-section-title" style={{ marginBottom: "0.75rem" }}>Select Template</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div 
                onClick={() => setTemplate("ats")}
                className={`template-select-card ${template === "ats" ? "active" : ""}`}
                style={{ padding: "0.75rem", borderRadius: "6px", border: template === "ats" ? "2px solid var(--color-emerald)" : "1px solid var(--color-border)", backgroundColor: template === "ats" ? "rgba(16, 185, 129, 0.05)" : "var(--color-bg-inset)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.15rem", textAlign: "left" }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>ATS Friendly</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Black & white centered list, optimized for automated screening.</span>
              </div>

              <div 
                onClick={() => setTemplate("modern")}
                className={`template-select-card ${template === "modern" ? "active" : ""}`}
                style={{ padding: "0.75rem", borderRadius: "6px", border: template === "modern" ? "2px solid var(--color-emerald)" : "1px solid var(--color-border)", backgroundColor: template === "modern" ? "rgba(16, 185, 129, 0.05)" : "var(--color-bg-inset)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.15rem", textAlign: "left" }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Modern Professional</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Stylish header underlines, elegant colored header accents.</span>
              </div>

              <div 
                onClick={() => setTemplate("minimal")}
                className={`template-select-card ${template === "minimal" ? "active" : ""}`}
                style={{ padding: "0.75rem", borderRadius: "6px", border: template === "minimal" ? "2px solid var(--color-emerald)" : "1px solid var(--color-border)", backgroundColor: template === "minimal" ? "rgba(16, 185, 129, 0.05)" : "var(--color-bg-inset)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.15rem", textAlign: "left" }}
              >
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>Minimal Clean</span>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Sleek whitespace spacing, light dividers, neat layout.</span>
              </div>
            </div>
          </div>

          {/* Section: Action Buttons */}
          <div className="glass-card" style={{ padding: "1.25rem" }}>
            <h3 className="card-section-title" style={{ marginBottom: "0.75rem" }}>Export Document</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <button 
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="btn btn-primary"
                style={{ width: "100%", padding: "0.625rem", fontSize: "0.8125rem", backgroundColor: "var(--color-emerald)", borderColor: "var(--color-emerald)", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <svg style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
              <button 
                onClick={() => handleExport("docx")}
                disabled={isExporting}
                className="btn btn-secondary"
                style={{ width: "100%", padding: "0.625rem", fontSize: "0.8125rem", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
              >
                <svg style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download DOCX
              </button>
            </div>
            {isExporting && (
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center", marginTop: "0.75rem" }}>
                <div className="spinner" style={{ width: "0.875rem", height: "0.875rem" }}></div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Compiling files...</span>
              </div>
            )}
          </div>

          {/* Section: Export History list */}
          <div className="glass-card" style={{ padding: "1.25rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <h3 className="card-section-title">Export Log</h3>
            {exportHistory.length === 0 ? (
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", margin: "auto 0" }}>No downloads logged yet.</p>
            ) : (
              <div className="db-history-list" style={{ overflowY: "auto", flexGrow: 1, maxHeight: "15rem" }}>
                {exportHistory.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem", borderBottom: "1px solid var(--color-border)", fontSize: "0.6875rem", textAlign: "left" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ color: "var(--color-text-primary)", fontWeight: 600, wordBreak: "break-all" }}>{item.fileName}</span>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.5625rem" }}>Template: {item.templateName.toUpperCase()}</span>
                    </div>
                    <span style={{ color: "var(--color-emerald)", fontWeight: 700 }}>.{item.exportType.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Profile Content Editor Form */}
        <div className="dashboard-right">
          <div className="glass-card" style={{ padding: "2rem" }}>
            
            <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>Resume Profile Editor</h3>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Populate with your AI-improved content</span>
            </div>

            {message.text && (
              <div style={{ 
                backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)", 
                border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"}`, 
                borderRadius: "6px", 
                padding: "0.75rem", 
                marginBottom: "1.5rem", 
                color: message.type === "success" ? "var(--color-emerald)" : "var(--color-rose)", 
                fontSize: "0.8125rem", 
                fontWeight: 600,
                textAlign: "left"
              }}>
                {message.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "left" }}>
              
              {/* Personal Info Group */}
              <div className="form-section">
                <h4 style={{ fontSize: "0.875rem", color: "var(--color-emerald)", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>Personal Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.25rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.25rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Phone Number</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.25rem" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Location (City, State)</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.25rem" }} />
                  </div>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Portfolio / Social Links</label>
                  <input type="text" value={links} onChange={(e) => setLinks(e.target.value)} placeholder="LinkedIn, GitHub, Portfolio URL" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.25rem" }} />
                </div>
              </div>

              {/* Skills section */}
              <div className="form-section">
                <h4 style={{ fontSize: "0.875rem", color: "var(--color-emerald)", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>Technical Skills</h4>
                <textarea rows={2} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, Node.js, MongoDB, JavaScript" style={{ width: "100%", padding: "0.5rem", fontSize: "0.8125rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", resize: "vertical", fontFamily: "inherit" }} />
              </div>

              {/* Work Experience section */}
              <div className="form-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.875rem", color: "var(--color-emerald)", margin: 0 }}>Work Experience</h4>
                  <button type="button" onClick={handleAddExperience} className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}>+ Add</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {experience.map((exp, idx) => (
                    <div key={idx} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-inset)", position: "relative" }}>
                      <button type="button" onClick={() => handleRemoveExperience(idx)} style={{ position: "absolute", right: "0.5rem", top: "0.5rem", background: "transparent", border: "none", color: "var(--color-rose)", cursor: "pointer", fontWeight: 700 }}>✕</button>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Job Title / Role</label>
                          <input type="text" value={exp.role} onChange={(e) => handleUpdateExperience(idx, "role", e.target.value)} placeholder="e.g. Senior Software Engineer" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Company Name</label>
                          <input type="text" value={exp.company} onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)} placeholder="e.g. Google" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Duration / Dates</label>
                          <input type="text" value={exp.duration} onChange={(e) => handleUpdateExperience(idx, "duration", e.target.value)} placeholder="e.g. Jan 2023 - Present" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Description (Paste your AI-rewritten bullets here!)</label>
                        <textarea rows={4} value={exp.description} onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)} placeholder="e.g. • Engineered microservices&#10;• Led frontend refactoring" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", resize: "vertical", marginTop: "0.15rem", fontFamily: "inherit" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects section */}
              <div className="form-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.875rem", color: "var(--color-emerald)", margin: 0 }}>Projects & Initiatives</h4>
                  <button type="button" onClick={handleAddProject} className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}>+ Add</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {projects.map((proj, idx) => (
                    <div key={idx} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-inset)", position: "relative" }}>
                      <button type="button" onClick={() => handleRemoveProject(idx)} style={{ position: "absolute", right: "0.5rem", top: "0.5rem", background: "transparent", border: "none", color: "var(--color-rose)", cursor: "pointer", fontWeight: 700 }}>✕</button>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Project Title</label>
                          <input type="text" value={proj.title} onChange={(e) => handleUpdateProject(idx, "title", e.target.value)} placeholder="e.g. AI Resume Scanner" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Technologies (Comma separated)</label>
                          <input type="text" value={proj.technologies ? proj.technologies.join(", ") : ""} onChange={(e) => handleUpdateProject(idx, "technologies", e.target.value)} placeholder="e.g. React, Gemini, Node.js" style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>Project Description</label>
                        <textarea rows={3} value={proj.description} onChange={(e) => handleUpdateProject(idx, "description", e.target.value)} placeholder="e.g. Designed a glassmorphic MERN portal evaluating resume text..." style={{ width: "100%", padding: "0.375rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", resize: "vertical", marginTop: "0.15rem", fontFamily: "inherit" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education section */}
              <div className="form-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.25rem", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.875rem", color: "var(--color-emerald)", margin: 0 }}>Education</h4>
                  <button type="button" onClick={handleAddEducation} className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}>+ Add</button>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {education.map((edu, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 0.8fr auto", gap: "0.5rem", alignItems: "end", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg-inset)" }}>
                      <div>
                        <label style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Degree / Course</label>
                        <input type="text" value={edu.degree} onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)} placeholder="e.g. B.S. in Computer Science" style={{ width: "100%", padding: "0.25rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>School / University</label>
                        <input type="text" value={edu.school} onChange={(e) => handleUpdateEducation(idx, "school", e.target.value)} placeholder="e.g. Stanford University" style={{ width: "100%", padding: "0.25rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Year / Dates</label>
                        <input type="text" value={edu.year} onChange={(e) => handleUpdateEducation(idx, "year", e.target.value)} placeholder="e.g. 2018 - 2022" style={{ width: "100%", padding: "0.25rem", fontSize: "0.75rem", borderRadius: "4px", border: "1px solid var(--color-input-border, var(--color-border))", backgroundColor: "var(--color-input-bg)", color: "var(--color-text-primary)", marginTop: "0.15rem" }} />
                      </div>
                      <button type="button" onClick={() => handleRemoveEducation(idx)} style={{ padding: "0.25rem 0.5rem", color: "var(--color-rose)", background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ExportResume;
