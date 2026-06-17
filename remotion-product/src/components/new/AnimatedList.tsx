/**
 * AnimatedList - Staggered list items with slide-in animation + SVG icons.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ListItem {
  icon?: "rocket" | "brain" | "chart" | "code" | "lightbulb" | "shield" | "news" | "default";
  text: string;
  subtext?: string;
}

interface AnimatedListProps {
  items: ListItem[];
  frameOffset?: number;
  itemDelay?: number;
  accentColor?: string;
}

// Inline SVG icons (32×32) — no emoji per design system
const IconMap: Record<string, React.ReactNode> = {
  rocket: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L8 9 L12 7 L16 9 Z" fill="currentColor" />
      <path d="M8 9 L4 14 L7 13 L9 12 Z" fill="currentColor" opacity="0.6" />
      <path d="M16 9 L20 14 L17 13 L15 12 Z" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="11" r="1.5" fill="#000" />
    </svg>
  ),
  brain: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 3 C5 3 3 6 4 9 C2 11 3 14 6 14 C6 17 9 18 11 16 L11 21 L13 21 L13 16 C15 18 18 17 18 14 C21 14 22 11 20 9 C21 6 19 3 15 3 C13 3 11 4 11 5 C11 4 9 3 9 3 Z" fill="currentColor" />
    </svg>
  ),
  chart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="13" width="4" height="8" fill="currentColor" opacity="0.6" />
      <rect x="10" y="8" width="4" height="13" fill="currentColor" opacity="0.8" />
      <rect x="17" y="3" width="4" height="18" fill="currentColor" />
    </svg>
  ),
  code: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M9 5 L4 12 L9 19" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M15 5 L20 12 L15 19" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  lightbulb: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 C7 3 5 7 7 11 C8 13 9 14 9 16 L15 16 C15 14 16 13 17 11 C19 7 17 3 12 3 Z" fill="currentColor" />
      <rect x="9" y="17" width="6" height="2" rx="1" fill="currentColor" />
      <rect x="10" y="20" width="4" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L4 5 L4 12 C4 17 8 21 12 22 C16 21 20 17 20 12 L20 5 Z" fill="currentColor" />
      <path d="M8 12 L11 15 L16 9" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  news: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" />
      <rect x="6" y="7" width="12" height="2" rx="1" fill="#000" />
      <rect x="6" y="11" width="8" height="1.5" rx="0.75" fill="#000" opacity="0.6" />
      <rect x="6" y="14" width="10" height="1.5" rx="0.75" fill="#000" opacity="0.6" />
    </svg>
  ),
  default: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  ),
};

export const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  frameOffset = 0,
  itemDelay = 8,
  accentColor = "#007AFF",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        gap: 0,
      }}
    >
      {items.map((item, i) => {
        const itemSpring = spring({
          frame: frame - frameOffset - i * itemDelay,
          fps,
          config: { damping: 25, stiffness: 100 },
        });
        const visible = frame - frameOffset - i * itemDelay > 0;
        const isFirst = i === 0; // v3 review: highlight first/featured news
        const iconKey = item.icon || "default";
        const IconComponent = IconMap[iconKey];

        if (!visible) return null;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "16px 0",
              borderBottom: i < items.length - 1 ? "1px solid #2C2C2E" : "none",
              opacity: itemSpring,
              transform: `translateX(${interpolate(itemSpring, [0, 1], [-30, 0])}px)`,
            }}
          >
            {/* v5 upgrade: SVG icon instead of dot */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: isFirst ? "rgba(0, 122, 255, 0.15)" : "rgba(255, 255, 255, 0.06)",
                color: isFirst ? "#007AFF" : "#8E8E93",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {IconComponent}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: isFirst ? 24 : 20,
                  fontWeight: isFirst ? 700 : 600,
                  color: isFirst ? "#007AFF" : "#ffffff",
                  fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                }}
              >
                {item.text}
              </div>
              {item.subtext && (
                <div
                  style={{
                    fontSize: isFirst ? 16 : 15,
                    color: "#8E8E93",
                    fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                    marginTop: 4,
                  }}
                >
                  {item.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedList;