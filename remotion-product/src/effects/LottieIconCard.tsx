/**
 * Demo: LottieIconCard — News categories with animated Lottie icons
 *
 * 使用 Lottie 动画为新闻分类添加动态图标
 */
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import { Lottie } from "@remotion/lottie";
import { interpolate, spring, useVideoConfig } from "remotion";

interface LottieIconCardProps {
  category: string;
  title: string;
  lottieUrl: string;
  accentColor?: string;
  frameOffset?: number;
}

export const LottieIconCard: React.FC<LottieIconCardProps> = ({
  category,
  title,
  lottieUrl,
  accentColor = "#007AFF",
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender());
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(lottieUrl)
      .then((r) => r.json())
      .then((data) => {
        setAnimationData(data);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle, lottieUrl]);

  const cardSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const labelProgress = interpolate(frame - frameOffset - 10, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000000",
      }}
    >
      <div
        style={{
          backgroundColor: "#1C1C1E",
          borderRadius: 24,
          padding: "40px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          opacity: cardSpring,
          transform: `scale(${interpolate(cardSpring, [0, 1], [0.8, 1])})`,
          borderTop: `4px solid ${accentColor}`,
        }}
      >
        {/* Lottie icon */}
        {animationData && (
          <div style={{ width: 80, height: 80 }}>
            <Lottie animationData={animationData} loop playbackRate={1} />
          </div>
        )}

        {/* Category label */}
        <div
          style={{
            fontSize: 14,
            color: accentColor,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: labelProgress,
          }}
        >
          {category}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 32,
            color: "#ffffff",
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            fontWeight: 700,
            textAlign: "center",
            opacity: labelProgress,
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default LottieIconCard;