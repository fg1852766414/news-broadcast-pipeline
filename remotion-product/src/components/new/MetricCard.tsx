/**
 * MetricCard - Single KPI metric card with value and label.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface MetricCardProps {
  value: string;
  label: string;
  unit?: string;
  accentColor?: string;
  frameOffset?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  value,
  label,
  unit,
  accentColor = "#007AFF",
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const valueProgress = interpolate(frame - frameOffset - 5, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        backgroundColor: "#1C1C1E",
        borderRadius: 16,
        padding: "24px 20px",
        textAlign: "center",
        minWidth: 160,
        opacity: cardSpring,
        transform: `scale(${interpolate(cardSpring, [0, 1], [0.85, 1])})`,
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: accentColor,
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          lineHeight: 1,
          opacity: valueProgress,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 18, color: "#8E8E93", marginLeft: 4 }}>{unit}</span>
        )}
      </div>
      {/* v3 review fix: label 14px → 16px, color #8E8E93 → #B0B0B5 for contrast */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "#B0B0B5",
          fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          marginTop: 10,
          opacity: valueProgress,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default MetricCard;