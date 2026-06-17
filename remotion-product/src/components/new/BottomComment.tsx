/**
 * BottomComment - Bottom-anchored comment card showing community feedback.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface BottomCommentProps {
  text: string;
  author: string;
  accentColor?: string;
  frameOffset?: number;
}

export const BottomComment: React.FC<BottomCommentProps> = ({
  text,
  author,
  accentColor = "#AF52DE",
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideUp = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 40px 30px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
        transform: `translateY(${interpolate(slideUp, [0, 1], [100, 0])}px)`,
        opacity: slideUp,
      }}
    >
      <div
        style={{
          backgroundColor: "#1C1C1E",
          borderRadius: 12,
          padding: "14px 18px",
          borderLeft: `3px solid ${accentColor}`,
          maxWidth: 700,
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: "#ffffff",
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            lineHeight: 1.5,
            fontStyle: "italic",
          }}
        >
          {text}
        </div>
        <div
          style={{
            fontSize: 13,
            color: accentColor,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            marginTop: 8,
            fontWeight: 600,
          }}
        >
          {author}
        </div>
      </div>
    </div>
  );
};

export default BottomComment;