/**
 * FadeTransition - Simple fade-in transition wrapper.
 */
import React, { ReactNode } from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";

interface FadeTransitionProps {
  children: ReactNode;
  frameOffset?: number;
  duration?: number;
  initial?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  frameOffset = 0,
  duration = 20,
  initial = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - frameOffset, [0, duration], [initial, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.ease,
  });

  return (
    <div
      style={{
        opacity,
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
};

export default FadeTransition;