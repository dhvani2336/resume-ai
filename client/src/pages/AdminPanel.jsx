import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function AdminPanel() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'analytics' | 'audit' | 'errors'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, [navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // 1. Check if user is admin
      const profileResp = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileResp.json();
      if (!profileResp.ok) throw new Error(profileData.error || "Failed to load profile.");
      
      if (profileData.user.role !== "admin") {
        throw new Error("Access denied. Admin permissions required.");
      }

      // 2. Fetch Users
      const usersResp = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersResp.json();
      if (!usersResp.ok) throw new Error(usersData.error || "Failed to load users list.");
      setUsers(usersData.users || []);

      // 3. Fetch Analytics
      const analResp = await fetch(`${API_BASE}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const analData = await analResp.json();
      if (analResp.ok) setAnalytics(analData.stats);

      // 4. Fetch Audit Logs
      const auditResp = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditData = await auditResp.json();
      if (auditResp.ok) setAuditLogs(auditData.logs || []);

      // 5. Fetch Error Logs
      const errorLogsResp = await fetch(`${API_BASE}/api/admin/error-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const errorLogsData = await errorLogsResp.json();
      if (errorLogsResp.ok) setErrorLogs(errorLogsData.logs || []);

    } catch (err) {
      setMessage({ text: err.message, type: "error" });
      // If unauthorized, redirect back to dashboard after small timeout
      if (err.message.includes("Access denied")) {
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update role.");

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: nextRole } : u));
      setMessage({ text: "Role updated successfully!", type: "success" });
      
      // Refresh audit logs
      const auditResp = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditData = await auditResp.json();
      if (auditResp.ok) setAuditLogs(auditData.logs || []);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId, currentSub) => {
    const nextSub = currentSub === "premium" ? "free" : "premium";
    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/subscription`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscription: nextSub })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update tier.");

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription: nextSub } : u));
      setMessage({ text: "Subscription tier modified successfully!", type: "success" });

      // Refresh audit logs
      const auditResp = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditData = await auditResp.json();
      if (auditResp.ok) setAuditLogs(auditData.logs || []);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete this user account. Proceed?")) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete user account.");

      setUsers(prev => prev.filter(u => u.id !== userId));
      setMessage({ text: "User account deleted successfully.", type: "success" });

      // Refresh audit logs
      const auditResp = await fetch(`${API_BASE}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const auditData = await auditResp.json();
      if (auditResp.ok) setAuditLogs(auditData.logs || []);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div className="skeleton skeleton-block" style={{ height: "4rem" }}></div>
          <div className="skeleton skeleton-block" style={{ height: "20rem" }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Header */}
      <header className="dashboard-header" style={{ borderBottom: "1px solid var(--color-border)", marginBottom: "2rem" }}>
        <div className="db-brand">
          <Link to="/profile" className="nav-back-link" style={{ marginRight: "1rem" }}>
            ← Profile
          </Link>
          <div className="db-logo-dot" style={{ backgroundColor: "var(--color-purple)" }}></div>
          <span>Admin Control Panel</span>
        </div>
        <div>
          <Link to="/dashboard" className="btn btn-sm btn-secondary">
            User Dashboard
          </Link>
        </div>
      </header>

      <div className="container">
        {message.text && (
          <div className="glass-card animate-toast-slide" style={{ 
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

        {/* Tab Selector Links */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "2rem", gap: "1rem" }}>
          {[
            { id: "users", label: "👥 Users Management" },
            { id: "analytics", label: "📊 System Analytics" },
            { id: "audit", label: "📜 Audit Trails" },
            { id: "errors", label: "⚠️ Error Logs" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMessage({ text: "", type: "" });
              }}
              style={{
                padding: "0.75rem 1.25rem",
                backgroundColor: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-purple)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--color-purple)" : "var(--color-text-secondary)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.9375rem",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: USERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="glass-card animate-fade-in" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Accounts Directory</h3>
              <input 
                type="text" 
                placeholder="Search name or email..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                style={{
                  width: "260px",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "#0b0f19",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem"
                }}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>User Name</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Email Address</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Verified</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Role</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Tier</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                        No user profiles found matching query constraints.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }}>
                        <td style={{ padding: "1rem" }}><b>{user.name}</b></td>
                        <td style={{ padding: "1rem", color: "var(--color-text-secondary)" }}>{user.email}</td>
                        <td style={{ padding: "1rem" }}>
                          <span style={{ color: user.isVerified ? "var(--color-emerald)" : "var(--color-rose)" }}>
                            {user.isVerified ? "Yes" : "No"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span className="badge" style={{ 
                            backgroundColor: user.role === "admin" ? "rgba(168, 85, 247, 0.1)" : "rgba(255,255,255,0.04)", 
                            color: user.role === "admin" ? "var(--color-purple)" : "var(--color-text-secondary)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem"
                          }}>{user.role}</span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span className="badge" style={{ 
                            backgroundColor: user.subscription === "premium" ? "rgba(16, 185, 129, 0.1)" : "rgba(14, 165, 233, 0.1)", 
                            color: user.subscription === "premium" ? "var(--color-emerald)" : "var(--color-cyan)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem"
                          }}>{user.subscription}</span>
                        </td>
                        <td style={{ padding: "1rem", display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <button 
                            onClick={() => handleUpdateRole(user.id, user.role)} 
                            className="btn btn-sm btn-secondary" 
                            disabled={actionLoading}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                          >
                            Toggle Admin
                          </button>
                          <button 
                            onClick={() => handleUpdateSubscription(user.id, user.subscription)} 
                            className="btn btn-sm btn-secondary" 
                            disabled={actionLoading}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--color-cyan)" }}
                          >
                            Toggle Premium
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            className="btn btn-sm btn-secondary" 
                            disabled={actionLoading}
                            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", color: "var(--color-rose)" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SYSTEM ANALYTICS */}
        {activeTab === "analytics" && analytics && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Quick Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              {[
                { title: "Total Users", val: analytics.totalUsers, color: "var(--color-cyan)" },
                { title: "Premium Accounts", val: analytics.premiumUsers, color: "var(--color-emerald)" },
                { title: "Resumes Scanned", val: analytics.totalResumes, color: "var(--color-indigo)" },
                { title: "Job Match Reports", val: analytics.totalJobMatches, color: "var(--color-purple)" },
                { title: "Average ATS Score", val: `${analytics.averageAtsScore}%`, color: "var(--color-rose)" }
              ].map((m, idx) => (
                <div key={idx} className="glass-card" style={{ padding: "1.5rem 1.25rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", tracking: "0.05em", marginBottom: "0.5rem" }}>{m.title}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Core Feature Scopes Breakdown */}
            <div className="glass-card" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1.5rem" }}>AI Feature Operations Metric Count</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {[
                  { label: "Resume Bullet Rewrites", count: analytics.totalRewrites, color: "var(--color-cyan)" },
                  { label: "AI Career Roadmaps", count: analytics.totalCoverLetters, color: "var(--color-purple)" },
                  { label: "LinkedIn Optimizer Sessions", count: analytics.totalLinkedInProfiles, color: "var(--color-indigo)" },
                  { label: "HTML Portfolios Generated", count: analytics.totalPortfolios, color: "var(--color-emerald)" },
                  { label: "DOCX/PDF Downloads", count: analytics.totalExports, color: "var(--color-rose)" }
                ].map((f, idx) => (
                  <div key={idx} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{f.label}</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: f.color }}>{f.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: AUDIT TRAILS */}
        {activeTab === "audit" && (
          <div className="glass-card animate-fade-in" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Security & System Activity Trail</h3>
            
            {auditLogs.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No audit trails recorded yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8125rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                      <th style={{ padding: "0.5rem" }}>Timestamp</th>
                      <th style={{ padding: "0.5rem" }}>Uploader</th>
                      <th style={{ padding: "0.5rem" }}>Logged Action</th>
                      <th style={{ padding: "0.5rem" }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                        <td style={{ padding: "0.75rem 0.5rem", whiteSpace: "nowrap" }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: "0.75rem 0.5rem" }}><b>{log.userName || "System"}</b></td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "white" }}>{log.action}</td>
                        <td style={{ padding: "0.75rem 0.5rem", fontFamily: "monospace" }}>{log.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ERROR LOGS */}
        {activeTab === "errors" && (
          <div className="glass-card animate-fade-in" style={{ padding: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Server Exception Backtrace</h3>
            
            {errorLogs.length === 0 ? (
              <p style={{ color: "var(--color-emerald)", fontSize: "0.875rem" }}>Zero errors encountered! Server is running clean.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {errorLogs.map(err => (
                  <div 
                    key={err.id} 
                    style={{ 
                      padding: "1rem", 
                      border: "1px solid rgba(244,63,94,0.2)", 
                      borderRadius: "0.375rem", 
                      backgroundColor: "rgba(244,63,94,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <span style={{ color: "var(--color-rose)", fontWeight: 600, fontSize: "0.875rem" }}>
                        ⚠️ {err.message}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(err.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>
                      <span>Method: <b style={{ color: "var(--color-cyan)" }}>{err.method}</b></span>
                      <span>Path: <b style={{ color: "var(--color-purple)" }}>{err.path}</b></span>
                    </div>
                    {err.stack && (
                      <details style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        <summary style={{ cursor: "pointer", marginBottom: "0.25rem" }}>View stack trace</summary>
                        <pre style={{ 
                          whiteSpace: "pre-wrap", 
                          padding: "0.75rem", 
                          backgroundColor: "#05070c", 
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.25rem",
                          fontFamily: "monospace"
                        }}>{err.stack}</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default AdminPanel;
