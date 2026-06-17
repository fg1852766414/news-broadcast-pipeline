/**
 * Seendance-style animation utilities.
 *
 * "Seendance" refers to rhythmic, musical, beat-synced text animations
 * where words or characters enter the frame with staggered timing,
 * creating a dynamic, choreographed visual flow.
 *
 * These helpers provide spring-based and easing-based animations
 * that can be applied to individual text elements or groups.
 */
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  interpolate,
} from "remotion";

/**
 * Calculates a staggered per-character or per-word opacity/transform value.
 *
 * @param index - The index of the current character/word in the sequence
 * @param totalItems - Total number of items in the sequence
 * @param frameOffset - Global frame offset for the animation
 * @param fps - Frames per second from the video config
 * @returns spring value (0..1) for the given index
 */
export const useSeendanceSpring = (
  index: number,
  totalItems: number,
  frameOffset: number = 0,
  fps: number = 30,
): number => {
  const frame = useCurrentFrame();
  const { fps: configFps } = useVideoConfig();

  const effectiveFps = fps ?? configFps;

  // Each character/word gets a staggered delay of ~3 frames
  const staggerDelay = 3;
  const delay = frameOffset + index * staggerDelay;

  return spring({
    frame: frame - delay,
    fps: effectiveFps,
    config: {
      damping: 12,
      stiffness: 80,
      mass: 0.5,
    },
  });
};

/**
 * Creates a "seendance" scale + opacity effect for a group of items
 * that should appear one after another in a rhythmic fashion.
 *
 * @param index - Index within the group
 * @param frameOffset - Global frame offset
 * @param fps - Frames per second
 * @returns { scale, opacity } values
 */
export const useSeendanceScale = (
  index: number,
  frameOffset: number = 0,
  fps: number = 30,
): { scale: number; opacity: number } => {
  const springVal = useSeendanceSpring(index, 1, frameOffset, fps);

  return {
    scale: interpolate(springVal, [0, 1], [0.8, 1]),
    opacity: springVal,
  };
};

/**
 * Creates a smooth slide-in-from-bottom effect with easing.
 * Good for title/subtitle entrances.
 */
export const useSlideIn = (
  frameOffset: number = 0,
  slideDistance: number = 50,
): { y: number; opacity: number } => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame - frameOffset,
    [0, 25],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  return {
    y: interpolate(progress, [0, 1], [slideDistance, 0]),
    opacity: progress,
  };
};

/**
 * Creates a text reveal effect where the text fades in with a slight blur.
 */
export const useTextReveal = (
  frameOffset: number = 0,
): { opacity: number; blur: number } => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame - frameOffset,
    [0, 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    },
  );

  return {
    opacity: progress,
    blur: interpolate(progress, [0, 1], [8, 0]),
  };
};

/**
 * Creates a pulsing glow effect for emphasis.
 */
export const usePulseGlow = (
  frameOffset: number = 0,
): { glowIntensity: number } => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(((frame - frameOffset) * Math.PI * 2) / 30) * 0.3 + 0.7;

  return {
    glowIntensity: pulse,
  };
};

/**
 * Renders a single character or word with a seendance (staggered spring) animation.
 * Used by the SeendanceText component.
 */
export const useCharSpring = (
  charIndex: number,
  frameOffset: number = 0,
  staggerFrames: number = 2,
): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return spring({
    frame: frame - frameOffset - charIndex * staggerFrames,
    fps,
    config: {
      damping: 14,
      stiffness: 100,
      mass: 0.4,
    },
  });
};