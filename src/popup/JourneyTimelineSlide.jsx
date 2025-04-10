import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const formatDomain = (domain) => domain?.replace(/^www\./, "");

const EVENT_META = {
  first: {
    icon: "🚀",
    title: "First Site Visited",
    subtitle: "Kicked off your journey here",
  },
  mostVisited: {
    icon: "🔥",
    title: "Most Visited Site",
    subtitle: (event) => `${event.visits} visits total`,
  },
  longest: {
    icon: "⏱️",
    title: "Longest Session",
    subtitle: (event) => `${Math.round(event.durationMs / 60000)} min spent`,
  },
  latenight: {
    icon: "🌙",
    title: "Late-Night Browsing",
    subtitle: (event) => `Active at ${event.hour}:00 AM`,
  },
  last: {
    icon: "📍",
    title: "Last Site Visited",
    subtitle: "Where your day wrapped up",
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const TimelineItem = ({ icon, title, subtitle, domain, timestamp, isLast }) => {
  const dateLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <motion.div
      variants={itemVariants}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        marginBottom: "1.5rem",
        position: "relative",
      }}
    >
      {/* Dot + Animated Line */}
      <div style={{ position: "relative", width: "24px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#60a5fa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            color: "#fff",
            zIndex: 2,
            boxShadow: "0 0 10px rgba(96,165,250,0.5)",
          }}
        >
          {icon}
        </div>

        {!isLast && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "2px",
              background: "rgba(255,255,255,0.1)",
            }}
          />
        )}
      </div>

      {/* Text Content */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: "1rem",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "4px 0",
            fontSize: "0.85rem",
            color: "#aaa",
          }}
        >
          {subtitle}
        </p>
        {domain && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "#ccc",
              marginTop: "2px",
              fontStyle: "italic",
            }}
          >
            {formatDomain(domain)} {dateLabel ? ` • ${dateLabel}` : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const JourneyTimelineSlide = ({ events }) => {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        No timeline data available.
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        position: "absolute",
        inset: 0,
        padding: "2rem 1.5rem",
        overflowY: "auto",
        color: "#fff",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          fontSize: "1.6rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          textAlign: "center",
          color: "#f3f4f6",
          textShadow: "0 0 10px rgba(0,0,0,0.4)",
        }}
      >
        🧭 Your Browsing Journey
      </motion.h2>

      {events.map((event, idx) => {
        const meta = EVENT_META[event.type] || {};
        const icon = meta.icon || "💻";
        const title = meta.title || "Unknown Event";
        const subtitle =
          typeof meta.subtitle === "function"
            ? meta.subtitle(event)
            : meta.subtitle || "";

        return (
          <TimelineItem
            key={idx}
            icon={icon}
            title={title}
            subtitle={subtitle}
            domain={event.domain}
            timestamp={event.timestamp}
            isLast={idx === events.length - 1}
          />
        );
      })}
    </motion.div>
  );
};

JourneyTimelineSlide.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      domain: PropTypes.string,
      visits: PropTypes.number,
      durationMs: PropTypes.number,
      hour: PropTypes.number,
      timestamp: PropTypes.number,
    })
  ).isRequired,
};

export default JourneyTimelineSlide;
