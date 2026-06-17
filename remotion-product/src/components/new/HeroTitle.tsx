/**
 * HeroTitle - Large hero title for video opening scenes.
 * Apple style: SF Pro Display, 120px, white on black.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface HeroTitleProps {
  title: string;
  subtitle?: string;
  frameOffset?: number;
}

export const HeroTitle: React.FC<HeroTitleProps> = ({
  title,
  subtitle,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame - frameOffset, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleProgress = interpolate(frame - frameOffset - 15, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <h1
        style={{
          fontSize: 120,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          margin: 0,
          padding: "0 60px",
          textAlign: "center",
          lineHeight: 1.1,
          opacity: progress,
          transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
        }}
      >
        {title}
      </h1>
      {/* Blue accent line */}
      <div
        style={{
          width: 80,
          height: 3,
          backgroundColor: "#007AFF",
          borderRadius: 2,
          marginTop: 20,
          opacity: subtitleProgress,
          transform: `translateY(${interpolate(subtitleProgress, [0, 1], [10, 0])}px)`,
        }}
      />
      {subtitle && (
        <p
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: "#8E8E93",
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            margin: "24px 0 0",
            opacity: subtitleProgress,
            transform: `translateY(${interpolate(subtitleProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default HeroTitle;