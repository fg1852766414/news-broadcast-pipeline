/**
 * Demo: LightLeak + MotionBlur Opening
 *
 * 电影级漏光开场 + 运动模糊标题
 * 为新闻广播视频增加高级视觉效果
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { LightLeak } from "@remotion/light-leaks";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { HeroTitle } from "../components/new/HeroTitle";

interface CinematicOpeningProps {
  date?: string;
  title?: string;
  subtitle?: string;
}

export const CinematicOpening: React.FC<CinematicOpeningProps> = ({
  date = "June 11, 2026",
  title = "Horizon News",
  subtitle = "Daily Broadcast",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Layer 1: Light leak background effect */}
      <LightLeak
        durationInFrames={90}
        seed={42}
        hueShift={10}
      />

      {/* Layer 2: Title with motion blur — frameOffset 0 (was 10) for t=0 visibility (v3 review fix) */}
      <CameraMotionBlur shutterAngle={200} samples={8}>
        <HeroTitle title={title} subtitle={date} frameOffset={0} />
      </CameraMotionBlur>

      {/* Layer 3: Bottom subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 18,
          color: "#8E8E93",
          fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          letterSpacing: 6,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

export default CinematicOpening;