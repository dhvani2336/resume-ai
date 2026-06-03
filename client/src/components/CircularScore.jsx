import React, { useEffect, useState } from "react";

function CircularScore({ score = 0, size = "5rem", strokeWidth = 8, fontSize = "1.25rem", glow = true }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate the score progress from 0 to target score
    const duration = 800; // ms
    const startTime = performance.now();

    let animationFrameId;

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      // Easing function: easeOutQuad
      const easedProgress = progress * (2 - progress);
      
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [score]);

  // SVG calculations
  const radius = 50 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.max(0, Math.min(animatedScore, 100))) / 100;

  // Determine colors based on score value
  const getScoreColor = (val) => {
    if (val >= 70) return "var(--color-emerald)";
    if (val >= 50) return "var(--color-cyan)";
    return "var(--color-rose)";
  };

  const scoreColor = getScoreColor(score);

  return (
    <div 
      className="circular-score-container" 
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        flexShrink: 0
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          transform: "rotate(-90deg)",
          width: "100%",
          height: "100%",
          display: "block",
          overflow: "visible"
        }}
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.1s ease-out, stroke 0.3s ease",
            filter: glow ? `drop-shadow(0 0 4px ${scoreColor})` : "none"
          }}
        />
      </svg>
      {/* Center Text */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          color: "var(--color-text-primary)",
          fontWeight: 800,
          fontSize: fontSize,
          userSelect: "none"
        }}
      >
        <span>{animatedScore}%</span>
      </div>
    </div>
  );
}

export default CircularScore;
