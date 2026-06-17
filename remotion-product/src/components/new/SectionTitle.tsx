/**
 * SectionTitle - Section header title with Apple-style accent bar.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  frameOffset?: number;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  accentColor = "#007AFF",
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const titleProgress = interpolate(frame - frameOffset - 5, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0 60px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: interpolate(barSpring, [0, 1], [0, 60]),
          height: 4,
          borderRadius: 2,
          backgroundColor: accentColor,
          marginBottom: 16,
        }}
      />
      <h2
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          margin: 0,
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontSize: 24,
            color: "#8E8E93",
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            margin: "8px 0 0",
            opacity: titleProgress,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;