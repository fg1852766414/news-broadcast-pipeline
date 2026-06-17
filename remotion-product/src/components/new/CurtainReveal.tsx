/**
 * CurtainReveal - Curtain opening effect that reveals content underneath.
 */
import React, { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface CurtainRevealProps {
  children: ReactNode;
  frameOffset?: number;
  curtainColor?: string;
}

export const CurtainReveal: React.FC<CurtainRevealProps> = ({
  children,
  frameOffset = 0,
  curtainColor = "#000000",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const curtainSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const leftClosed = interpolate(curtainSpring, [0, 1], [50, 0]);
  const rightClosed = interpolate(curtainSpring, [0, 1], [50, 0]);

  if (curtainSpring < 0.01) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: curtainColor,
        }}
      />
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Content */}
      <div style={{ opacity: curtainSpring, width: "100%", height: "100%" }}>
        {children}
      </div>

      {/* Left curtain */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${leftClosed}%`,
          height: "100%",
          backgroundColor: curtainColor,
          pointerEvents: "none",
        }}
      />
      {/* Right curtain */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: `${rightClosed}%`,
          height: "100%",
          backgroundColor: curtainColor,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CurtainReveal;