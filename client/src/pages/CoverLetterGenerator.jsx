import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function CoverLetterGenerator() {
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Input fields
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Outputs
  const [activeLetter, setActiveLetter] = useState(null);

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
      if (!resResponse.ok) throw new Error(resData.error || "Failed to retrieve resumes.");
      setResumes(resData.resumes || []);
      if (resData.resumes.length > 0) {
        setSelectedResumeId(resData.resumes[0].id);
      }

      // 2. Fetch history
      const historyResponse = await fetch(`${API_BASE}/api/cover-letter`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyResponse.json();
      if (!historyResponse.ok) throw new Error(historyData.error || "Failed to load cover letter history.");
      setHistory(historyData.letters || []);
      
      if (historyData.letters.length > 0) {
        setActiveLetter(historyData.letters[0]);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !jobTitle || !company) return;

    setGenerating(true);
    setActiveLetter(null);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/cover-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          jobTitle,
          company,
          jobDescription
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate cover letter.");

      setActiveLetter(data.letter);
      setHistory(prev => [data.letter, ...prev]);
      setMessage({ text: "Cover letter generated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!activeLetter) return;
    navigator.clipboard.writeText(activeLetter.content);
    setMessage({ text: "Copied to clipboard!", type: "success" });
  };

  const downloadTextFile = () => {
    if (!activeLetter) return;
    const element = document.createElement("a");
    const file = new Blob([activeLetter.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `CoverLetter_${company.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
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
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-emerald)" }}></div>
          <span>AI Cover Letter Generator</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "1.25fr 2fr", gap: "2rem", alignItems: "start" }} className="cover-letter-layout">
          
          {/* LEFT COLUMN: Input form & History log */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Input Form */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-emerald)" }}>Letter Composer</h3>
              <form onSubmit={handleGenerate}>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label>Select Base Resume</label>
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
                  <label htmlFor="job-title">Job Title</label>
                  <input 
                    type="text" 
                    id="job-title"
                    placeholder="e.g. Staff Security Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="company">Target Company</label>
                  <input 
                    type="text" 
                    id="company"
                    placeholder="e.g. Google, Stripe"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="jd">Job Description (Optional)</label>
                  <textarea 
                    id="jd"
                    rows="4" 
                    placeholder="Paste the Job Description bullet requirements to optimize matching keywords..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={generating || !selectedResumeId}>
                  {generating ? "Composing with AI..." : "Generate Cover Letter"}
                </button>
              </form>
            </div>

            {/* Cover Letters History */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Saved Letters</h3>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>No letters composed yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveLetter(item);
                        setJobTitle(item.jobTitle);
                        setCompany(item.company);
                        setJobDescription(item.jobDescription || "");
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        textAlign: "left",
                        border: "1px solid " + (activeLetter?.id === item.id ? "var(--color-emerald)" : "var(--color-border)"),
                        backgroundColor: activeLetter?.id === item.id ? "rgba(16, 185, 129, 0.08)" : "transparent",
                        borderRadius: "0.375rem",
                        color: "white",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        transition: "all 0.2s"
                      }}
                    >
                      📝 <b>{item.jobTitle} at {item.company}</b>
                      <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                        {new Date(item.createdAt).toLocaleDateString()}
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
                  borderTopColor: "var(--color-emerald)", 
                  borderRadius: "50%", 
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite" 
                }}></div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Composing Tailored Cover Letter</h3>
                <p style={{ color: "var(--color-text-secondary)" }}>Gemini AI is matching your resume achievements to the job title and drafting a formatted cover letter...</p>
              </div>
            )}

            {activeLetter && !generating && (
              <div className="glass-card animate-fade-in" style={{ padding: "2.5rem 2rem", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white" }}>
                      Tailored Letter: {activeLetter.jobTitle}
                    </h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                      Target: {activeLetter.company}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={copyToClipboard} className="btn btn-sm btn-secondary">
                      📋 Copy Text
                    </button>
                    <button onClick={downloadTextFile} className="btn btn-sm btn-primary">
                      ⬇ Download (.txt)
                    </button>
                  </div>
                </div>

                <div style={{ 
                  whiteSpace: "pre-wrap", 
                  fontFamily: "monospace", 
                  fontSize: "0.875rem", 
                  color: "var(--color-text-primary)", 
                  lineHeight: "1.6",
                  maxHeight: "500px",
                  overflowY: "auto",
                  padding: "1rem",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--color-border)"
                }}>
                  {activeLetter.content}
                </div>
              </div>
            )}

            {!activeLetter && !generating && (
              <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                <p style={{ color: "var(--color-text-muted)" }}>Fill in details on the left to write a customized cover letter.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default CoverLetterGenerator;
