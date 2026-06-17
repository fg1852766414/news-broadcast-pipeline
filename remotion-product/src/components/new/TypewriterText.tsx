/**
 * TypewriterText - Character-by-character reveal animation.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface TypewriterTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  frameOffset?: number;
  charsPerFrame?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  fontSize = 32,
  color = "#ffffff",
  frameOffset = 0,
  charsPerFrame = 2,
}) => {
  const frame = useCurrentFrame();
  const charCount = Math.max(
    0,
    Math.floor((frame - frameOffset) * charsPerFrame)
  );
  const visibleChars = text.slice(0, charCount);
  const isComplete = charCount >= text.length;

  return (
    <span
      style={{
        fontSize,
        fontWeight: 600,
        color,
        fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
        whiteSpace: "pre-wrap",
      }}
    >
      {visibleChars}
      {!isComplete && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: fontSize * 0.8,
            backgroundColor: color,
            marginLeft: 2,
            opacity: interpolate(frame % 12, [0, 6, 12], [1, 0, 1]),
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};

export default TypewriterText;