import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function InterviewPrep() {
  const [displayMode, setDisplayMode] = useState("setup"); // 'setup' | 'interview' | 'report'
  const [resumes, setResumes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Setup Form inputs
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("1-3 Years"); // 'Fresher' | '1-3 Years' | '3-5 Years' | '5+ Years'

  // Generating questions loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState("");

  // Interview state
  const [questions, setQuestions] = useState([]);
  const [suggestedAnswers, setSuggestedAnswers] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active Report state (for report mode)
  const [activeReport, setActiveReport] = useState(null);

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
      // 1. Fetch user's resumes
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

      // 2. Fetch interview history logs
      await fetchInterviewHistory();
    } catch (err) {
      console.error("Error loading setup data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const historyRes = await fetch(`${API_BASE}/api/interview-prep/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.ok && historyData.success) {
        setHistory(historyData.interviews || []);
      }
    } catch (err) {
      console.error("Error loading interview logs:", err);
    }
  };

  // Launch Generator
  const handleStartSetup = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!selectedResumeId) {
      setFormError("Please select or upload a resume first.");
      return;
    }
    if (!targetRole.trim()) {
      setFormError("Please provide a target job role.");
      return;
    }

    setIsGenerating(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/interview-prep`, {
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
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate interview questions.");
      }

      // Combine questions into a single flat array
      const combined = [
        ...(data.technicalQuestions || []),
        ...(data.projectQuestions || []),
        ...(data.behavioralQuestions || []),
        ...(data.hrQuestions || [])
      ].filter(Boolean);

      if (combined.length === 0) {
        throw new Error("AI did not return any questions. Please try again.");
      }

      setQuestions(combined);
      setSuggestedAnswers(data.suggestedAnswers || []);
      setCurrentQuestionIdx(0);
      setAnswers([]);
      setEvaluations([]);
      setCurrentAnswer("");
      setDisplayMode("interview");
    } catch (err) {
      console.error("Generate questions error:", err);
      setFormError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Answer Submission & Evaluation
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsEvaluating(true);
    const token = localStorage.getItem("token");
    const questionText = questions[currentQuestionIdx];

    try {
      // 1. Send answer for evaluation
      const response = await fetch(`${API_BASE}/api/interview-prep/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionText,
          answer: currentAnswer,
          targetRole,
          experienceLevel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate the answer.");
      }

      // Store response evaluation
      const newAnswers = [...answers, currentAnswer];
      const newEvals = [...evaluations, {
        technicalAccuracy: data.technicalAccuracy,
        communicationScore: data.communicationScore,
        confidenceScore: data.confidenceScore,
        suggestions: data.suggestions
      }];

      setAnswers(newAnswers);
      setEvaluations(newEvals);
      setCurrentAnswer("");

      // Move to next question or complete
      if (currentQuestionIdx < questions.length - 1) {
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setIsEvaluating(false);
      } else {
        // Complete interview and compile report
        await handleSaveReport(newAnswers, newEvals);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      alert(err.message || "An error occurred while evaluating your answer.");
      setIsEvaluating(false);
    }
  };

  // Compile & save report
  const handleSaveReport = async (finalAnswers, finalEvals) => {
    setIsSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/interview-prep/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetRole,
          experienceLevel,
          questions,
          answers: finalAnswers,
          evaluations: finalEvals
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to compile the final report.");
      }

      setActiveReport(data.report);
      setDisplayMode("report");
      await fetchInterviewHistory();
    } catch (err) {
      console.error("Save report error:", err);
      alert(err.message || "An error occurred while saving the report.");
    } finally {
      setIsSaving(false);
      setIsEvaluating(false);
    }
  };

  // View past report details
  const handleViewPastReport = async (id) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/api/interview-prep/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setActiveReport(data.report);
        setDisplayMode("report");
      }
    } catch (err) {
      console.error("Error viewing past report:", err);
      alert("Failed to load past interview session.");
    } finally {
      setLoading(false);
    }
  };

  // Suggested answer lookup helper
  const getSuggestedAnswerTips = (qText) => {
    // If viewing a past report, check if it contains suggestions or look it up
    // Note: since suggested answers might not be stored in report schema,
    // we can fall back to standard tips or let the system display dynamically
    if (activeReport?.suggestedAnswers) {
      const item = activeReport.suggestedAnswers.find(s => s.question === qText);
      return item ? item.tips : null;
    }
    // Alternatively, if we just completed it:
    const item = suggestedAnswers.find(s => s.question === qText);
    return item ? item.tips : null;
  };

  // Helpers for score styling class
  const getScoreClass = (score) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    if (score >= 40) return "score-moderate";
    return "score-needs-improvement";
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="db-brand">
            <div className="db-logo-dot"></div>
            <span>AI Interview Prep</span>
          </div>
          <div className="skeleton skeleton-btn" style={{ width: "6rem", height: "1.875rem", borderRadius: "0.375rem" }}></div>
        </header>

        <div className="dashboard-grid container" style={{ marginTop: "2rem" }}>
          <div className="dashboard-left">
            <div className="glass-card" style={{ padding: "1.5rem", height: "24rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "3rem", borderRadius: "4px" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "3rem", borderRadius: "4px" }}></div>
            </div>
          </div>
          <div className="dashboard-right">
            <div className="glass-card" style={{ padding: "2rem", minHeight: "25rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "30%", height: "1.5rem", marginBottom: "1.5rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "14rem", borderRadius: "0.5rem" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper animate-fade-in">
      
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-purple)" }}></div>
          <span>AI Interview Preparation Workspace</span>
        </div>
        <div className="db-user-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Grid: History Left, Workspace Right */}
      <div className="dashboard-grid container">
        
        {/* Left Column: Past Interviews History list */}
        <div className="dashboard-left">
          <div className="glass-card db-card" style={{ height: "100%", minHeight: "30rem", display: "flex", flexDirection: "column" }}>
            <h3 className="card-section-title">Interview History</h3>
            
            {history.length === 0 ? (
              <div className="empty-history-box" style={{ margin: "auto 0" }}>
                No mock interviews run yet. Configure your setup to start.
              </div>
            ) : (
              <div className="db-history-list" style={{ overflowY: "auto", flexGrow: 1, maxHeight: "32rem" }}>
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleViewPastReport(item.id)}
                    className={`db-history-item ${activeReport?.id === item.id && displayMode === "report" ? "active" : ""}`}
                    style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem" }}
                  >
                    <div className="db-hist-left">
                      <span className="db-hist-filename" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                        {item.targetRole}
                      </span>
                      <span className="db-hist-date" style={{ fontSize: "0.6875rem" }}>
                        Level: {item.experienceLevel} • {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`db-hist-score ${getScoreClass(item.overallScore)}`} style={{ padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.75rem" }}>
                      {item.overallScore}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Workspace based on Mode */}
        <div className="dashboard-right">

          {/* SETUP MODE */}
          {displayMode === "setup" && (
            <div className="glass-card" style={{ padding: "2rem", textAlign: "left" }}>
              <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
                  Configure Your Mock Interview
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  Gemini will parse your selected resume to ask highly personalized industry, technical, and project-based questions.
                </p>
              </div>

              {formError && (
                <div style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.25)", color: "var(--color-rose)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.8125rem", marginBottom: "1.25rem", fontWeight: 600 }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleStartSetup} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Resume Selector */}
                <div className="form-group">
                  <label>Select Resume Profile</label>
                  {resumes.length === 0 ? (
                    <div style={{ padding: "0.75rem", border: "1px dashed var(--color-border)", borderRadius: "6px", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                      No resumes found in your scans. Please upload a resume PDF on the main dashboard first.
                    </div>
                  ) : (
                    <select 
                      value={selectedResumeId} 
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)", backgroundColor: "rgba(30, 41, 59, 0.4)", color: "var(--color-text-primary)", fontSize: "0.875rem" }}
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id} style={{ backgroundColor: "#0f172a" }}>
                          {r.originalname} (ATS: {r.atsScore}%)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Target Role */}
                <div className="form-group">
                  <label>Target Job Role</label>
                  <input 
                    type="text" 
                    value={targetRole} 
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)", backgroundColor: "rgba(30, 41, 59, 0.4)", color: "var(--color-text-primary)", fontSize: "0.875rem" }}
                    required
                  />
                </div>

                {/* Experience Level Selector */}
                <div className="form-group">
                  <label>Experience Seniority Level</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {["Fresher", "1-3 Years", "3-5 Years", "5+ Years"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExperienceLevel(lvl)}
                        className={`btn ${experienceLevel === lvl ? "btn-primary" : "btn-secondary"}`}
                        style={{
                          padding: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: experienceLevel === lvl ? "var(--color-purple)" : "rgba(30, 41, 59, 0.3)",
                          borderColor: experienceLevel === lvl ? "var(--color-purple)" : "var(--color-border)",
                          color: "var(--color-text-primary)"
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isGenerating || resumes.length === 0}
                  className="btn btn-primary btn-block"
                  style={{ backgroundColor: "var(--color-purple)", borderColor: "var(--color-purple)", marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner" style={{ width: "1rem", height: "1rem" }}></div>
                      Analyzing resume & generating customized questions...
                    </>
                  ) : (
                    "Generate Tailored AI Questions"
                  )}
                </button>

              </form>
            </div>
          )}

          {/* INTERVIEW MODE */}
          {displayMode === "interview" && (
            <div className="glass-card animate-fade-in" style={{ padding: "2rem", textAlign: "left", minHeight: "26rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Top progress metadata */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-purple)" }}>
                    Mock Session (Role: {targetRole})
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>
                    Question {currentQuestionIdx + 1} of {questions.length}
                  </span>
                </div>
                
                {/* Visual Progress bar */}
                <div style={{ width: "100%", height: "4px", backgroundColor: "var(--color-border)", borderRadius: "2px", overflow: "hidden", marginBottom: "1.5rem" }}>
                  <div style={{
                    width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`,
                    height: "100%",
                    backgroundColor: "var(--color-purple)",
                    transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}></div>
                </div>

                {/* Question Display Card */}
                <div style={{ padding: "1.25rem 1.5rem", borderRadius: "8px", borderLeft: "4px solid var(--color-purple)", backgroundColor: "rgba(124, 58, 237, 0.05)", borderTop: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.5, margin: 0 }}>
                    {questions[currentQuestionIdx]}
                  </p>
                </div>

                {/* Answer Area */}
                <div className="form-group" style={{ position: "relative" }}>
                  <label style={{ fontSize: "0.75rem" }}>Type your answer below</label>
                  <textarea
                    rows={6}
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    disabled={isEvaluating || isSaving}
                    placeholder="Provide your professional response here. Try to answer in detail, using industry keywords, standard structures (like STAR method), and examples from your resume..."
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.5)", color: "var(--color-text-primary)", fontSize: "0.875rem", resize: "vertical", marginTop: "0.25rem", fontFamily: "inherit" }}
                  />
                  {isEvaluating && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(4px)",
                      borderRadius: "0.5rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem"
                    }}>
                      <div className="spinner" style={{ width: "1.5rem", height: "1.5rem", borderTopColor: "var(--color-purple)" }}></div>
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 700 }}>
                        {isSaving ? "Compiling final mock interview report card..." : "AI is grading your technical and communication accuracy..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!currentAnswer.trim() || isEvaluating || isSaving}
                  className="btn btn-primary"
                  style={{
                    backgroundColor: "var(--color-purple)",
                    borderColor: "var(--color-purple)",
                    padding: "0.625rem 1.5rem",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    minWidth: "10rem"
                  }}
                >
                  {currentQuestionIdx === questions.length - 1 ? "Submit & Complete" : "Submit & Next"}
                </button>
              </div>

            </div>
          )}

          {/* REPORT MODE */}
          {displayMode === "report" && activeReport && (
            <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Report Header Card */}
              <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, color: "var(--color-purple)", letterSpacing: "0.05em" }}>
                      Mock Interview Feedback Summary
                    </span>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
                      {activeReport.targetRole}
                    </h2>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      Experience Level: {activeReport.experienceLevel} • Conducted: {new Date(activeReport.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Score badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 700 }}>OVERALL GRADE</span>
                      <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Based on STAR accuracy</span>
                    </div>
                    <div className={`db-hist-score ${getScoreClass(activeReport.overallScore)}`} style={{ fontSize: "1.5rem", fontWeight: 800, padding: "0.5rem 0.85rem", borderRadius: "8px" }}>
                      {activeReport.overallScore}%
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses Columns */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                  
                  {/* Strengths */}
                  <div>
                    <h4 style={{ fontSize: "0.8125rem", color: "var(--color-emerald)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.75rem", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-emerald)" }}></span>
                      Observed Strengths
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {activeReport.strengths && activeReport.strengths.map((str, idx) => (
                        <li key={idx} style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4, paddingLeft: "0.75rem", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, color: "var(--color-emerald)" }}>•</span>
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h4 style={{ fontSize: "0.8125rem", color: "var(--color-rose)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.75rem", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--color-rose)" }}></span>
                      Areas for Improvement
                    </h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {activeReport.weaknesses && activeReport.weaknesses.map((wk, idx) => (
                        <li key={idx} style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4, paddingLeft: "0.75rem", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, color: "var(--color-rose)" }}>•</span>
                          {wk}
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Study suggestions */}
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.8125rem", color: "var(--color-cyan)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", margin: 0 }}>
                    Recommended study topics
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                    {activeReport.recommendedTopics && activeReport.recommendedTopics.map((topic, idx) => (
                      <span key={idx} style={{ fontSize: "0.6875rem", color: "var(--color-cyan)", backgroundColor: "rgba(14, 165, 233, 0.08)", border: "1px solid rgba(14, 165, 233, 0.15)", borderRadius: "9999px", padding: "0.2rem 0.6rem", fontWeight: 600 }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action: Restart Interview */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Session Q&A Breakdown
                </span>
                <button
                  onClick={() => setDisplayMode("setup")}
                  className="btn btn-primary"
                  style={{ backgroundColor: "var(--color-purple)", borderColor: "var(--color-purple)", padding: "0.375rem 1rem", fontSize: "0.75rem" }}
                >
                  Start New Session
                </button>
              </div>

              {/* Detailed Breakdown for each Q&A */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
                {activeReport.questions && activeReport.questions.map((q, idx) => {
                  const evalItem = activeReport.evaluations[idx] || {};
                  const userAns = activeReport.answers[idx] || "";
                  const suggestedTips = getSuggestedAnswerTips(q);

                  return (
                    <div key={idx} className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      
                      {/* Question Label */}
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                          Question {idx + 1}: {q}
                        </span>
                        
                        {/* Metrics score row */}
                        <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.625rem" }}>
                          <span style={{ border: "1px solid var(--color-border)", padding: "0.15rem 0.35rem", borderRadius: "3px", color: "var(--color-emerald)", backgroundColor: "rgba(16, 185, 129, 0.05)" }}>
                            Tech Accuracy: {evalItem.technicalAccuracy}%
                          </span>
                          <span style={{ border: "1px solid var(--color-border)", padding: "0.15rem 0.35rem", borderRadius: "3px", color: "var(--color-cyan)", backgroundColor: "rgba(14, 165, 233, 0.05)" }}>
                            Comm: {evalItem.communicationScore}%
                          </span>
                          <span style={{ border: "1px solid var(--color-border)", padding: "0.15rem 0.35rem", borderRadius: "3px", color: "var(--color-indigo)", backgroundColor: "rgba(99, 102, 241, 0.05)" }}>
                            Conf: {evalItem.confidenceScore}%
                          </span>
                        </div>
                      </div>

                      {/* User's Answer */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Your Response</span>
                        <div style={{ padding: "0.75rem", borderRadius: "4px", backgroundColor: "rgba(15, 23, 42, 0.3)", border: "1px solid var(--color-border)", fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                          {userAns}
                        </div>
                      </div>

                      {/* AI Evaluation Feedback */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-purple)", fontWeight: 700, textTransform: "uppercase" }}>AI Feedback Suggestions</span>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: 1.4, margin: 0 }}>
                          {evalItem.suggestions || "No feedback suggestions returned."}
                        </p>
                      </div>

                      {/* Suggested answer tips */}
                      {suggestedTips && (
                        <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "0.75rem", marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.6875rem", color: "var(--color-cyan)", fontWeight: 700, textTransform: "uppercase" }}>Suggested Answering Tips</span>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.4, margin: 0, fontStyle: "italic" }}>
                            {suggestedTips}
                          </p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default InterviewPrep;
