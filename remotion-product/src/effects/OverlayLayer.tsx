/**
 * OverlayLayer - Persistent top/bottom bars + background decoration.
 *
 * z-index layers:
 *   - 0  : background decoration (Circle, Star)
 *   - 10 : TransitionSeries (scene content)
 *   - 20 : top bar, bottom bar (this component)
 *
 * Animations driven by useCurrentFrame() + spring() (damping: 25, stiffness: 100).
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface OverlaySegment {
  id: string;
  startFrame: number;
  endFrame: number;
}

interface OverlayLayerProps {
  totalFrames: number;
  segments: OverlaySegment[];
  projectName: string;
  date: string;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({
  totalFrames,
  segments,
  projectName,
  date,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Top bar entrance: spring from -60 to 0 (slides in from top)
  const topBarSpring = spring({
    frame,
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const topBarY = interpolate(topBarSpring, [0, 1], [-60, 0]);

  // Bottom bar entrance: spring from +80 to 0 (slides in from bottom)
  const bottomBarSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 25, stiffness: 100 },
  });
  const bottomBarY = interpolate(bottomBarSpring, [0, 1], [80, 0]);

  // Progress bar (0 to 1 of total duration)
  const progress = Math.min(1, Math.max(0, frame / totalFrames));

  // Current segment index
  let currentSegmentIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    if (frame >= segments[i].startFrame && frame < segments[i].endFrame) {
      currentSegmentIndex = i;
      break;
    }
    if (i === segments.length - 1 && frame >= segments[i].endFrame) {
      currentSegmentIndex = i;
    }
  }
  const segmentLabel = `${currentSegmentIndex + 1}/${segments.length}`;

  // (corner decorations removed per v3 review)

  return (
    <>
      {/* === z-index 0: Background decoration (removed 4 corner shapes per v3 review) === */}

      {/* === z-index 20: Top bar === */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          zIndex: 20,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #2C2C2E",
          transform: `translateY(${topBarY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Channel name with logo dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "#007AFF",
            }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: 0.5,
            }}
          >
            {projectName}
          </span>
          <span
            style={{
              fontSize: 14,
              color: "#8E8E93",
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            {date}
          </span>
        </div>

        {/* Progress bar — bumped 3px → 8px for visibility (v3 review fix) */}
        <div
          style={{
            flex: 1,
            marginLeft: 40,
            marginRight: 40,
            height: 8,
            backgroundColor: "#2C2C2E",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${progress * 100}%`,
              backgroundColor: "#007AFF",
              borderRadius: 4,
            }}
          />
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          {/* Indicator dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#FF453A",
            }}
          />
        </div>
      </div>

      {/* === z-index 20: Bottom bar === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          zIndex: 20,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderTop: "1px solid #2C2C2E",
          transform: `translateY(${bottomBarY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Subscribe button (SVG, no emoji) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5z"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="rgba(0, 122, 255, 0.2)"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#34C759"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
            }}
          >
            订阅 Horizon Tech
          </span>
        </div>

        {/* Segment counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#8E8E93",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            SEGMENT
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {segmentLabel}
          </span>
        </div>
      </div>
    </>
  );
};

export default OverlayLayer;
