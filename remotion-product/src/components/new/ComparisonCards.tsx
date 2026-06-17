/**
 * ComparisonCards - Side-by-side comparison of two items (A vs B).
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ComparisonItem {
  title: string;
  items: string[];
  color?: string;
}

interface ComparisonCardsProps {
  left: ComparisonItem;
  right: ComparisonItem;
  frameOffset?: number;
}

export const ComparisonCards: React.FC<ComparisonCardsProps> = ({
  left,
  right,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const rightSpring = spring({
    frame: frame - frameOffset - 5,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const renderCard = (
    item: ComparisonItem,
    animVal: number,
    side: "left" | "right"
  ) => (
    <div
      style={{
        flex: 1,
        backgroundColor: "#1C1C1E",
        borderRadius: 16,
        padding: 24,
        opacity: animVal,
        transform: `translate${side === "left" ? "X" : "X"}(${interpolate(
          animVal,
          [0, 1],
          [side === "left" ? -30 : 30, 0]
        )}px)`,
        borderTop: `3px solid ${item.color || "#007AFF"}`,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          marginBottom: 16,
        }}
      >
        {item.title}
      </div>
      {item.items.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 0",
            borderBottom:
              i < item.items.length - 1 ? "1px solid #2C2C2E" : "none",
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: item.color || "#007AFF",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 14,
              color: "#e0e0e0",
              fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "0 40px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {renderCard(left, leftSpring, "left")}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 24,
          fontWeight: 700,
          color: "#8E8E93",
          fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        VS
      </div>
      {renderCard(right, rightSpring, "right")}
    </div>
  );
};

export default ComparisonCards;