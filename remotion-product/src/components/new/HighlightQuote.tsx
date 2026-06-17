/**
 * HighlightQuote - Emphasized pull quote with giant quote mark and author avatar.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface HighlightQuoteProps {
  quote: string;
  author?: string;
  authorAvatar?: string; // Optional single character to show in avatar circle
  accentColor?: string;
  frameOffset?: number;
  fontSize?: number;
}

export const HighlightQuote: React.FC<HighlightQuoteProps> = ({
  quote,
  author,
  authorAvatar,
  accentColor = "#007AFF",
  frameOffset = 0,
  fontSize = 36,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  // v5: avatar color from accent (use first char of author if no avatar given)
  const avatarChar = authorAvatar || (author ? author[0] : "•");
  const avatarBg = `linear-gradient(135deg, ${accentColor} 0%, #5856D6 100%)`;

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        padding: "0 60px",
        maxWidth: 900,
        margin: "0 auto",
        alignItems: "stretch",
        opacity: quoteSpring,
        transform: `translateY(${interpolate(quoteSpring, [0, 1], [30, 0])}px)`,
      }}
    >
      {/* v5: Left accent bar with giant quote mark on top */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        {/* Giant " character */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: accentColor,
            lineHeight: 0.7,
            fontFamily: '"Georgia", "Times New Roman", serif',
            opacity: quoteSpring,
            transform: `scale(${interpolate(quoteSpring, [0, 1], [0.3, 1])})`,
            textShadow: `0 0 30px ${accentColor}60`,
          }}
        >
          "
        </div>
        {/* Vertical accent bar */}
        <div
          style={{
            width: 4,
            flex: 1,
            borderRadius: 2,
            backgroundColor: accentColor,
            opacity: quoteSpring,
            minHeight: 80,
          }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p
          style={{
            fontSize,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            lineHeight: 1.3,
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {quote}
        </p>
        {author && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 24,
              opacity: interpolate(frame - frameOffset - 20, [0, 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateX(${interpolate(
                frame - frameOffset - 20,
                [0, 20],
                [-20, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )}px)`,
            }}
          >
            {/* v5: Author avatar circle */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: avatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 700,
                color: "#ffffff",
                flexShrink: 0,
                boxShadow: `0 0 20px ${accentColor}50`,
              }}
            >
              {avatarChar}
            </div>
            <span
              style={{
                fontSize: 18,
                color: "#8E8E93",
                fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
              }}
            >
              {author}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightQuote;
