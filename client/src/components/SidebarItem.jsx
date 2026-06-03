import React from "react";
import { Link } from "react-router-dom";

function SidebarItem({ label, icon, path, active, onClick }) {
  const content = (
    <>
      <span className="sidebar-item-icon">{icon}</span>
      <span className="sidebar-item-label">{label}</span>
    </>
  );

  if (path) {
    return (
      <Link
        to={path}
        className={`sidebar-item ${active ? "active" : ""}`}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
    >
      {content}
    </button>
  );
}

export default SidebarItem;
