/**
 * SlideTransition - Slide-in transition from configurable direction.
 */
import React, { ReactNode } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface SlideTransitionProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  distance?: number;
  frameOffset?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  direction = "up",
  distance = 50,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const dirMap = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
  };

  const offset = dirMap[direction];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity: slideSpring,
        transform: `translate(${interpolate(slideSpring, [0, 1], [offset.x, 0])}px, ${interpolate(slideSpring, [0, 1], [offset.y, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

export default SlideTransition;