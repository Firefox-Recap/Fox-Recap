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

// === Formatter Functions ===
const formatHourLabel = (hour) => {
  const h = parseInt(hour, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${suffix}`;
};

const formatDuration = (ms) => {
  const mins = Math.floor(ms / 60000);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hrs}h ${rem}m`;
  }
  return `${mins} min`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const { hour, duration } = payload[0].payload;
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
        <strong>{formatHourLabel(hour)}</strong>
        <div>{formatDuration(duration)}</div>
      </div>
    );
  }
  return null;
};

const AnalyticsChartSlide = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-white bg-gray-800"
        style={{ width: "100%", height: "100%" }}
      >
        No peak hour data available.
      </div>
    );
  }

  const maxDuration = Math.max(...data.map((d) => d.duration));
  const domainMax = maxDuration > 0 ? maxDuration + 30000 : "auto";

  const peak = data.reduce(
    (max, curr) => (curr.duration > max.duration ? curr : max),
    { hour: 0, duration: 0 }
  );

  const peakHourLabel = formatHourLabel(peak.hour);
  const peakDurationLabel = formatDuration(peak.duration);

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
      {/* Glow Behind */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, #3b82f633 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Animated Peak Label */}
      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: "1.2rem",
          color: "#ffffff",
          animation: "pulseGlow 2.8s ease-in-out infinite",
          zIndex: 1,
        }}
      >
        Peak usage at {peakHourLabel} — {peakDurationLabel}
      </h2>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ width: "95%", height: 300, maxWidth: 720, zIndex: 1 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <defs>
              <linearGradient id="coolGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="peakBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourLabel}
              stroke="#ccc"
              fontSize={12}
            />
            <YAxis
              domain={[0, domainMax]}
              tickFormatter={(val) => `${Math.round(val / 60000)}m`}
              stroke="#ccc"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="duration"
              radius={[4, 4, 0, 0]}
              animationDuration={1000}
              fill="#60a5fa"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }}
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                const barColor =
                  payload.hour === peak.hour ? "url(#peakBar)" : "url(#coolGradient)";
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
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Microcopy */}
      <p
        style={{
          marginTop: "0.8rem",
          fontSize: "0.75rem",
          color: "#ccc",
          textShadow: "0 0 4px #000",
          zIndex: 1,
        }}
      >
        Based on active tab duration over the selected period
      </p>

      {/* Glow keyframes */}
      <style>
        {`
          @keyframes pulseGlow {
            0% { text-shadow: 0 0 6px #fff; }
            50% { text-shadow: 0 0 16px #60a5fa; }
            100% { text-shadow: 0 0 6px #fff; }
          }
        `}
      </style>
    </div>
  );
};

export default AnalyticsChartSlide;
