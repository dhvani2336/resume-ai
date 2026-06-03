import React, { useState, useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardLayout from "./components/DashboardLayout";
import { API_BASE } from "./utils/api.js";
import "./App.css";

// Lazy load pages for performance optimization
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const JobMatch = lazy(() => import("./pages/JobMatch"));
const ResumeRewriter = lazy(() => import("./pages/ResumeRewriter"));
const ExportResume = lazy(() => import("./pages/ExportResume"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const InterviewPrep = lazy(() => import("./pages/InterviewPrep"));

// Enterprise pages
const Profile = lazy(() => import("./pages/Profile"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const TeamWorkspace = lazy(() => import("./pages/TeamWorkspace"));
const ResumeVersions = lazy(() => import("./pages/ResumeVersions"));
const CareerCoach = lazy(() => import("./pages/CareerCoach"));
const CoverLetterGenerator = lazy(() => import("./pages/CoverLetterGenerator"));
const LinkedInOptimizer = lazy(() => import("./pages/LinkedInOptimizer"));
const PortfolioGenerator = lazy(() => import("./pages/PortfolioGenerator"));
const PublicReportView = lazy(() => import("./pages/PublicReportView"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

const PageLoader = () => (
  <div className="dashboard-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
    <div className="spinner" style={{
      width: "48px",
      height: "48px",
      border: "3px solid transparent",
      borderTopColor: "var(--color-cyan)",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }}></div>
  </div>
);

function MainLayout({ children, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Redirect legacy hash-based URLs (like #/login) to clean paths (like /login)
  useEffect(() => {
    if (location.hash && location.hash.startsWith('#/')) {
      const cleanPath = location.hash.substring(2); // remove '#/'
      navigate('/' + cleanPath, { replace: true });
    }
  }, [location.hash, navigate]);

  // Re-read user profile from localStorage on navigation events
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user profile", e);
      }
    } else {
      setUser(null);
    }
  }, [location]);

  // Dynamic SEO Metadata
  useEffect(() => {
    let title = "ResumeAI - ATS Optimizer & AI Interview Prep";
    let description = "Optimize your resume with ATS scoring, job description alignment, AI bullet rewrites, professional exports, and customized interview preparation.";

    switch (location.pathname) {
      case "/":
        title = "ResumeAI - AI Resume ATS Score Optimizer";
        description = "Check your resume ATS score, optimize bullets with Gemini AI, align with job descriptions, and prepare for interviews.";
        break;
      case "/login":
        title = "Login | ResumeAI";
        description = "Log in to your ResumeAI account to manage your resumes and view ATS analysis logs.";
        break;
      case "/register":
        title = "Sign Up | ResumeAI";
        description = "Create a free ResumeAI account to scan resumes, track ATS scores, and practice mock interviews.";
        break;
      case "/dashboard":
        title = "Dashboard | ResumeAI";
        description = "Manage your uploaded resumes, view history logs, and access advanced ATS analysis insights.";
        break;
      case "/job-match":
        title = "Job Match Analyzer | ResumeAI";
        description = "Compare your resume against any job description to identify missing keywords and skills compatibility.";
        break;
      case "/rewrite":
        title = "AI Resume Rewriter | ResumeAI";
        description = "Optimize your resume experience bullets and achievements using professional, ATS-optimized suggestions by Gemini.";
        break;
      case "/export":
        title = "Export Resume | ResumeAI";
        description = "Download your AI-improved resume as a professional, ATS-compliant PDF or DOCX file.";
        break;
      case "/analytics":
        title = "Analytics Dashboard | ResumeAI";
        description = "Track your resume ATS score progression, usage statistics, and application activity trends.";
        break;
      case "/interview-prep":
        title = "AI Interview Preparation | ResumeAI";
        description = "Generate customized technical, behavioral, and HR questions based on your resume and target role.";
        break;
      default:
        break;
    }

    document.title = title;
    
    // Update or create meta description tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;
  }, [location.pathname]);

  const dashboardRoutes = [
    "/dashboard",
    "/job-match",
    "/rewrite",
    "/export",
    "/analytics",
    "/interview-prep",
    "/profile",
    "/settings",
    "/team-workspace",
    "/versions",
    "/career-coach",
    "/cover-letter",
    "/linkedin-optimizer",
    "/portfolio-generator",
    "/admin"
  ];

  const isDashboardRoute = dashboardRoutes.some(route => 
    location.pathname === route || location.pathname.startsWith(route + "/")
  );

  if (isDashboardRoute) {
    return (
      <DashboardLayout user={user} onLogout={onLogout}>
        {children}
      </DashboardLayout>
    );
  }

  return (
    <div className="app-wrapper">
      <Navbar user={user} onLogout={onLogout} />
      <main>{children}</main>
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <div className="footer-logo-dot"></div>
            <span>ResumeAI</span>
          </div>
          <p>&copy; {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="#" className="footer-link">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Landing Page Component containing original uploader UI
function LandingPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'uploading' | 'success'
  const [fileName, setFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [toasts, setToasts] = useState([]); // Toast notifications stack
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

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

    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please sign in to upload and analyze resumes.", "error");
      navigate("/login");
      return;
    }

    // Validate PDF format only
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPDF) {
      const errMsg = "Please upload a PDF file only.";
      setUploadError(errMsg);
      setResumeFile(null);
      setUploadState("idle");
      showToast(errMsg, "error");
      return;
    }

    setUploadError("");
    setResumeFile(file); // Store uploaded file in React state
    setFileName(file.name);
    setUploadState("uploading");

    try {
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
        showToast("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed. Please try again.");
      }

      setUploadState("success");
      setUploadedFilename(data.filename);
      showToast(`Successfully uploaded: ${data.originalname}`, "success");
    } catch (error) {
      console.error("File upload error:", error);
      setUploadError(error.message);
      setUploadState("idle");
      setResumeFile(null);
      showToast(error.message, "error");
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

  const resetUpload = () => {
    setUploadState("idle");
    setFileName("");
    setResumeFile(null);
    setUploadError("");
    setUploadedFilename("");
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const handleAnalyze = async () => {
    if (!uploadedFilename) return;
    setIsAnalyzing(true);
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please sign in to run AI analysis.", "error");
      navigate("/login");
      setIsAnalyzing(false);
      return;
    }
    
    // Set headers with token
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          filename: uploadedFilename,
          originalname: fileName,
          size: resumeFile ? resumeFile.size : 0
        }),
      });

      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed. Please try again.");
      }

      setAnalysisResult(data);
      showToast("Resume analysis complete!", "success");
    } catch (error) {
      console.error("Analysis error:", error);
      showToast(error.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      {/* HERO SECTION */}
      <section className="section-spacing animate-fade-in">
        <div className="container hero-grid">

          {/* Left Column: Copy & CTAs */}
          <div className="hero-left">
            <div className="badge animate-fade-in delay-1">
              <span className="badge-dot"></span>
              Now optimized for Gemini 2.5 Flash
            </div>

            <h1 className="hero-title animate-fade-in delay-1">
              Optimize your resume. <br />
              <span className="text-gradient">Pass the ATS scanner.</span>
            </h1>

            <p className="hero-desc animate-fade-in delay-2">
              Analyze your resume instantly against standard ATS formatting rules and industry keywords. Clear the automated filters and land more interviews.
            </p>

            <div className="hero-actions animate-fade-in delay-2">
              <a href="#upload" className="btn btn-lg btn-primary">
                Scan Resume (Free)
              </a>
              <Link to="/register" className="btn btn-lg btn-secondary">
                Get Started
              </Link>
            </div>
          </div>

          {/* Right Column: ATS Score Card */}
          <div className="hero-right animate-fade-in delay-2">
            <div className="glass-card">

              {/* Card Header */}
              <div className="card-header">
                <div>
                  <div className="card-title-sub">Scan Result</div>
                  <h3 className="card-title-main" style={{ wordBreak: "break-all" }}>
                    {analysisResult ? fileName : "resume_senior_dev.pdf"}
                  </h3>
                </div>
                <span 
                  className="status-badge" 
                  style={{ 
                    backgroundColor: analysisResult ? (analysisResult.atsScore >= 70 ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)") : "rgba(16, 185, 129, 0.1)",
                    borderColor: analysisResult ? (analysisResult.atsScore >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)") : "rgba(16, 185, 129, 0.2)",
                    color: analysisResult ? (analysisResult.atsScore >= 70 ? "var(--color-emerald)" : "var(--color-rose)") : "var(--color-emerald)"
                  }}
                >
                  {analysisResult ? (analysisResult.atsScore >= 70 ? "PASSED" : "WARNING") : "PASSED"}
                </span>
              </div>

              {/* Card Body: Progress Match Score */}
              <div className="card-score-row">
                <div className="progress-container">
                  <svg className="progress-svg">
                    <circle className="progress-circle-bg" r="32" cx="40" cy="40" />
                    <circle
                      className="progress-circle-fill"
                      r="32"
                      cx="40"
                      cy="40"
                      style={{
                        strokeDashoffset: analysisResult ? (201 - (201 * analysisResult.atsScore) / 100) : 30
                      }}
                    />
                  </svg>
                  <div className="progress-text">
                    {analysisResult ? `${analysisResult.atsScore}%` : "85%"}
                  </div>
                </div>

                <div className="card-score-info">
                  <div className="score-title">ATS Match Score</div>
                  <p className="score-desc">
                    {analysisResult 
                      ? `This file aligns with ${analysisResult.atsScore}% of target skills and keyword criteria.`
                      : "This file aligns with 85% of target skills and keyword criteria."
                    }
                  </p>
                </div>
              </div>

              {/* Card Details: Keywords */}
              <div className="card-keywords-section">
                <div>
                  <div className="keyword-group-title">Matched Keywords</div>
                  <div className="pills-container">
                    {analysisResult ? (
                      analysisResult.strengths.slice(0, 3).map((str, idx) => {
                        const cleaned = str.split(/[,\s-]/)[0].replace(/[^a-zA-Z]/g, '');
                        return (
                          <span key={idx} className="pill pill-success">
                            {cleaned.length > 12 ? cleaned.substring(0, 12) : (cleaned || "Strengths")}
                          </span>
                        );
                      })
                    ) : (
                      <>
                        <span className="pill pill-success">React</span>
                        <span className="pill pill-success">TypeScript</span>
                        <span className="pill pill-success">Node.js</span>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="keyword-group-title">Missing Keywords</div>
                  <div className="pills-container">
                    {analysisResult ? (
                      analysisResult.missingSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="pill pill-danger">
                          {skill.length > 12 ? skill.substring(0, 12) + "..." : skill}
                        </span>
                      ))
                    ) : (
                      <>
                        <span className="pill pill-danger">AWS</span>
                        <span className="pill pill-danger">Docker</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* DRAG & DROP UPLOAD SECTION */}
      <section id="upload" className="section-spacing animate-fade-in delay-2" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Upload your resume to begin</h2>
            <p className="section-desc">
              Drop your file to trigger an instant layout diagnostic, formatting check, and keyword review.
            </p>
          </div>

          <div
            className={`upload-box ${dragActive ? "dragging" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload-input"
              className="hidden-input"
              style={{ display: "none" }}
              accept=".pdf"
              onChange={handleFileSelect}
            />

            {uploadState === "idle" && (
              <>
                <div className="upload-icon">
                  <svg style={{ width: "1.75rem", height: "1.75rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="upload-title">Drag & drop your resume PDF here</h3>
                <p className="upload-desc">
                  Supports standard PDF format up to 5MB. Your data remains secure and private.
                </p>
                <label htmlFor="file-upload-input" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                  Browse Files
                </label>
                {uploadError && (
                  <p style={{ color: "var(--color-rose)", fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.5rem" }}>
                    {uploadError}
                  </p>
                )}
              </>
            )}

            {uploadState === "uploading" && (
              <>
                <div className="spinner"></div>
                <h3 className="upload-title">Analyzing {fileName}...</h3>
                <p className="upload-desc">
                  Parsing file layout, mapping structural headings, and evaluating matching keywords...
                </p>
              </>
            )}

            {uploadState === "success" && (
              <>
                {analysisResult ? (
                  <>
                    <div className="upload-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.15)", color: "var(--color-emerald)" }}>
                      <svg style={{ width: "1.75rem", height: "1.75rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="upload-title" style={{ color: "var(--color-emerald)" }}>Analysis Complete!</h3>
                    <p className="upload-desc">
                      Successfully analyzed <b>{fileName}</b>. See your score and detailed evaluation breakdown below.
                    </p>
                    <button className="btn btn-secondary btn-sm" onClick={resetUpload} style={{ marginTop: "0.5rem" }}>
                      Scan Another File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="upload-icon" style={{ backgroundColor: "rgba(14, 165, 233, 0.08)", borderColor: "rgba(14, 165, 233, 0.15)", color: "var(--color-cyan)" }}>
                      <svg style={{ width: "1.75rem", height: "1.75rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="upload-title" style={{ color: "var(--color-cyan)" }}>File Uploaded</h3>
                    <p className="upload-desc">
                      <b>{fileName}</b> {resumeFile && `(${(resumeFile.size / 1024 / 1024).toFixed(2)} MB)`} is ready for analysis.
                    </p>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleAnalyze} 
                      disabled={isAnalyzing}
                      style={{ marginTop: "0.5rem", gap: "0.5rem" }}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="spinner" style={{ display: "inline-block" }}></div>
                          Analyzing Resume...
                        </>
                      ) : "Run AI Resume Analysis"}
                    </button>
                    <button className="btn btn-text nav-link" style={{ fontWeight: 600, fontSize: "0.8125rem", marginTop: "0.25rem" }} onClick={resetUpload}>
                      Cancel & Choose New File
                    </button>
                  </>
                )}
              </>
            )}

          </div>
        </div>

        {/* AI Detailed Diagnosis Reports */}
        {analysisResult && (
          <div className="container animate-fade-in" style={{ marginTop: "4rem", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <div className="section-header" style={{ marginBottom: "0" }}>
              <h2 className="section-title">AI Detailed Diagnosis</h2>
              <p className="section-desc">Line-by-line structural review, keyword alignment auditing, and recruitment improvements.</p>
            </div>

            <div className="analysis-grid">
              
              {/* Strengths Card */}
              <div className="feature-card" style={{ borderLeft: "4px solid var(--color-emerald)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className="feature-icon-wrapper feature-icon-cyan" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.15)", color: "var(--color-emerald)", marginBottom: "0" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="feature-title" style={{ marginBottom: "0" }}>Key Strengths</h3>
                </div>
                <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {analysisResult.strengths.map((str, idx) => (
                    <li key={idx} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", display: "flex", gap: "0.5rem", lineHeight: "1.5" }}>
                      <span style={{ color: "var(--color-emerald)", fontWeight: "bold" }}>✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses Card */}
              <div className="feature-card" style={{ borderLeft: "4px solid var(--color-rose)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className="feature-icon-wrapper feature-icon-purple" style={{ backgroundColor: "rgba(244, 63, 94, 0.08)", borderColor: "rgba(244, 63, 94, 0.15)", color: "var(--color-rose)", marginBottom: "0" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="feature-title" style={{ marginBottom: "0" }}>Critical Gaps & Weaknesses</h3>
                </div>
                <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {analysisResult.weaknesses.map((weak, idx) => (
                    <li key={idx} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", display: "flex", gap: "0.5rem", lineHeight: "1.5" }}>
                      <span style={{ color: "var(--color-rose)", fontWeight: "bold" }}>⚠</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Skills Card */}
              <div className="feature-card" style={{ borderLeft: "4px solid var(--color-purple)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className="feature-icon-wrapper feature-icon-indigo" style={{ backgroundColor: "rgba(168, 85, 247, 0.08)", borderColor: "rgba(168, 85, 247, 0.15)", color: "var(--color-purple)", marginBottom: "0" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 20l4-16m2 16l4-16" />
                    </svg>
                  </div>
                  <h3 className="feature-title" style={{ marginBottom: "0" }}>Missing Keywords & Skills</h3>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "1rem", lineHeight: "1.4" }}>
                  Applicant tracking systems look for these exact keywords in candidate profiles. Consider adding these terms:
                </p>
                <div className="pills-container">
                  {analysisResult.missingSkills.map((skill, idx) => (
                    <span key={idx} className="pill pill-danger" style={{ textTransform: "none", fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actionable Suggestions Card */}
              <div className="feature-card" style={{ borderLeft: "4px solid var(--color-cyan)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className="feature-icon-wrapper feature-icon-cyan" style={{ backgroundColor: "rgba(14, 165, 233, 0.08)", borderColor: "rgba(14, 165, 233, 0.15)", color: "var(--color-cyan)", marginBottom: "0" }}>
                    <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="feature-title" style={{ marginBottom: "0" }}>Actionable Recruiter Suggestions</h3>
                </div>
                <ul style={{ listStyle: "none", paddingLeft: "0", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {analysisResult.suggestions.map((sug, idx) => (
                    <li key={idx} style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", display: "flex", gap: "0.5rem", lineHeight: "1.5" }}>
                      <span style={{ color: "var(--color-cyan)", fontWeight: "bold" }}>→</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* FEATURES SECTION (3 Cards) */}
      <section id="features" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Engineered to bypass ATS filters</h2>
            <p className="section-desc">
              We analyze the exact formatting issues, structural gaps, and keyword match parameters that applicant tracking systems screen for.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-cyan">
                <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16" />
                </svg>
              </div>
              <h3 className="feature-title">Keyword Matching</h3>
              <p className="feature-desc">
                Scan job descriptions to locate missing technical skills and terminology, then embed them organically.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-indigo">
                <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="feature-title">Formatting Auditing</h3>
              <p className="feature-desc">
                Flags structural issues like tables, columns, text boxes, and styling symbols that trigger parser read warnings.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-purple">
                <svg style={{ width: "1.25rem", height: "1.25rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="feature-title">Impact Analytics</h3>
              <p className="feature-desc">
                Scan your descriptions to identify passive language and receive recommendations to add action metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION (3 Steps) */}
      <section id="process" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How it works</h2>
            <p className="section-desc">Upload, analyze, and optimize your resume in three simple steps.</p>
          </div>

          <div className="steps-grid">
            <div className="step-item">
              <div className="step-num step-num-sky">01 / Upload</div>
              <h3 className="step-title">Select PDF Resume</h3>
              <p className="step-desc">
                Securely drop your standard PDF resume file. Our system instantly parses the text securely.
              </p>
            </div>

            <div className="step-item">
              <div className="step-num step-num-indigo">02 / Scan</div>
              <h3 className="step-title">Run AI Evaluation</h3>
              <p className="step-desc">
                Our parser reviews layout issues and scans target keywords matching standard screening schemas.
              </p>
            </div>

            <div className="step-item">
              <div className="step-num step-num-purple">03 / Optimize</div>
              <h3 className="step-title">Land Interviews</h3>
              <p className="step-desc">
                Review specific, line-by-line feedback updates and download your highly optimized resume profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by modern job seekers</h2>
            <p className="section-desc">
              Applicants have leveraged ResumeAI to pass the initial screening and land interviews at top tech companies.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;ResumeAI completely transformed my search. The formatting scan flagged that my two-column layout was causing parsers to fail. Re-formatted to a single-column, re-scanned, and landed 3 interviews the next week.&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar author-avatar-cyan">AC</div>
                <div className="author-meta">
                  <span className="author-name">Alex Chen</span>
                  <span className="author-role">Software Engineer</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;As a recruiter, I see hundreds of resumes that fail keyword scans. I recommend ResumeAI to every candidate. The skill gap checker is highly accurate and represents what hiring managers search for.&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar author-avatar-indigo">SM</div>
                <div className="author-meta">
                  <span className="author-name">Sarah Miller</span>
                  <span className="author-role">Talent Acquisition Lead</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <p className="testimonial-text">
                &quot;The quantification audits were incredibly helpful. It forced me to rewrite my bullet points with metrics instead of just listing tasks. My response rate jumped from 5% to over 25%.&quot;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar author-avatar-purple">DK</div>
                <div className="author-meta">
                  <span className="author-name">David Kim</span>
                  <span className="author-role">Senior Product Manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, transparent pricing</h2>
            <p className="section-desc">Choose the plan that fits your career search needs.</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <span className="pricing-plan-name">Free Plan</span>
                <p className="pricing-plan-desc">For testing your formatting layout</p>
                <div className="pricing-price-row">
                  <span className="pricing-price-val">$0</span>
                  <span className="pricing-price-unit">/ forever</span>
                </div>
              </div>

              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  1 Resume Scan / Month
                </li>
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Overall ATS Scoring
                </li>
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Basic Keyword Audit
                </li>
              </ul>

              <a href="#upload" className="btn btn-secondary">
                Scan Now
              </a>
            </div>

            <div className="pricing-card pricing-card-featured">
              <span className="pricing-badge">Recommended</span>
              <div className="pricing-header">
                <span className="pricing-plan-name" style={{ color: "var(--color-indigo)" }}>Pro Plan</span>
                <p className="pricing-plan-desc">For active job hunters looking to optimize impact</p>
                <div className="pricing-price-row">
                  <span className="pricing-price-val">$12</span>
                  <span className="pricing-price-unit">/ month</span>
                </div>
              </div>

              <ul className="pricing-features-list">
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited Resume Scans
                </li>
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Detailed Line-by-Line AI Edits
                </li>
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Custom Job Match Scanning
                </li>
                <li className="pricing-feature-item">
                  <svg className="pricing-feature-icon" style={{ width: "1rem", height: "1rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  PDF Scorecard Exports
                </li>
              </ul>

              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Optimize your resume. Land more callbacks.</h2>
            <p className="cta-desc">
              Take the guesswork out of job applications. Analyze your resume today and get detailed alignment feedback.
            </p>
            <a href="#upload" className="btn btn-lg btn-primary">
              Scan Resume (Free)
            </a>
          </div>
        </div>
      </section>

      {/* Floating Glassmorphic Toast Notifications */}
      <div className="toast-container" id="toast-notifications-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} animate-toast-slide`}>
            <div className="toast-icon-wrapper">
              {toast.type === "success" ? (
                <svg className="toast-svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="toast-svg-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="toast-content-wrapper">
              <div className="toast-title-text">{toast.type === "success" ? "Success" : "Error"}</div>
              <div className="toast-msg-text">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function App() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <Router>
      <MainLayout onLogout={handleLogout}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/job-match" element={<JobMatch />} />
            <Route path="/rewrite" element={<ResumeRewriter />} />
            <Route path="/export" element={<ExportResume />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            
            {/* Enterprise Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/team-workspace" element={<TeamWorkspace />} />
            <Route path="/versions" element={<ResumeVersions />} />
            <Route path="/career-coach" element={<CareerCoach />} />
            <Route path="/cover-letter" element={<CoverLetterGenerator />} />
            <Route path="/linkedin-optimizer" element={<LinkedInOptimizer />} />
            <Route path="/portfolio-generator" element={<PortfolioGenerator />} />
            <Route path="/public/reports/:token" element={<PublicReportView type="resume" />} />
            <Route path="/public/job-match/:token" element={<PublicReportView type="job-match" />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </Router>
  );
}

export default App;