/**
 * CommentBarrage - Scrolling comment barrage (danmaku-style) overlay.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface BarrageItem {
  author: string;
  text: string;
}

interface CommentBarrageProps {
  comments: BarrageItem[];
  frameOffset?: number;
}

export const CommentBarrage: React.FC<CommentBarrageProps> = ({
  comments,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {comments.map((comment, i) => {
        const speed = 120 + (i % 3) * 40;
        const x = interpolate(
          (frame - frameOffset) % speed,
          [0, speed],
          [1920, -800]
        );
        const y = 80 + (i % 6) * 60;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: 20,
              padding: "6px 14px",
              whiteSpace: "nowrap",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#007AFF",
                fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
              }}
            >
              {comment.author}
            </span>
            <span
              style={{
                fontSize: 14,
                color: "#ffffff",
                fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
              }}
            >
              {comment.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CommentBarrage;