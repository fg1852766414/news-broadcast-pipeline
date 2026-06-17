/**
 * SeendanceText - A component that renders text with rhythmic character-by-character
 * animation, creating a musical/choreographed entrance effect (seendance style).
 *
 * Each character springs in with a staggered delay, creating a wave-like reveal.
 */
import React from "react";
import { interpolate } from "remotion";
import { useCharSpring } from "../styles/seendance";

interface SeendanceTextProps {
  text: string;
  style?: React.CSSProperties;
  frameOffset?: number;
  staggerFrames?: number;
  fontSize?: number;
  color?: string;
}

export const SeendanceText: React.FC<SeendanceTextProps> = ({
  text,
  style,
  frameOffset = 0,
  staggerFrames = 2,
  fontSize = 48,
  color = "#ffffff",
}) => {
  // Split text into individual characters (preserve spaces)
  const chars = text.split("");

  return (
    <span
      style={{
        display: "inline",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    >
      {chars.map((char, i) => {
        const springVal = useCharSpring(i, frameOffset, staggerFrames);
        const opacity = springVal;
        const scale = interpolate(springVal, [0, 1], [0.3, 1]);
        const translateY = interpolate(springVal, [0, 1], [30, 0]);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              fontSize,
              color,
              fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
              fontWeight: 700,
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {char === " " ? " " : char}
          </span>
        );
      })}
    </span>
  );
};

export default SeendanceText;