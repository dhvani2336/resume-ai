import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function PortfolioGenerator() {
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Inputs
  const [selectedResumeId, setSelectedResumeId] = useState("");

  // Outputs
  const [activePortfolio, setActivePortfolio] = useState(null);
  
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'code'

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

      // 2. Fetch history
      const historyResponse = await fetch(`${API_BASE}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyResponse.json();
      if (!historyResponse.ok) throw new Error(historyData.error || "Failed to load portfolio logs.");
      setHistory(historyData.portfolios || []);

      if (historyData.portfolios.length > 0) {
        setActivePortfolio(historyData.portfolios[0]);
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
    setActivePortfolio(null);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeId: selectedResumeId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate website.");

      setActivePortfolio(data.portfolio);
      setHistory(prev => [data.portfolio, ...prev]);
      setMessage({ text: "Portfolio website generated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!activePortfolio) return;
    navigator.clipboard.writeText(activePortfolio.htmlContent);
    setMessage({ text: "HTML source code copied to clipboard!", type: "success" });
  };

  const downloadHtmlFile = () => {
    if (!activePortfolio) return;
    const element = document.createElement("a");
    const file = new Blob([activePortfolio.htmlContent], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = "portfolio_website.html";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-cyan)" }}></div>
          <span>AI Portfolio Generator</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2.5fr", gap: "2rem", alignItems: "start" }} className="portfolio-layout">
          
          {/* LEFT COLUMN: Input form & History log */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Input Form */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-cyan)" }}>Portfolio Designer</h3>
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
                  {generating ? "Coding Website..." : "Generate Portfolio Code"}
                </button>
              </form>
            </div>

            {/* History logs */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Saved Portfolio Websites</h3>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>No portfolios coded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePortfolio(item);
                        setActiveTab("preview");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        border: "1px solid " + (activePortfolio?.id === item.id ? "var(--color-cyan)" : "var(--color-border)"),
                        backgroundColor: activePortfolio?.id === item.id ? "rgba(14, 165, 233, 0.08)" : "transparent",
                        borderRadius: "0.375rem",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        transition: "all 0.2s"
                      }}
                    >
                      🌐 <b>Website: Resume {item.resumeId.slice(-6)}</b>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        Coded: {new Date(item.createdAt).toLocaleDateString()}
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
                  borderTopColor: "var(--color-cyan)", 
                  borderRadius: "50%", 
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite" 
                }}></div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Coding Responsive Website</h3>
                <p style={{ color: "var(--color-text-secondary)" }}>Gemini AI is parsing details, creating structured grids, injecting custom CSS templates, and scripting tags...</p>
              </div>
            )}

            {activePortfolio && !generating && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="animate-fade-in">
                {/* Tabs selection */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      onClick={() => setActiveTab("preview")}
                      className={`btn btn-sm ${activeTab === "preview" ? "btn-primary" : "btn-secondary"}`}
                    >
                      🖥 Live Preview
                    </button>
                    <button 
                      onClick={() => setActiveTab("code")}
                      className={`btn btn-sm ${activeTab === "code" ? "btn-primary" : "btn-secondary"}`}
                    >
                      {`</> Source Code`}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={copyCode} className="btn btn-sm btn-secondary">
                      📋 Copy
                    </button>
                    <button onClick={downloadHtmlFile} className="btn btn-sm btn-primary">
                      ⬇ Download HTML
                    </button>
                  </div>
                </div>

                {/* Tab Content 1: Live preview frame */}
                {activeTab === "preview" && (
                  <div className="glass-card" style={{ padding: "0.5rem", height: "550px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    <iframe 
                      title="Portfolio Preview"
                      srcDoc={activePortfolio.htmlContent}
                      sandbox="allow-scripts"
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        border: "none", 
                        borderRadius: "0.375rem",
                        backgroundColor: "#111" 
                      }}
                    />
                  </div>
                )}

                {/* Tab Content 2: Source Code */}
                {activeTab === "code" && (
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <textarea
                      readOnly
                      rows="25"
                      value={activePortfolio.htmlContent}
                      style={{
                        width: "100%",
                        fontFamily: "monospace",
                        fontSize: "0.8125rem",
                        backgroundColor: "rgba(0,0,0,0.3)",
                        color: "var(--color-text-secondary)",
                        padding: "1rem",
                        borderRadius: "0.375rem",
                        border: "1px solid var(--color-border)",
                        resize: "none"
                      }}
                    />
                  </div>
                )}

              </div>
            )}

            {!activePortfolio && !generating && (
              <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)" }}>Select a resume on the left to code a customized professional webpage.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default PortfolioGenerator;
