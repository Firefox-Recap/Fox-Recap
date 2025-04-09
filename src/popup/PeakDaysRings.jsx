import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatMinutes = (ms) => {
  const mins = Math.floor(ms / 60000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins} min`;
};

const Ring = ({ day, value, max, isPeak }) => {
  const percent = Math.min(value / max, 1);
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray * (1 - percent);
  const minutes = formatMinutes(value);

  return (
    <div
      style={{
        position: "relative",
        width: 90,
        height: 100,
        textAlign: "center",
        transform: "scale(0.95)",
      }}
    >
      {/* Glowing background behind peak ring */}
      {isPeak && (
        <div
          style={{
            position: "absolute",
            top: "6px",
            left: "6px",
            width: 78,
            height: 78,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)",
            filter: "blur(6px)",
            zIndex: 0,
          }}
        />
      )}

      <svg width="90" height="90" viewBox="0 0 100 100" style={{ position: "relative", zIndex: 1 }}>
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="rgba(255, 255, 255, 0.07)"
          strokeWidth="10"
          fill="none"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#ringGradient)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDasharray}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            filter: isPeak ? "drop-shadow(0 0 10px rgba(96,165,250,0.6))" : "none",
          }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="10"
          fill="#fff"
          style={{
            fontWeight: 600,
            letterSpacing: "0.4px",
            dominantBaseline: "middle",
          }}
        >
          {minutes}
        </text>
      </svg>

      <div style={{ color: "#bbb", fontSize: "0.8rem", marginTop: "0.35rem" }}>
        {day.slice(0, 3)}
      </div>
    </div>
  );
};

const PeakDaysRings = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        No data available for days.
      </div>
    );
  }

  const orderedData = dayOrder.map((day) => data.find((d) => d.day === day) || { day, totalMs: 0 });
  const peak = orderedData.reduce(
    (max, curr) => (curr.totalMs > max.totalMs ? curr : max),
    { totalMs: 0 }
  );
  const max = peak.totalMs || 1;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "2rem 1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: "2.2rem",
          color: "#f1f1f1",
          textShadow: "0 0 12px rgba(0,0,0,0.6), 0 0 20px rgba(96,165,250,0.3)",
        }}
      >
        Most active on {peak.day} — {formatMinutes(peak.totalMs)}
      </h2>

      {/* Ring Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: "flex",
          gap: "1.3rem",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "94vw",
        }}
      >
        {orderedData.map((entry) => (
          <Ring
            key={entry.day}
            day={entry.day}
            value={entry.totalMs}
            max={max}
            isPeak={entry.day === peak.day}
          />
        ))}
      </motion.div>

      {/* Microcopy */}
      <p
        style={{
          marginTop: "1.3rem",
          fontSize: "0.75rem",
          color: "#ccc",
          textShadow: "0 0 4px #000",
        }}
      >
        Each ring shows your browsing duration for the day
      </p>
    </div>
  );
};

PeakDaysRings.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      day: PropTypes.string.isRequired,
      totalMs: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default PeakDaysRings;
