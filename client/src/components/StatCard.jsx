import React from "react";

function StatCard({ title, value, description, icon, trend, trendType = "info" }) {
  return (
    <div className="stat-card glass-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && <span className="stat-card-icon">{icon}</span>}
      </div>
      <div className="stat-card-body">
        <h3 className="stat-card-value">{value}</h3>
        {(description || trend) && (
          <div className="stat-card-meta">
            {trend && (
              <span className={`stat-card-trend trend-${trendType}`}>
                {trend}
              </span>
            )}
            {description && (
              <span className="stat-card-description">{description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
