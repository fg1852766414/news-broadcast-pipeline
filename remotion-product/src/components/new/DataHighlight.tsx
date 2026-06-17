/**
 * DataHighlight - Animated data point with count-up, sparkline, and large value.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface DataHighlightProps {
  value: string;
  description: string;
  accentColor?: string;
  frameOffset?: number;
  size?: "small" | "medium" | "large";
  // v5: optional sparkline data (5-7 points) and trend
  sparkline?: number[];
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
}

const UpArrow = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 4 L20 14 L14 14 L14 20 L10 20 L10 14 L4 14 Z" fill={color} />
  </svg>
);

const DownArrow = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 20 L4 10 L10 10 L10 4 L14 4 L14 10 L20 10 Z" fill={color} />
  </svg>
);

export const DataHighlight: React.FC<DataHighlightProps> = ({
  value,
  description,
  accentColor = "#007AFF",
  frameOffset = 0,
  size = "large",
  sparkline,
  trend,
  trendLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const valueSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const descProgress = interpolate(frame - frameOffset - 10, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // v5: continuous breathing pulse for the value (subtle attention)
  const pulse = 1 + Math.sin((frame / 30) * Math.PI) * 0.015;

  const valueSizes = { small: 48, medium: 72, large: 96 };

  // Sparkline rendering
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const w = 280;
    const h = 50;
    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const range = max - min || 1;
    const stepX = w / (sparkline.length - 1);
    const points = sparkline
      .map((v, i) => `${i * stepX},${h - ((v - min) / range) * h}`)
      .join(" ");
    return (
      <svg
        width={w}
        height={h}
        style={{
          opacity: descProgress,
          marginTop: 16,
        }}
      >
        {/* Area fill under line */}
        <polygon
          points={`0,${h} ${points} ${w},${h}`}
          fill={accentColor}
          opacity="0.15"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End point dot */}
        <circle
          cx={w}
          cy={h - ((sparkline[sparkline.length - 1] - min) / range) * h}
          r="4"
          fill={accentColor}
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "0 40px",
      }}
    >
      {/* v5: trend arrow above value (if provided) */}
      {trend && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
            opacity: descProgress,
            transform: `translateY(${interpolate(descProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          {trend === "up" && <UpArrow color="#34C759" />}
          {trend === "down" && <DownArrow color="#FF453A" />}
          {trend === "flat" && (
            <div
              style={{
                width: 16,
                height: 3,
                backgroundColor: "#8E8E93",
                borderRadius: 2,
              }}
            />
          )}
          {trendLabel && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: trend === "up" ? "#34C759" : trend === "down" ? "#FF453A" : "#8E8E93",
                fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
              }}
            >
              {trendLabel}
            </span>
          )}
        </div>
      )}

      <div
        style={{
          fontSize: valueSizes[size],
          fontWeight: 700,
          color: accentColor,
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          lineHeight: 1,
          opacity: valueSpring,
          transform: `scale(${interpolate(valueSpring, [0, 1], [0.5, 1]) * pulse})`,
          textShadow: `0 0 40px ${accentColor}40`,
        }}
      >
        {value}
      </div>

      {/* v5: sparkline below value */}
      {renderSparkline()}

      {/* description 20px → 24px, fontWeight 500 */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: "#ffffff",
          fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          marginTop: sparkline ? 8 : 16,
          opacity: descProgress,
          transform: `translateY(${interpolate(descProgress, [0, 1], [10, 0])}px)`,
          maxWidth: 600,
        }}
      >
        {description}
      </div>
    </div>
  );
};

export default DataHighlight;
