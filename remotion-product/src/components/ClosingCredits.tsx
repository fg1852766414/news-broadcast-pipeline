/**
 * ClosingCredits - The closing/ending sequence of the news broadcast.
 *
 * Features:
 * - Fade-to-dark transition
 * - Summary of broadcast
 * - Seendance-style closing message
 * - "Produced by Horizon" branding
 * - Subtle gradient animation
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { SeendanceText } from "./SeendanceText";
import { useTextReveal, useSlideIn } from "../styles/seendance";

interface ClosingCreditsProps {
  date: string;
  closingText: string;
  totalNewsItems: number;
}

export const ClosingCredits: React.FC<ClosingCreditsProps> = ({
  date,
  closingText,
  totalNewsItems,
}) => {
  const frame = useCurrentFrame();

  // Overall fade-in of the closing scene
  const sceneOpacity = interpolate(frame, [0, 20, 60, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.ease,
  });

  const titleReveal = useTextReveal(5);
  const summarySlide = useSlideIn(25, 40);
  const brandingSlide = useSlideIn(50, 30);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a0a1e 0%, #050510 100%)",
        justifyContent: "center",
        alignItems: "center",
        opacity: sceneOpacity,
      }}
    >
      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Closing message with seendance */}
        <div
          style={{
            fontSize: 36,
            opacity: titleReveal.opacity,
            filter: `blur(${titleReveal.blur}px)`,
            textAlign: "center",
          }}
        >
          <SeendanceText
            text={closingText}
            fontSize={48}
            color="#ffffff"
            frameOffset={10}
            staggerFrames={4}
          />
        </div>

        {/* Decorative separator */}
        <div
          style={{
            width: 100,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #ff6b35, #ffd700, transparent)",
            marginTop: 20,
            opacity: summarySlide.opacity,
            transform: `translateY(${summarySlide.y}px)`,
          }}
        />

        {/* Summary line */}
        <div
          style={{
            fontSize: 16,
            color: "#8899bb",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 3,
            opacity: summarySlide.opacity,
            transform: `translateY(${summarySlide.y}px)`,
            marginTop: 10,
          }}
        >
          今日共为您呈现 {totalNewsItems} 条新闻
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 14,
            color: "#667799",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 2,
            opacity: summarySlide.opacity * 0.7,
            transform: `translateY(${summarySlide.y}px)`,
          }}
        >
          {date}
        </div>

        {/* Branding */}
        <div
          style={{
            marginTop: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: brandingSlide.opacity,
            transform: `translateY(${brandingSlide.y}px)`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#445577",
              fontFamily: "'Courier New', monospace",
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            Produced by
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#ff6b35",
              fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
              fontWeight: 700,
              letterSpacing: 8,
            }}
          >
            HORIZON
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#334466",
              fontFamily: "'Courier New', monospace",
              letterSpacing: 3,
              marginTop: 4,
            }}
          >
            POWERED BY REMOTION
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ClosingCredits;