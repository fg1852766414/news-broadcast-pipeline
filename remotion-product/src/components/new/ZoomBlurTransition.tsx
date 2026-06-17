/**
 * ZoomBlurTransition - Zoom-in with blur effect transition.
 */
import React, { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ZoomBlurTransitionProps {
  children: ReactNode;
  frameOffset?: number;
  zoomIn?: boolean;
}

export const ZoomBlurTransition: React.FC<ZoomBlurTransitionProps> = ({
  children,
  frameOffset = 0,
  zoomIn = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const scale = zoomIn
    ? interpolate(zoomSpring, [0, 1], [0.8, 1])
    : interpolate(zoomSpring, [0, 1], [1.2, 1]);

  const blur = interpolate(zoomSpring, [0, 0.5, 1], [8, 2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        opacity: zoomSpring,
      }}
    >
      {children}
    </div>
  );
};

export default ZoomBlurTransition;