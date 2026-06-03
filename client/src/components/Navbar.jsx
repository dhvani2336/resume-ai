
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../utils/api.js";
import Logo from "./Logo.jsx";

function Navbar({ user, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Poll for notifications every 30 seconds
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
    <header className="navbar" style={{ position: "relative", zIndex: 100 }}>
      <div className="container navbar-container">
        
        {/* Logo */}
        <div className="navbar-logo-section">
          <Link to="/" className="navbar-logo" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Logo size="normal" />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-nav">
          <a href="/#features" className="nav-link">
            Features
          </a>
          <a href="/#process" className="nav-link">
            How It Works
          </a>
          <a href="/#pricing" className="nav-link">
            Pricing
          </a>
          {user && (
            <>
              <Link to="/dashboard" className="nav-link" style={{ fontWeight: 600, color: "var(--color-cyan)" }}>
                Dashboard
              </Link>
              <Link to="/job-match" className="nav-link" style={{ fontWeight: 600, color: "var(--color-purple)" }}>
                Job Match
              </Link>
              <Link to="/rewrite" className="nav-link" style={{ fontWeight: 600, color: "var(--color-cyan)" }}>
                Rewriter
              </Link>
              <Link to="/export" className="nav-link" style={{ fontWeight: 600, color: "var(--color-emerald)" }}>
                Export
              </Link>
              <Link to="/analytics" className="nav-link" style={{ fontWeight: 600, color: "var(--color-indigo)" }}>
                Analytics
              </Link>
              <Link to="/interview-prep" className="nav-link" style={{ fontWeight: 600, color: "var(--color-purple)" }}>
                Interview Prep
              </Link>
            </>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              {/* Notification Bell Dropdown Toggler */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.5rem",
                    borderRadius: "50%",
                    backgroundColor: isOpen ? "rgba(255,255,255,0.06)" : "transparent"
                  }}
                >
                  <svg style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      backgroundColor: "var(--color-rose)",
                      color: "white",
                      fontSize: "0.625rem",
                      fontWeight: "bold",
                      borderRadius: "50%",
                      width: "14px",
                      height: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Glassmorphic Dropdown Feed */}
                {isOpen && (
                  <div className="glass-card" style={{
                    position: "absolute",
                    right: 0,
                    top: "40px",
                    width: "280px",
                    maxHeight: "360px",
                    overflowY: "auto",
                    padding: "1rem",
                    zIndex: 200,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    border: "1px solid var(--color-border-hover)",
                    backgroundColor: "rgba(17, 24, 39, 0.95)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          style={{ background: "none", border: "none", color: "var(--color-cyan)", fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", textAlign: "center", padding: "1.5rem 0" }}>
                        No recent updates.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            style={{
                              padding: "0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: n.isRead ? "transparent" : "rgba(14, 165, 233, 0.04)",
                              borderLeft: n.isRead ? "none" : "3px solid var(--color-cyan)",
                              cursor: n.isRead ? "default" : "pointer",
                              transition: "background 0.2s"
                            }}
                          >
                            <div style={{ fontSize: "0.75rem", fontWeight: n.isRead ? 400 : 600, color: "white" }}>{n.title}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)", marginTop: "0.15rem" }}>{n.message}</div>
                            <div style={{ fontSize: "0.5625rem", color: "var(--color-text-muted)", marginTop: "0.25rem", textAlign: "right" }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link to="/profile" className="nav-link" style={{ fontSize: "0.8125rem" }}>
                Hi, <b>{user.name}</b>
              </Link>
              <button onClick={onLogout} className="btn btn-sm btn-secondary" style={{ padding: "0.375rem 0.75rem", cursor: "pointer" }}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

export default Navbar;
