import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // 1. Fetch User Profile info
      const profileResponse = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileData.error || "Session expired.");
      }
      setUser(profileData.user);

      // 2. Fetch Recent Resumes
      const resumesResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resumesData = await resumesResponse.json();
      if (resumesResponse.ok) {
        setAnalyses(resumesData.resumes || []);
      }

      // 3. Fetch Analytics & Activity logs
      const analyticsResponse = await fetch(`${API_BASE}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analyticsData = await analyticsResponse.json();
      if (analyticsResponse.ok) {
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 700);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  // Compact line chart renderer for Dashboard
  const renderATSPreviewChart = (trendData, color) => {
    if (!trendData || trendData.length === 0) {
      return (
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
          No scan data recorded yet.
        </div>
      );
    }

    const width = 500;
    const height = 140;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const pointsCount = trendData.length;
    const svgPoints = trendData.map((d, idx) => {
      const x = pointsCount === 1 
        ? paddingLeft + chartWidth / 2 
        : paddingLeft + idx * (chartWidth / (pointsCount - 1));
      const score = Math.max(0, Math.min(100, d.score));
      const y = paddingTop + chartHeight - (score / 100) * chartHeight;
      return { x, y, score, date: d.date };
    });

    const polylinePath = svgPoints.map(p => `${p.x},${p.y}`).join(" ");

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
        {/* Horizontal grid guide lines */}
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
        <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--color-border)" strokeWidth="0.75" />

        {/* Axis values */}
        <text x={paddingLeft - 8} y={paddingTop + 4} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">100</text>
        <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">50</text>
        <text x={paddingLeft - 8} y={paddingTop + chartHeight + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">0</text>

        {polylinePath && (
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePath} />
        )}
        {svgPoints.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--color-card-bg)" stroke={color} strokeWidth="2.2" />
        ))}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="db-brand">
            <div className="db-logo-dot"></div>
            <span>ResumeAI Dashboard</span>
          </div>
          <div className="skeleton skeleton-text" style={{ width: "8rem", height: "1.5rem" }}></div>
        </header>

        <div className="container" style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Skeleton Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: "1.5rem", height: "6rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="skeleton skeleton-text" style={{ width: "50%" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "30%", height: "1.5rem" }}></div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem", height: "18rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "40%", marginBottom: "1rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "80%" }}></div>
            </div>
            <div className="glass-card" style={{ padding: "1.5rem", height: "18rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "40%", marginBottom: "1rem" }}></div>
              <div className="skeleton skeleton-block" style={{ width: "100%", height: "80%" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = analytics?.metrics || { totalResumes: 0, averageAtsScore: 0, highestAtsScore: 0 };
  const atsTrend = analytics?.charts?.atsScoreTrend || [];
  const recentActivities = (analytics?.recentActivity || []).slice(0, 3);
  const recentScans = analyses.slice(0, 3);

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-emerald)" }}></div>
          <span>Overview Console</span>
        </div>
        <div className="db-user-actions">
          <span className="db-welcome-text">Welcome back, <b>{user?.name}</b></span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm db-logout-btn">
            Log Out
          </button>
        </div>
      </header>

      <div className="container" style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Welcome Section */}
        <div className="glass-card" style={{ padding: "1.75rem 2rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.25rem", borderLeft: "4px solid var(--color-cyan)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            Welcome, {user?.name}!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0 }}>
            Here is a consolidated summary of your resume scans, matching performance metrics, and activity logs.
          </p>
        </div>

        {/* Quick Statistics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
          
          <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-emerald)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Resumes Scanned</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.totalResumes}</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Total profiles scanned</span>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-cyan)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Average ATS</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.averageAtsScore}%</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Mean scorecard performance</span>
          </div>

          <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--color-indigo)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Highest ATS</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.highestAtsScore}%</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Your top scoring scan</span>
          </div>

        </div>

        {/* Middle Row Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          
          {/* Column A: ATS Trend & Performance Overview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0, textAlign: "left" }}>
                ATS Score Trend Preview
              </h3>
              <div style={{ height: "9rem", width: "100%" }}>
                {renderATSPreviewChart(atsTrend, "var(--color-emerald)")}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem 0" }}>
                Performance Overview
              </h3>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <span>Target ATS Score</span>
                <span>80%</span>
              </div>
              <div style={{ width: "100%", height: "6px", backgroundColor: "var(--color-border)", borderRadius: "3px", overflow: "hidden", margin: "0.25rem 0 0.75rem 0" }}>
                <div style={{ width: `${Math.min(100, metrics.averageAtsScore)}%`, height: "100%", backgroundColor: metrics.averageAtsScore >= 70 ? "var(--color-emerald)" : "var(--color-cyan)" }}></div>
              </div>

              <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", lineHeight: "1.4", margin: 0 }}>
                {metrics.averageAtsScore >= 80 
                  ? "Excellent! Your average score meets the high-performance threshold for most enterprise job sites." 
                  : `Your current average ATS rating is ${metrics.averageAtsScore}%. Try uploading details in the Workspace or revising missing keywords to push your score above 80%.`}
              </p>
            </div>

          </div>

          {/* Column B: Recent Activity Timeline & Quick Action Shortcuts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Quick Actions Shortcuts */}
            <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: "0 0 1rem 0" }}>
                Quick Action Shortcuts
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                <button onClick={() => navigate("/scanner")} className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", backgroundColor: "rgba(14, 165, 233, 0.05)", borderColor: "var(--color-cyan)", color: "var(--color-text-primary)" }}>
                  <span>Scanner Workspace</span>
                </button>
                <button onClick={() => navigate("/job-match")} className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", backgroundColor: "rgba(168, 85, 247, 0.05)", borderColor: "var(--color-purple)", color: "var(--color-text-primary)" }}>
                  <span>Job Match Scan</span>
                </button>
                <button onClick={() => navigate("/rewrite")} className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", backgroundColor: "rgba(14, 165, 233, 0.05)", borderColor: "var(--color-cyan)", color: "var(--color-text-primary)" }}>
                  <span>AI Resume Rewriter</span>
                </button>
                <button onClick={() => navigate("/export")} className="btn btn-primary" style={{ padding: "0.5rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", backgroundColor: "rgba(16, 185, 129, 0.05)", borderColor: "var(--color-emerald)", color: "var(--color-text-primary)" }}>
                  <span>Export Document</span>
                </button>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left", flexGrow: 1 }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0 }}>
                Recent activity
              </h3>
              
              {recentActivities.length === 0 ? (
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", margin: "auto 0" }}>
                  No recent activities recorded.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", position: "relative", paddingLeft: "1.25rem", borderLeft: "2px solid var(--color-border)", margin: "0.25rem 0" }}>
                  {recentActivities.map((act) => (
                    <div key={act.id} style={{ display: "flex", flexDirection: "column", position: "relative", gap: "0.1rem" }}>
                      <div style={{
                        position: "absolute",
                        left: "calc(-1.25rem - 5px)",
                        top: "4px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-card-bg)",
                        border: "2px solid var(--color-cyan)"
                      }}></div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-primary)", fontWeight: 700 }}>{act.title}</span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{act.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Recent Scans Summary */}
        <div className="glass-card" style={{ padding: "1.5rem", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Recent Scans Summary
            </h3>
            <button onClick={() => navigate("/scanner")} className="btn btn-secondary btn-sm" style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}>
              View Workspace →
            </button>
          </div>

          {recentScans.length === 0 ? (
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", margin: "1.5rem 0", textAlign: "center" }}>
              No scans recorded. Upload your first resume in the Scanner Workspace page!
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontWeight: 800 }}>
                    <th style={{ padding: "0.5rem", textAlign: "left" }}>Filename</th>
                    <th style={{ padding: "0.5rem", textAlign: "left" }}>Upload Date</th>
                    <th style={{ padding: "0.5rem", textAlign: "center" }}>ATS Score</th>
                    <th style={{ padding: "0.5rem", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan) => (
                    <tr key={scan.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "var(--color-text-primary)" }}>{scan.originalname}</td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>{new Date(scan.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>
                        <span style={{ 
                          fontSize: "0.6875rem", 
                          padding: "0.15rem 0.35rem", 
                          borderRadius: "3px", 
                          fontWeight: 700, 
                          color: scan.atsScore >= 70 ? "var(--color-emerald)" : "var(--color-rose)",
                          backgroundColor: scan.atsScore >= 70 ? "rgba(16, 185, 129, 0.08)" : "rgba(244, 63, 94, 0.08)"
                        }}>
                          {scan.atsScore}%
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                        <button 
                          onClick={() => navigate(`/scanner?id=${scan.id}`)} 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.6875rem" }}
                        >
                          Open in Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
