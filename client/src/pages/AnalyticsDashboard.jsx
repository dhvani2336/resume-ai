import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null); // { chartId, index, x, y, label, value, detail }

  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, [navigate]);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const resData = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(resData.error || "Failed to retrieve analytics data.");
      }

      setData(resData);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message || "An error occurred while loading analytics.");
    } finally {
      // Small timeout to showcase loading skeletons
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="db-brand">
            <div className="db-logo-dot"></div>
            <span>ResumeAI Analytics</span>
          </div>
          <div>
            <div className="skeleton skeleton-btn" style={{ width: "8rem", height: "1.875rem", borderRadius: "0.375rem" }}></div>
          </div>
        </header>

        <div className="container" style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Metrics skeleton */}
          <div className="analytics-metrics-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: "1.25rem", height: "6rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "30%", height: "1.5rem" }}></div>
              </div>
            ))}
          </div>

          {/* Charts skeleton */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card" style={{ padding: "1.5rem", height: "16rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
                <div className="skeleton skeleton-block" style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <header className="dashboard-header">
          <div className="db-brand">
            <div className="db-logo-dot" style={{ backgroundColor: "var(--color-rose)" }}></div>
            <span>ResumeAI Analytics</span>
          </div>
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm">
            ← Back
          </button>
        </header>
        <div className="container" style={{ marginTop: "4rem", textAlign: "center" }}>
          <div className="glass-card" style={{ padding: "3rem 2rem", maxWidth: "32rem", margin: "0 auto" }}>
            <h3 style={{ color: "var(--color-rose)", marginBottom: "1rem", fontWeight: 700 }}>Unable to load Analytics</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</p>
            <button onClick={fetchAnalytics} className="btn btn-primary">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, charts, recentActivity } = data;

  // ----------------------------------------------------
  // SVG Chart Render Helpers
  // ----------------------------------------------------

  // 1. Line Chart Helper (for ATS Score Trend and Job Match Score Trend)
  const renderLineChart = (chartId, trendData, color, emptyMsg) => {
    if (!trendData || trendData.length === 0) {
      return (
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
          {emptyMsg}
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Map points to SVG coordinates
    const pointsCount = trendData.length;
    
    const svgPoints = trendData.map((d, idx) => {
      const x = pointsCount === 1 
        ? paddingLeft + chartWidth / 2 
        : paddingLeft + idx * (chartWidth / (pointsCount - 1));
      
      const score = Math.max(0, Math.min(100, d.score));
      const y = paddingTop + chartHeight - (score / 100) * chartHeight;
      return { x, y, score, date: d.date, name: d.originalname || d.role || "Resume" };
    });

    // Build polyline string
    const polylinePath = svgPoints.map(p => `${p.x},${p.y}`).join(" ");

    // Build area path string
    const areaPath = svgPoints.length > 0
      ? `${paddingLeft},${paddingTop + chartHeight} ` + 
        svgPoints.map(p => `${p.x},${p.y}`).join(" ") + 
        ` ${svgPoints[svgPoints.length - 1].x},${paddingTop + chartHeight}`
      : "";

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
          {/* Gradients */}
          <defs>
            <linearGradient id={`gradient-area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--color-border)" strokeWidth="0.75" />

          {/* Axes labels */}
          <text x={paddingLeft - 8} y={paddingTop + 4} fill="var(--color-text-muted)" fontSize="7" textAnchor="end">100</text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 3} fill="var(--color-text-muted)" fontSize="7" textAnchor="end">50</text>
          <text x={paddingLeft - 8} y={paddingTop + chartHeight + 3} fill="var(--color-text-muted)" fontSize="7" textAnchor="end">0</text>

          {/* Area under the line */}
          {areaPath && (
            <path d={areaPath} fill={`url(#gradient-area-${chartId})`} />
          )}

          {/* Line */}
          {polylinePath && (
            <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylinePath} />
          )}

          {/* Interactive Dots */}
          {svgPoints.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="var(--color-card-bg)"
              stroke={color}
              strokeWidth="2.5"
              style={{ cursor: "pointer", transition: "all 0.15s ease" }}
              onMouseEnter={(e) => {
                const rect = e.target.getBoundingClientRect();
                const parentRect = e.target.parentElement.parentElement.getBoundingClientRect();
                setHoveredPoint({
                  chartId,
                  index: idx,
                  x: p.x,
                  y: p.y,
                  label: p.date,
                  value: `${p.score}%`,
                  detail: p.name
                });
              }}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* Date scale (show first and last date) */}
          {svgPoints.length > 0 && (
            <>
              <text x={paddingLeft} y={height - 6} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="start">
                {svgPoints[0].date}
              </text>
              {svgPoints.length > 1 && (
                <text x={width - paddingRight} y={height - 6} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">
                  {svgPoints[svgPoints.length - 1].date}
                </text>
              )}
            </>
          )}
        </svg>

        {/* Floating Tooltip inside container */}
        {hoveredPoint && hoveredPoint.chartId === chartId && (
          <div style={{
            position: "absolute",
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 32}%`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
            minWidth: "6rem",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{hoveredPoint.label}</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 800 }}>{hoveredPoint.value}</span>
            <span style={{ fontSize: "0.5625rem", color: color, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "8rem" }}>
              {hoveredPoint.detail}
            </span>
          </div>
        )}
      </div>
    );
  };

  // 2. Bar Chart Helper (for Resume Upload Activity)
  const renderBarChart = (chartId, activityData, color, emptyMsg) => {
    if (!activityData || activityData.length === 0) {
      return (
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
          {emptyMsg}
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxCount = Math.max(5, ...activityData.map(d => d.count));
    const itemsCount = activityData.length;
    
    // Width of each bar
    const totalSlots = Math.max(itemsCount, 7);
    const barWidth = Math.max(10, (chartWidth / totalSlots) * 0.6);
    const stepX = chartWidth / totalSlots;

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
          {/* Horizontal lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--color-border)" strokeWidth="0.75" />

          {/* Axes labels */}
          <text x={paddingLeft - 6} y={paddingTop + 4} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">{maxCount}</text>
          <text x={paddingLeft - 6} y={paddingTop + chartHeight / 2 + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">{Math.round(maxCount / 2)}</text>
          <text x={paddingLeft - 6} y={paddingTop + chartHeight + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">0</text>

          {/* Bars */}
          {activityData.map((d, idx) => {
            const barHeight = (d.count / maxCount) * chartHeight;
            const x = paddingLeft + idx * stepX + (stepX - barWidth) / 2;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barHeight)} // draw at least a sliver
                fill={color}
                rx="2"
                style={{ cursor: "pointer", transition: "fill 0.2s ease" }}
                onMouseEnter={() => {
                  setHoveredPoint({
                    chartId,
                    index: idx,
                    x: x + barWidth / 2,
                    y: y,
                    label: d.date,
                    value: `${d.count} Upload(s)`,
                    detail: "Frequency Log"
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Date scale label (first & last) */}
          {activityData.length > 0 && (
            <>
              <text x={paddingLeft} y={height - 6} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="start">
                {activityData[0].date}
              </text>
              {activityData.length > 1 && (
                <text x={width - paddingRight} y={height - 6} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">
                  {activityData[activityData.length - 1].date}
                </text>
              )}
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && hoveredPoint.chartId === chartId && (
          <div style={{
            position: "absolute",
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 25}%`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
            minWidth: "6rem",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{hoveredPoint.label}</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 800 }}>{hoveredPoint.value}</span>
          </div>
        )}
      </div>
    );
  };

  // 3. Grouped Columns Chart Helper (for Monthly Usage breakdown)
  const renderMonthlyStatsChart = (chartId, monthlyData, emptyMsg) => {
    if (!monthlyData || monthlyData.length === 0) {
      return (
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
          {emptyMsg}
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const paddingLeft = 30;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Max val across all statistics fields
    const maxVal = Math.max(
      5,
      ...monthlyData.map(d => Math.max(d.uploads, d.jobMatches, d.rewrites, d.exports))
    );

    const monthsCount = monthlyData.length;
    const stepX = chartWidth / Math.max(monthsCount, 3);
    const subBarWidth = Math.max(4, stepX * 0.15); // Width of each type bar inside group

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
          {/* Horizontal lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--color-border)" strokeWidth="0.75" />

          {/* Axes labels */}
          <text x={paddingLeft - 6} y={paddingTop + 4} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">{maxVal}</text>
          <text x={paddingLeft - 6} y={paddingTop + chartHeight / 2 + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">{Math.round(maxVal / 2)}</text>
          <text x={paddingLeft - 6} y={paddingTop + chartHeight + 3} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="end">0</text>

          {/* Monthly group bars */}
          {monthlyData.map((d, idx) => {
            const startX = paddingLeft + idx * stepX + (stepX - subBarWidth * 4 - 6) / 2;

            // Coordinates for 4 items in group
            const items = [
              { key: "uploads", val: d.uploads, color: "var(--color-emerald)", label: "Uploads" },
              { key: "jobMatches", val: d.jobMatches, color: "var(--color-cyan)", label: "Matches" },
              { key: "rewrites", val: d.rewrites, color: "var(--color-indigo)", label: "Rewrites" },
              { key: "exports", val: d.exports, color: "var(--color-purple)", label: "Exports" }
            ];

            return (
              <g key={idx}>
                {items.map((item, itemIdx) => {
                  const hVal = (item.val / maxVal) * chartHeight;
                  const x = startX + itemIdx * (subBarWidth + 2);
                  const y = paddingTop + chartHeight - hVal;

                  return (
                    <rect
                      key={item.key}
                      x={x}
                      y={y}
                      width={subBarWidth}
                      height={Math.max(1, hVal)}
                      fill={item.color}
                      rx="1"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => {
                        setHoveredPoint({
                          chartId,
                          index: idx,
                          x: x + subBarWidth / 2,
                          y: y,
                          label: d.month,
                          value: `${item.val} ${item.label}`,
                          detail: "Monthly Stats"
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}

                {/* X axis month name */}
                <text x={startX + (subBarWidth * 4 + 6) / 2} y={height - 6} fill="var(--color-text-muted)" fontSize="7.5" textAnchor="middle">
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && hoveredPoint.chartId === chartId && (
          <div style={{
            position: "absolute",
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 25}%`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "rgba(17, 24, 39, 0.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            gap: "0.1rem",
            minWidth: "6rem",
            textAlign: "center"
          }}>
            <span style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{hoveredPoint.label}</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 800 }}>{hoveredPoint.value}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="dashboard-header">
        <div className="db-brand">
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-indigo)" }}></div>
          <span>System Analytics Panel</span>
        </div>
        <div className="db-user-actions">
          <button onClick={() => navigate("/dashboard")} className="btn btn-secondary btn-sm" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="container" style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "2rem", paddingBottom: "4rem" }}>
        
        {/* Row 1: Metrics Cards */}
        <div className="analytics-metrics-grid">
          
          {/* Card 1: Resumes */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-emerald)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Resumes Scanned</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.totalResumes}</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Total PDF uploads evaluated</span>
          </div>

          {/* Card 2: Avg ATS */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-cyan)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Average ATS</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.averageAtsScore}%</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Mean score of all scans</span>
          </div>

          {/* Card 3: Max ATS */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-indigo)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Highest ATS</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.highestAtsScore}%</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Best evaluation score</span>
          </div>

          {/* Card 4: Job Matches */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-purple)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Job Matches</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.totalJobMatches}</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>JD alignment checks</span>
          </div>

          {/* Card 5: Rewrites */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-rose)", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>AI Rewrites</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.totalRewrites}</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>Bullet points optimized</span>
          </div>

          {/* Card 6: Exports */}
          <div className="glass-card" style={{ padding: "1.25rem", borderLeft: "4px solid #F59E0B", display: "flex", flexDirection: "column", gap: "0.25rem", textAlign: "left" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>Exports Done</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{metrics.totalExports}</span>
            <span style={{ fontSize: "0.625rem", color: "var(--color-text-muted)" }}>PDF & DOCX file builds</span>
          </div>

        </div>

        {/* Row 2: Charts Grid (2x2) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          
          {/* Chart 1: ATS Trend */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0, textAlign: "left" }}>
              ATS Score Progression
            </h3>
            <div style={{ height: "10rem", width: "100%" }}>
              {renderLineChart("atsTrend", charts.atsScoreTrend, "var(--color-emerald)", "No analyses logged yet.")}
            </div>
          </div>

          {/* Chart 2: Job Match Trend */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0, textAlign: "left" }}>
              Job Match Score Trend
            </h3>
            <div style={{ height: "10rem", width: "100%" }}>
              {renderLineChart("matchTrend", charts.jobMatchScoreTrend, "var(--color-cyan)", "No job match analyses logged yet.")}
            </div>
          </div>

          {/* Chart 3: Resume Upload Frequency */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0, textAlign: "left" }}>
              Resume Upload Activity
            </h3>
            <div style={{ height: "10rem", width: "100%" }}>
              {renderBarChart("uploadActivity", charts.uploadActivity, "var(--color-indigo)", "No upload logs recorded yet.")}
            </div>
          </div>

          {/* Chart 4: Monthly usage breakdown */}
          <div className="glass-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", margin: 0, textAlign: "left" }}>
              Monthly Usage Statistics
            </h3>
            <div style={{ height: "10rem", width: "100%" }}>
              {renderMonthlyStatsChart("monthlyUsage", charts.monthlyUsage, "No monthly activity recorded.")}
            </div>
            
            {/* Legend indicators */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", fontSize: "0.6875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "1px", backgroundColor: "var(--color-emerald)" }}></div>
                <span style={{ color: "var(--color-text-secondary)" }}>Scans</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "1px", backgroundColor: "var(--color-cyan)" }}></div>
                <span style={{ color: "var(--color-text-secondary)" }}>Matches</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "1px", backgroundColor: "var(--color-indigo)" }}></div>
                <span style={{ color: "var(--color-text-secondary)" }}>Rewrites</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "1px", backgroundColor: "var(--color-purple)" }}></div>
                <span style={{ color: "var(--color-text-secondary)" }}>Exports</span>
              </div>
            </div>
          </div>

        </div>

        {/* Row 3: Recent Activity Timeline */}
        <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "left" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem", margin: 0 }}>
            Recent Activity Timeline
          </h3>

          {recentActivity.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", fontStyle: "italic", margin: "1rem 0" }}>No activities recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "relative", paddingLeft: "1.5rem", borderLeft: "2px solid var(--color-border)" }}>
              {recentActivity.map((activity, idx) => {
                // Color mapping based on activity type
                const colorMap = {
                  upload: "var(--color-emerald)",
                  "job-match": "var(--color-cyan)",
                  rewrite: "var(--color-indigo)",
                  export: "var(--color-purple)"
                };
                
                const dotColor = colorMap[activity.type] || "var(--color-border)";
                const eventDate = new Date(activity.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={activity.id} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    
                    {/* Visual node bullet */}
                    <div style={{
                      position: "absolute",
                      left: "calc(-1.5rem - 6.5px)",
                      top: "4px",
                      width: "11px",
                      height: "11px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-card-bg)",
                      border: `3.5px solid ${dotColor}`,
                      boxShadow: `0 0 6px ${dotColor}`
                    }}></div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", fontWeight: 700 }}>
                        {activity.title}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {activity.description}
                      </span>
                    </div>

                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>
                      {eventDate}
                    </span>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AnalyticsDashboard;
