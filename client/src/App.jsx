import { useState } from "react";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  // Drag and Drop state management
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState("idle"); // 'idle' | 'uploading' | 'success'
  const [fileName, setFileName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;

    // Validate PDF format only
    const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPDF) {
      setUploadError("Please upload a PDF file only.");
      setResumeFile(null);
      setUploadState("idle");
      return;
    }

    setUploadError("");
    setResumeFile(file); // Store uploaded file in React state
    setFileName(file.name);
    setUploadState("uploading");

    // Simulate progress/loading animation before success state
    setTimeout(() => {
      setUploadState("success");
    }, 1500);
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
  };



  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content */}
      <main>

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
                <a href="#features" className="btn btn-lg btn-secondary">
                  How It Works
                </a>
              </div>
            </div>

            {/* Right Column: ATS Score Mock Card */}
            <div className="hero-right animate-fade-in delay-2">
              <div className="glass-card">

                {/* Card Header */}
                <div className="card-header">
                  <div>
                    <div className="card-title-sub">Scan Result</div>
                    <h3 className="card-title-main">resume_senior_dev.pdf</h3>
                  </div>
                  <span className="status-badge">PASSED</span>
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
                      />
                    </svg>
                    <div className="progress-text">85%</div>
                  </div>

                  <div className="card-score-info">
                    <div className="score-title">ATS Match Score</div>
                    <p className="score-desc">
                      This file aligns with 85% of target skills and keyword criteria.
                    </p>
                  </div>
                </div>

                {/* Card Details: Keywords */}
                <div className="card-keywords-section">
                  <div>
                    <div className="keyword-group-title">Matched Keywords</div>
                    <div className="pills-container">
                      <span className="pill pill-success">React</span>
                      <span className="pill pill-success">TypeScript</span>
                      <span className="pill pill-success">Node.js</span>
                    </div>
                  </div>

                  <div>
                    <div className="keyword-group-title">Missing Keywords</div>
                    <div className="pills-container">
                      <span className="pill pill-danger">AWS</span>
                      <span className="pill pill-danger">Docker</span>
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
                  <div className="upload-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.15)", color: "var(--color-emerald)" }}>
                    <svg style={{ width: "1.75rem", height: "1.75rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="upload-title" style={{ color: "var(--color-emerald)" }}>Analysis Complete!</h3>
                  <p className="upload-desc">
                    Successfully scanned <b>{fileName}</b> {resumeFile && `(${(resumeFile.size / 1024 / 1024).toFixed(2)} MB)`}. See the preview dashboard results above.
                  </p>
                  <button className="btn btn-text nav-link" style={{ fontWeight: 600, fontSize: "0.8125rem" }} onClick={resetUpload}>
                    Scan Another File
                  </button>
                </>
              )}

            </div>
          </div>
        </section>

        {/* FEATURES SECTION (3 Cards) */}
        <section id="features" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="container">

            {/* Header */}
            <div className="section-header">
              <h2 className="section-title">Engineered to bypass ATS filters</h2>
              <p className="section-desc">
                We analyze the exact formatting issues, structural gaps, and keyword match parameters that applicant tracking systems screen for.
              </p>
            </div>

            {/* Grid */}
            <div className="features-grid">

              {/* Feature 1 */}
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

              {/* Feature 2 */}
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

              {/* Feature 3 */}
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

            {/* Header */}
            <div className="section-header">
              <h2 className="section-title">How it works</h2>
              <p className="section-desc">Upload, analyze, and optimize your resume in three simple steps.</p>
            </div>

            {/* Steps Grid */}
            <div className="steps-grid">

              {/* Step 1 */}
              <div className="step-item">
                <div className="step-num step-num-sky">01 / Upload</div>
                <h3 className="step-title">Select PDF Resume</h3>
                <p className="step-desc">
                  Securely drop your standard PDF resume file. Our system instantly parses the text securely.
                </p>
              </div>

              {/* Step 2 */}
              <div className="step-item">
                <div className="step-num step-num-indigo">02 / Scan</div>
                <h3 className="step-title">Run AI Evaluation</h3>
                <p className="step-desc">
                  Our parser reviews layout issues and scans target keywords matching standard screening schemas.
                </p>
              </div>

              {/* Step 3 */}
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

        {/* TESTIMONIALS SECTION (3 Reviews) */}
        <section id="testimonials" className="section-spacing" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="container">

            {/* Header */}
            <div className="section-header">
              <h2 className="section-title">Loved by modern job seekers</h2>
              <p className="section-desc">
                Applicants have leveraged ResumeAI to pass the initial screening and land interviews at top tech companies.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="testimonials-grid">

              {/* Testimonial 1 */}
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

              {/* Testimonial 2 */}
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

              {/* Testimonial 3 */}
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

            {/* Header */}
            <div className="section-header">
              <h2 className="section-title">Simple, transparent pricing</h2>
              <p className="section-desc">Choose the plan that fits your career search needs.</p>
            </div>

            {/* Pricing cards */}
            <div className="pricing-grid">

              {/* Free Plan */}
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

              {/* Pro Plan */}
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

                <a href="#upload" className="btn btn-primary">
                  Get Pro
                </a>
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

      </main>

      {/* FOOTER */}
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

export default App;