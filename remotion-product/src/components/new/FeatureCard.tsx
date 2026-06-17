/**
 * FeatureCard - Single feature card with icon, title, and description.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: string;
  accentColor?: string;
  frameOffset?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
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

  return (
    <div
      style={{
        backgroundColor: "#1C1C1E",
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 360,
        boxSizing: "border-box",
        opacity: cardSpring,
        transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
      }}
    >
      {/* Accent top bar */}
      <div
        style={{
          width: 40,
          height: 3,
          borderRadius: 2,
          backgroundColor: accentColor,
          marginBottom: 16,
        }}
      />
      <h3
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 15,
          color: "#8E8E93",
          fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          lineHeight: 1.5,
          margin: "8px 0 0",
        }}
      >
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;