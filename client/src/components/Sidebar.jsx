import React from "react";
import { useLocation, Link } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import Logo from "./Logo.jsx";

function Sidebar({ user, onLogout, isOpen, onClose }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      label: "Resume Scanner",
      path: "/scanner",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: "Job Match",
      path: "/job-match",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      label: "Resume Rewriter",
      path: "/rewrite",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 00-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
        </svg>
      )
    },
    {
      label: "Export Resume",
      path: "/export",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      )
    },
    {
      label: "Interview Prep",
      path: "/interview-prep",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      label: "Profile",
      path: "/profile",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  const handleItemClick = () => {
    if (onClose) {
      onClose(); // Close mobile drawer on navigation
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose}></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar-container ${isOpen ? "open" : ""}`}>
        
        {/* Brand Logo Header */}
        <div className="sidebar-brand">
          <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Logo size="normal" />
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="sidebar-nav-menu">
          <div className="sidebar-menu-section">
            {menuItems.map((item) => {
              const isActive = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
              return (
                <SidebarItem
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  path={item.path}
                  active={isActive}
                  onClick={handleItemClick}
                />
              );
            })}
          </div>
          
          <div className="sidebar-menu-divider"></div>
          
          {/* Action Item: Logout */}
          <div className="sidebar-menu-section">
            <SidebarItem
              label="Logout"
              icon={
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6-10V5a3 3 0 00-6 0v1" />
                </svg>
              }
              active={false}
              onClick={() => {
                handleItemClick();
                onLogout();
              }}
            />
          </div>
        </nav>

        {/* User Profile Info Footer */}
        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
