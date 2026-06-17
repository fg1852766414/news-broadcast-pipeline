/**
 * CommentBubble - Single comment bubble with avatar and text.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface CommentBubbleProps {
  author: string;
  text: string;
  avatarColor?: string;
  frameOffset?: number;
  isHighlighted?: boolean;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  author,
  text,
  avatarColor = "#007AFF",
  frameOffset = 0,
  isHighlighted = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bubbleSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "0 40px",
        maxWidth: 800,
        margin: "0 auto",
        opacity: bubbleSpring,
        transform: `translateX(${interpolate(bubbleSpring, [0, 1], [-20, 0])}px)`,
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: avatarColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>
          {author[0]?.toUpperCase() || "?"}
        </span>
      </div>
      <div
        style={{
          backgroundColor: isHighlighted ? "#0A2A4A" : "#1C1C1E",
          borderRadius: 12,
          padding: "12px 16px",
          border: isHighlighted ? `1px solid ${avatarColor}` : "none",
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: avatarColor,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            marginBottom: 4,
          }}
        >
          {author}
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#ffffff",
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            lineHeight: 1.5,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default CommentBubble;