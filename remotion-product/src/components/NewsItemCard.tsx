/**
 * NewsItemCard - A single news entry display component.
 *
 * Features:
 * - Category badge with color coding
 * - Seendance-style title reveal (character by character)
 * - Summary text fade-in with slide-up
 * - Decorative left border accent
 * - News source attribution
 * - Staggered entrance per news item (seendance rhythm)
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { SeendanceText } from "./SeendanceText";
import { useSeendanceScale, useTextReveal, useSlideIn } from "../styles/seendance";
import type { NewsItem } from "../data";

interface NewsItemCardProps {
  item: NewsItem;
  index: number; // which item in the sequence (0-based)
  totalItems: number;
}

// Category color mapping
const categoryColors: Record<string, string> = {
  top: "#ff6b35",
  tech: "#00b4d8",
  world: "#52b788",
  business: "#ffd700",
  science: "#c77dff",
};

// Category labels
const categoryLabels: Record<string, string> = {
  top: "头条",
  tech: "科技",
  world: "国际",
  business: "商业",
  science: "科学",
};

const NewsItemCard: React.FC<NewsItemCardProps> = ({
  item,
  index,
  totalItems,
}) => {
  // Each news item is visible for ~60 frames (2 seconds at 30fps),
  // with a stagger of 3 frames between items
  const itemDuration = 60;
  const staggerOffset = 5;
  const itemStartFrame = index * staggerOffset;
  const relativeFrame = useCurrentFrame() - itemStartFrame;

  const { scale, opacity } = useSeendanceScale(index, 0, 30);
  const summaryReveal = useTextReveal(20);

  // Slide in from the right
  const slideIn = useSlideIn(0, 80);

  // Current item's visibility: visible during its window
  const isVisible = relativeFrame >= 0 && relativeFrame < itemDuration + 15;

  if (!isVisible) {
    return null;
  }

  const accentColor = categoryColors[item.category] || "#ffffff";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 80px",
        background: `linear-gradient(135deg, #0d0d2b 0%, #1a1a3e 50%, #0d0d2b 100%)`,
        opacity: interpolate(
          relativeFrame,
          [0, 10, itemDuration, itemDuration + 15],
          [0, 1, 1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.ease,
          },
        ),
        transform: `scale(${scale})`,
      }}
    >
      {/* Background decorative element */}
      <div
        style={{
          position: "absolute",
          right: -100,
          top: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 900,
          position: "relative",
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            opacity: opacity,
            transform: `translateX(${(1 - opacity) * -30}px)`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: accentColor,
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: accentColor,
              fontFamily: "'Courier New', monospace",
              letterSpacing: 3,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {categoryLabels[item.category] || item.category}
          </span>
        </div>

        {/* Left accent bar */}
        <div
          style={{
            width: 4,
            height: 80,
            backgroundColor: accentColor,
            position: "absolute",
            left: -20,
            top: 60,
            borderRadius: 2,
            opacity: opacity,
          }}
        />

        {/* Title with seendance character animation */}
        <div style={{ marginBottom: 20, opacity }}>
          <SeendanceText
            text={item.title}
            fontSize={38}
            color="#ffffff"
            frameOffset={5}
            staggerFrames={2}
          />
        </div>

        {/* Summary text */}
        <div
          style={{
            fontSize: 20,
            color: "#c0c8e0",
            lineHeight: 1.7,
            fontFamily: "'Noto Sans SC', 'Microsoft YaHei', sans-serif",
            fontWeight: 300,
            opacity: summaryReveal.opacity,
            filter: `blur(${summaryReveal.blur}px)`,
            maxWidth: 800,
          }}
        >
          {item.summary}
        </div>

        {/* Source attribution */}
        <div
          style={{
            fontSize: 13,
            color: "#667799",
            fontFamily: "'Courier New', monospace",
            marginTop: 30,
            letterSpacing: 2,
            opacity: summaryReveal.opacity * 0.7,
          }}
        >
          {item.source ? `来源: ${item.source}` : ""}
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {Array.from({ length: totalItems }, (_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 24 : 8,
              height: 4,
              borderRadius: 2,
              backgroundColor:
                i === index ? accentColor : "rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default NewsItemCard;