import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { API_BASE } from "../utils/api.js";
import "./DashboardLayout.css";

function DashboardLayout({ children, user, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Resolve current page title dynamically
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard Overview";
      case "/job-match":
        return "Job Match Analyzer";
      case "/rewrite":
        return "AI Resume Rewriter";
      case "/export":
        return "Document Exporter";
      case "/analytics":
        return "System Analytics";
      case "/interview-prep":
        return "AI Interview Prep";
      case "/profile":
        return "User Profile";
      case "/settings":
        return "Account Settings";
      case "/team-workspace":
        return "Team Workspace";
      case "/versions":
        return "Resume Versions";
      case "/career-coach":
        return "AI Career Coach";
      case "/cover-letter":
        return "Cover Letter Generator";
      case "/linkedin-optimizer":
        return "LinkedIn Optimizer";
      case "/portfolio-generator":
        return "Portfolio Generator";
      case "/admin":
        return "Admin Panel";
      default:
        return "ResumeAI Dashboard";
    }
  };

  // Notification Polling Logic (Migrated from Navbar.jsx)
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="dashboard-layout-container">
      
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="dashboard-layout-main">
        
        {/* Sticky Topbar */}
        <header className="dashboard-layout-topbar">
          
          <div className="topbar-left">
            {/* Hamburger Button for Mobile screens */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hamburger-btn"
              aria-label="Open Sidebar"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="topbar-page-title">
              {getPageTitle() === "Dashboard Overview" ? (
                <>
                  <span className="desktop-title">Dashboard Overview</span>
                  <span className="mobile-title">Dashboard</span>
                </>
              ) : getPageTitle()}
            </h2>
          </div>

          <div className="topbar-right">
            {/* Notification Bell Dropdown Toggler */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem",
                  borderRadius: "50%",
                  backgroundColor: isNotifOpen ? "rgba(255,255,255,0.06)" : "transparent",
                  transition: "all 0.2s"
                }}
              >
                <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "3px",
                    right: "3px",
                    backgroundColor: "var(--color-rose)",
                    color: "white",
                    fontSize: "0.625rem",
                    fontWeight: "bold",
                    borderRadius: "50%",
                    width: "14px",
                    height: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 8px rgba(244, 63, 94, 0.4)"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Glassmorphic Dropdown Feed */}
              {isNotifOpen && (
                <>
                  <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 199 }} onClick={() => setIsNotifOpen(false)}></div>
                  <div className="glass-card" style={{
                    position: "absolute",
                    right: 0,
                    top: "42px",
                    width: "300px",
                    maxHeight: "360px",
                    overflowY: "auto",
                    padding: "1rem",
                    zIndex: 200,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5), 0 0 15px rgba(0, 0, 0, 0.5)",
                    border: "1px solid var(--color-border-hover)",
                    backgroundColor: "rgba(17, 24, 39, 0.96)",
                    borderRadius: "12px",
                    textAlign: "left"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#ffffff" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          style={{ background: "none", border: "none", color: "var(--color-cyan)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", textAlign: "center", padding: "2rem 0" }}>
                        No recent updates.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            style={{
                              padding: "0.5rem 0.625rem",
                              borderRadius: "6px",
                              backgroundColor: n.isRead ? "transparent" : "rgba(14, 165, 233, 0.04)",
                              borderLeft: n.isRead ? "none" : "3px solid var(--color-cyan)",
                              cursor: n.isRead ? "default" : "pointer",
                              transition: "background 0.2s"
                            }}
                          >
                            <div style={{ fontSize: "0.75rem", fontWeight: n.isRead ? 500 : 700, color: "#ffffff" }}>{n.title}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.15rem", lineHeight: "1.3" }}>{n.message}</div>
                            <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", marginTop: "0.25rem", textAlign: "right" }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Profile indicator */}
            {user && (
              <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-secondary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                <div style={{
                  width: "1.875rem",
                  height: "1.875rem",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-cyan), var(--color-indigo))",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="nav-link topbar-username" style={{ display: "inline-block", maxWidth: "6rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </span>
              </Link>
            )}

          </div>
        </header>

        {/* Scrollable Children Workspace */}
        <main className="dashboard-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
