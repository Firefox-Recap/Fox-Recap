import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

// === Duration Formatter ===
const formatDuration = (ms) => {
  const mins = Math.floor(ms / 60000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins}m`;
};

// === Tooltip ===
const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { category, duration } = payload[0].payload;
    return (
      <div
        style={{
          background: "#ffffffdd",
          color: "#000",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: "0.9rem",
        }}
      >
        <strong>{category}</strong>
        <div>{formatDuration(duration)}</div>
      </div>
    );
  }
  return null;
};

// === Main Component ===
const TopCategoriesChart = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-white bg-gray-800"
        style={{ width: "100%", height: "100%" }}
      >
        No category data available.
      </div>
    );
  }

  const maxDuration = Math.max(...data.map((d) => d.duration));
  const domainMax = maxDuration > 0 ? maxDuration + 30000 : "auto";

  // Emojis for category names
  const emojiMap = {
    "Shopping & E-Commerce": "🛍",
    "Technology & Development": "💻",
    "News & Media": "📰",
    "Social Media & Networking": "💬",
    "Entertainment & Streaming": "🎬",
    "Finance & Banking": "💰",
    "Education & Learning": "📚",
    "Health & Wellness": "💊",
    "Real Estate & Housing": "🏠",
    "Business & Productivity": "📈",
    "Sports & Fitness": "🏋️‍♂️",
    "Government & Politics": "🏛",
    "Automotive": "🚗",
    "Gaming": "🎮",
    "Science & Research": "🔬",
    "Travel & Tourism": "✈️",
    "Ads & Trackers": "📊",
    Uncategorized: "❓",
  };

  // Sort data from most to least duration
  const sortedData = [...data].sort((a, b) => b.duration - a.duration);

  // Add emojis to category labels
  const labeledData = sortedData.map((item) => ({
    ...item,
    category: `${emojiMap[item.category] || ""} ${item.category}`,
  }));

  // Style bars dynamically
  const renderBar = (props) => {
    const { x, y, width, height, payload } = props;
    const isUncategorized = payload.category.includes("Uncategorized");
    const barColor = isUncategorized ? "#999" : "url(#categoryGradient)";
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={barColor}
        rx={4}
        ry={4}
      />
    );
  };

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
      {/* Animated Label */}
      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "1.2rem",
          color: "#ffffff",
          textShadow: "0 0 6px rgba(255, 255, 255, 0.3)",
        }}
      >
        Your Most Visited Categories
      </h2>

      {/* Animated Chart Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          width: "95%",
          height: 320,
          maxWidth: 640,
          zIndex: 1,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 12,
          padding: "1rem",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={labeledData} layout="vertical">
            <defs>
              <linearGradient id="categoryGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              type="number"
              domain={[0, domainMax]}
              tickFormatter={(val) => `${Math.round(val / 60000)}m`}
              stroke="#ccc"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="category"
              stroke="#ccc"
              fontSize={12}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="duration"
              radius={[0, 6, 6, 0]}
              animationDuration={900}
              shape={renderBar}
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Caption */}
      <p
        style={{
          marginTop: "0.8rem",
          fontSize: "0.75rem",
          color: "#aaa",
          textShadow: "0 0 4px #000",
        }}
      >
        Based on your browsing activity across categories
      </p>
    </div>
  );
};

export default TopCategoriesChart;
