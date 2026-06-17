/**
 * LightSweep - Light sweep/shine effect that moves across the content.
 */
import React, { ReactNode } from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface LightSweepProps {
  children: ReactNode;
  frameOffset?: number;
  duration?: number;
  color?: string;
}

export const LightSweep: React.FC<LightSweepProps> = ({
  children,
  frameOffset = 0,
  duration = 40,
  color = "rgba(255,255,255,0.08)",
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    (frame - frameOffset) % duration,
    [0, duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            90deg,
            transparent 0%,
            transparent ${interpolate(progress, [0, 1], [0, 40])}%,
            ${color} ${interpolate(progress, [0, 1], [40, 60])}%,
            transparent ${interpolate(progress, [0, 1], [60, 100])}%
          )`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default LightSweep;