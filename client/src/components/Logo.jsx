import React from "react";

function Logo({ variant = "desktop", className = "", size = "normal" }) {
  // Define dimensions based on size prop
  const dimensions = {
    small: { icon: "1.25rem", font: "0.9375rem" },
    normal: { icon: "1.75rem", font: "1.25rem" },
    large: { icon: "2.5rem", font: "1.75rem" },
    huge: { icon: "3.5rem", font: "2.5rem" }
  }[size] || { icon: "1.75rem", font: "1.25rem" };

  const iconMarkup = (
    <div 
      className="brand-logo-icon-wrapper"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: dimensions.icon,
        height: dimensions.icon,
        flexShrink: 0,
        filter: "drop-shadow(0 0 6px rgba(14, 165, 233, 0.45))",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: "100%",
          height: "100%",
          stroke: "url(#brand-logo-gradient)",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          overflow: "visible"
        }}
      >
        <defs>
          <linearGradient id="brand-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
          </linearGradient>
        </defs>
        {/* Document sheet border with folded corner */}
        <path d="M15 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7l-5-5z" />
        <path d="M14 2v5h5" />
        {/* Horizontal text rows inside document */}
        <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.8" />
        <line x1="8" y1="16" x2="16" y2="16" strokeWidth="1.8" />
        <line x1="8" y1="19" x2="13" y2="19" strokeWidth="1.8" />
        {/* ATS Speed scan scanner lines extending to the left */}
        <line x1="-2" y1="9" x2="2" y2="9" stroke="url(#brand-logo-gradient)" strokeWidth="1.5" opacity="0.9" />
        <line x1="-4" y1="13" x2="1" y2="13" stroke="url(#brand-logo-gradient)" strokeWidth="1.5" opacity="0.75" />
        <line x1="-3" y1="17" x2="0" y2="17" stroke="url(#brand-logo-gradient)" strokeWidth="1.5" opacity="0.5" />
      </svg>
    </div>
  );

  if (variant === "compact") {
    return iconMarkup;
  }

  return (
    <div 
      className={`brand-logo-container ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        cursor: "pointer",
        userSelect: "none"
      }}
    >
      {iconMarkup}
      
      <span
        className="brand-logo-text"
        style={{
          fontSize: dimensions.font,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--color-text-primary)",
          fontFamily: "Inter, Roboto, sans-serif",
          display: "flex",
          alignItems: "center",
          transition: "all 0.3s ease"
        }}
      >
        Resume<span style={{ color: "#06b6d4" }}>AI</span>
      </span>
    </div>
  );
}

export default Logo;
