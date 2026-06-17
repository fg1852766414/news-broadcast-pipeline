/**
 * OpeningTitle - The opening sequence of the news broadcast.
 *
 * Features:
 * - Dark gradient background with animated particles (subtle moving dots)
 * - Date display with slide-in effect
 * - Seendance-styled main title (character-by-character spring animation)
 * - Subtitle fade-in with decorative line
 * - Seendance rhythmic entrance of all elements
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { SeendanceText } from "./SeendanceText";
import { useSlideIn, useTextReveal } from "../styles/seendance";

interface OpeningTitleProps {
  date: string;
  title: string;
  subtitle: string;
}

// Subtle animated background particles
const Particles: React.FC = () => {
  const frame = useCurrentFrame();

  // Generate 20 random dots that drift upward slowly
  const dots = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 137.5;
    const x = ((seed * 7.3 + 11) % 100);
    const y = ((seed * 3.7 + frame * 0.05 + 50) % 100);
    const size = ((seed * 2.1) % 3) + 1;
    const opacity = ((seed * 1.7 + frame * 0.01) % 0.4) + 0.1;

    return { x, y, size, opacity };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            opacity: dot.opacity,
          }}
        />
      ))}
    </div>
  );
};

// Animated decorative line that draws from center outward
const DecorativeLine: React.FC<{ frameOffset: number }> = ({ frameOffset }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame - frameOffset,
    [0, 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    },
  );

  return (
    <div
      style={{
        width: `${progress * 200}px`,
        height: 3,
        background: "linear-gradient(90deg, transparent, #ff6b35, #ffd700, #ff6b35, transparent)",
        margin: "20px auto",
        borderRadius: 2,
        opacity: progress,
      }}
    />
  );
};

export const OpeningTitle: React.FC<OpeningTitleProps> = ({
  date,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const dateAnim = useSlideIn(0, 30);
  const subtitleReveal = useTextReveal(45);

  // Background gradient shift over time
  const bgShift = interpolate(frame, [0, 90], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg,
          ${Math.round(interpolate(bgShift, [0, 1], [15, 10]))}% #0a0a2e,
          ${Math.round(interpolate(bgShift, [0, 1], [50, 40]))}% #1a1a4e,
          ${Math.round(interpolate(bgShift, [0, 1], [85, 90]))}% #0d0d3d)`,
        overflow: "hidden",
      }}
    >
      {/* Background particles */}
      <Particles />

      {/* Content container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
        }}
      >
        {/* Date display */}
        <div
          style={{
            fontSize: 18,
            color: "#8899cc",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: dateAnim.opacity,
            transform: `translateY(${dateAnim.y}px)`,
            marginBottom: 30,
          }}
        >
          {date}
        </div>

        {/* Decorative top line */}
        <div
          style={{
            width: 60,
            height: 2,
            backgroundColor: "#ff6b35",
            marginBottom: 20,
            opacity: dateAnim.opacity,
            transform: `translateY(${dateAnim.y}px)`,
          }}
        />

        {/* Main title with seendance character animation */}
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <SeendanceText
            text={title}
            fontSize={64}
            color="#ffffff"
            frameOffset={20}
            staggerFrames={3}
          />
        </div>

        {/* Decorative line */}
        <DecorativeLine frameOffset={25 + title.length * 3} />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "#aabbdd",
            fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
            fontWeight: 300,
            letterSpacing: 6,
            opacity: subtitleReveal.opacity,
            filter: `blur(${subtitleReveal.blur}px)`,
            marginTop: 10,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default OpeningTitle;