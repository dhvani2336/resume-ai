import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api.js";

function TeamWorkspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeWorkspaceDetails, setActiveWorkspaceDetails] = useState(null);
  const [personalResumes, setPersonalResumes] = useState([]);
  
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [selectedResumeId, setSelectedResumeId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [expandedResumeId, setExpandedResumeId] = useState(null);
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
      // 1. Fetch workspaces
      const wsResponse = await fetch(`${API_BASE}/api/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const wsData = await wsResponse.json();
      if (!wsResponse.ok) throw new Error(wsData.error || "Failed to load workspaces.");
      setWorkspaces(wsData.workspaces || []);

      // 2. Fetch personal resumes to populate the share selector
      const resumeResponse = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resumeData = await resumeResponse.json();
      if (!resumeResponse.ok) throw new Error(resumeData.error || "Failed to load personal resumes.");
      setPersonalResumes(resumeData.resumes || []);

      if (wsData.workspaces.length > 0) {
        await handleSelectWorkspace(wsData.workspaces[0].id);
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (workspaceId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load workspace details.");
      
      setActiveWorkspace(data.workspace);
      setActiveWorkspaceDetails(data); // contains workspace details and shared resumes
      setExpandedResumeId(null);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create workspace.");

      setWorkspaces(prev => [...prev, data.workspace]);
      setNewWorkspaceName("");
      setMessage({ text: "Workspace created successfully!", type: "success" });
      await handleSelectWorkspace(data.workspace.id);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/workspaces/${activeWorkspace.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to invite member.");

      setInviteEmail("");
      setMessage({ text: "Member added successfully!", type: "success" });
      await handleSelectWorkspace(activeWorkspace.id);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!activeWorkspace) return;
    if (!window.confirm("Are you sure you want to remove this member from the workspace?")) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/workspaces/${activeWorkspace.id}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to remove member.");

      setMessage({ text: "Member removed successfully.", type: "success" });
      await handleSelectWorkspace(activeWorkspace.id);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareResume = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !activeWorkspace) return;

    setActionLoading(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE}/api/workspaces/${activeWorkspace.id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeId: selectedResumeId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to share resume.");

      setSelectedResumeId("");
      setMessage({ text: "Resume shared with workspace successfully!", type: "success" });
      await handleSelectWorkspace(activeWorkspace.id);
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleResumeExpand = (id) => {
    setExpandedResumeId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="container" style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div className="skeleton skeleton-text" style={{ width: "30%", height: "2.5rem" }}></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem" }}>
            <div className="glass-card" style={{ height: "22rem", padding: "1.5rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "80%", marginBottom: "1.5rem" }}></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton skeleton-block" style={{ height: "2rem", marginBottom: "0.75rem" }}></div>
              ))}
            </div>
            <div className="glass-card" style={{ height: "22rem", padding: "2rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "50%", height: "2rem", marginBottom: "1rem" }}></div>
              <div className="skeleton skeleton-block" style={{ height: "10rem" }}></div>
            </div>
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
          <div className="db-logo-dot"></div>
          <span>Team Workspaces</span>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem", alignItems: "start" }} className="workspace-grid-layout">
          
          {/* LEFT SIDEBAR: Workspaces list and creation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "1rem" }}>My Workspaces</h3>
              
              {workspaces.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>No workspaces created yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {workspaces.map(ws => (
                    <button 
                      key={ws.id} 
                      onClick={() => handleSelectWorkspace(ws.id)}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        textAlign: "left",
                        border: "1px solid " + (activeWorkspace?.id === ws.id ? "var(--color-cyan)" : "var(--color-border)"),
                        backgroundColor: activeWorkspace?.id === ws.id ? "rgba(14, 165, 233, 0.08)" : "transparent",
                        borderRadius: "0.375rem",
                        color: activeWorkspace?.id === ws.id ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                        cursor: "pointer",
                        fontWeight: activeWorkspace?.id === ws.id ? 600 : 400,
                        transition: "all 0.2s"
                      }}
                    >
                      💼 {ws.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Create Workspace</h3>
              <form onSubmit={handleCreateWorkspace}>
                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label htmlFor="ws-name">Workspace Name</label>
                  <input 
                    type="text" 
                    id="ws-name"
                    placeholder="e.g. Design Team, Engineering"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-secondary btn-block" disabled={actionLoading}>
                  {actionLoading ? "Creating..." : "Create Workspace"}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Workspace Details */}
          {activeWorkspaceDetails ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              
              {/* Workspace Header Info */}
              <div className="glass-card" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>{activeWorkspace.name}</h2>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                    Created by: <span style={{ color: "var(--color-cyan)" }}>{activeWorkspace.ownerEmail}</span>
                  </p>
                </div>
                <span className="badge" style={{ 
                  backgroundColor: "rgba(16, 185, 129, 0.1)", 
                  color: "var(--color-emerald)", 
                  padding: "0.5rem 1rem", 
                  borderRadius: "1.5rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600
                }}>
                  Active Workspace
                </span>
              </div>

              {/* Grid: Shared Resumes and Members list */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
                
                {/* 1. Shared Resumes List */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Shared Resumes</h3>
                    <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                      {activeWorkspaceDetails.resumes?.length || 0} shared
                    </span>
                  </div>

                  {/* Share Personal Resume Form */}
                  <form onSubmit={handleShareResume} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <select 
                        value={selectedResumeId} 
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          backgroundColor: "#0b0f19",
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.375rem",
                          color: "var(--color-text-primary)"
                        }}
                      >
                        <option value="">-- Choose personal resume to share --</option>
                        {personalResumes.filter(pr => pr.workspaceId !== activeWorkspace.id).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.filename} (Score: {r.atsScore})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={!selectedResumeId || actionLoading}>
                      Share in Workspace
                    </button>
                  </form>

                  {/* Shared Resumes List Items */}
                  {!activeWorkspaceDetails.resumes || activeWorkspaceDetails.resumes.length === 0 ? (
                    <div style={{ padding: "3rem 1.5rem", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "0.5rem" }}>
                      <p style={{ color: "var(--color-text-muted)" }}>No resumes have been shared in this workspace yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {activeWorkspaceDetails.resumes.map(resume => {
                        const isExpanded = expandedResumeId === resume.id;
                        return (
                          <div 
                            key={resume.id} 
                            style={{ 
                              border: "1px solid var(--color-border)", 
                              borderRadius: "0.5rem", 
                              backgroundColor: "rgba(17, 24, 39, 0.4)",
                              overflow: "hidden"
                            }}
                          >
                            <div style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                              <div>
                                <h4 style={{ fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>{resume.filename}</h4>
                                <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                  <span>Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</span>
                                  <span>Score: <b style={{ color: resume.atsScore >= 75 ? "var(--color-emerald)" : resume.atsScore >= 50 ? "var(--color-cyan)" : "var(--color-rose)" }}>{resume.atsScore}</b></span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button onClick={() => toggleResumeExpand(resume.id)} className="btn btn-sm btn-secondary">
                                  {isExpanded ? "Collapse" : "Expand Scorecard"}
                                </button>
                              </div>
                            </div>

                            {/* In-place Expanded Scorecard */}
                            {isExpanded && (
                              <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", backgroundColor: "#090d16" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                                  <div className="glass-card" style={{ padding: "1rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-cyan)" }}>{resume.atsScore}%</div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ATS Score</div>
                                  </div>
                                  <div className="glass-card" style={{ padding: "1rem" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Strengths</div>
                                    <ul style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", paddingLeft: "1.25rem" }}>
                                      {resume.strengths?.slice(0, 3).map((s, idx) => <li key={idx}>{s}</li>)}
                                    </ul>
                                  </div>
                                  <div className="glass-card" style={{ padding: "1rem" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Missing Skills</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.25rem" }}>
                                      {resume.missingSkills?.slice(0, 5).map((sk, idx) => (
                                        <span key={idx} style={{ fontSize: "0.6875rem", backgroundColor: "rgba(244, 63, 94, 0.1)", color: "var(--color-rose)", padding: "0.15rem 0.5rem", borderRadius: "0.25rem" }}>{sk}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  {resume.shareToken && (
                                    <Link to={`/public/reports/${resume.shareToken}`} target="_blank" className="btn btn-sm btn-primary" style={{ fontSize: "0.8125rem" }}>
                                      Open Shareable Report ↗
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Workspace Members & Invites */}
                <div className="glass-card" style={{ padding: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Workspace Members</h3>

                  {/* Invite Member Form */}
                  <form onSubmit={handleInviteMember} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <input 
                      type="email" 
                      placeholder="Invitee email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      style={{ padding: "0.5rem" }}
                    />
                    <select 
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      style={{ padding: "0.5rem", backgroundColor: "#0b0f19", border: "1px solid var(--color-border)", color: "white" }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                      Invite Member
                    </button>
                  </form>

                  {/* Members list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {/* Owner item */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem", backgroundColor: "rgba(99, 102, 241, 0.05)" }}>
                      <div>
                        <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{activeWorkspace.ownerEmail}</span>
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>(Workspace Owner)</span>
                      </div>
                      <span className="badge" style={{ backgroundColor: "var(--color-indigo)", color: "white", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem" }}>Owner</span>
                    </div>

                    {/* Members loop */}
                    {activeWorkspace.members?.map(m => (
                      <div key={m.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", border: "1px solid var(--color-border)", borderRadius: "0.375rem" }}>
                        <div>
                          <span style={{ color: "var(--color-text-primary)" }}>{m.email}</span>
                          <span className="badge" style={{ 
                            marginLeft: "0.5rem", 
                            fontSize: "0.6875rem", 
                            backgroundColor: m.role === "admin" ? "rgba(168, 85, 247, 0.1)" : "rgba(255,255,255,0.05)",
                            color: m.role === "admin" ? "var(--color-purple)" : "var(--color-text-secondary)",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem"
                          }}>{m.role}</span>
                        </div>
                        
                        {/* Remove Member button (only visible to owner/admins) */}
                        {activeWorkspace.ownerId !== m.userId && (
                          <button 
                            onClick={() => handleRemoveMember(m.userId)} 
                            style={{ 
                              background: "none", 
                              border: "none", 
                              color: "var(--color-rose)", 
                              cursor: "pointer", 
                              fontSize: "0.875rem" 
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <p style={{ color: "var(--color-text-muted)" }}>Please select or create a workspace to view its details.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TeamWorkspace;
