/**
 * BackgroundLayer - Subtle tech-themed background for the broadcast.
 *
 * v5 upgrade: 3 layers for depth
 *   1. Grid pattern (static, low opacity)
 *   2. 40 floating particles (drift up slowly, varied sizes/opacities)
 *   3. Slow-rotating circle arcs (left/right counter-rotation)
 *   4. Radial vignette (darkens edges, focuses center)
 *
 * z-index 0, total opacity ~0.18 so it never competes with content.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface Particle {
  x: number;
  y: number;
  r: number;
  baseOpacity: number;
  speed: number; // pixels per second
  drift: number; // x drift amplitude
  phase: number; // 0-2π for sinusoidal drift
}

// Deterministic particle positions (so output is stable across renders)
const PARTICLES: Particle[] = (() => {
  const arr: Particle[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 40; i++) {
    arr.push({
      x: rand() * 1920,
      y: rand() * 1080,
      r: 1 + rand() * 2.5,
      baseOpacity: 0.2 + rand() * 0.5,
      speed: 8 + rand() * 14,         // 8-22 px/s
      drift: 30 + rand() * 60,        // ±30-90 px
      phase: rand() * Math.PI * 2,
    });
  }
  return arr;
})();

export const BackgroundLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30; // seconds
  const rotation = interpolate(frame % 600, [0, 600], [0, 360]);

  // Static grid dots (kept for tech aesthetic)
  const dots: React.ReactNode[] = [];
  for (let row = 0; row < 28; row++) {
    for (let col = 0; col < 48; col++) {
      dots.push(
        <circle
          key={`d-${row}-${col}`}
          cx={col * 40 + 20}
          cy={row * 40 + 20}
          r={1}
          fill="#FFFFFF"
          opacity={((row + col) % 5) * 0.12 + 0.08}
        />
      );
    }
  }

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.18,
      }}
    >
      <svg width="1920" height="1080" viewBox="0 0 1920 1080">
        <defs>
          {/* Grid pattern */}
          <pattern id="bg-grid" width="160" height="160" patternUnits="userSpaceOnUse">
            <path
              d="M 160 0 L 0 0 0 160"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="0.3"
              opacity="0.25"
            />
          </pattern>
          {/* Vignette */}
          <radialGradient id="bg-vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
          </radialGradient>
          {/* v5: Center radial gradient for subtle spotlight */}
          <radialGradient id="bg-spotlight" cx="50%" cy="42%" r="50%">
            <stop offset="0%" stopColor="#007AFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#007AFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Layer 1: Grid */}
        <rect width="1920" height="1080" fill="url(#bg-grid)" />

        {/* Layer 2: Data dot matrix */}
        {dots}

        {/* Layer 3: v5 floating particles (drift upward) */}
        {PARTICLES.map((p, i) => {
          // Each particle drifts up; loops when it leaves the top
          const driftY = ((p.y - t * p.speed) % 1080 + 1080) % 1080 - 60;
          const driftX = p.x + Math.sin(t * 0.4 + p.phase) * p.drift;
          // Twinkle: gentle alpha oscillation
          const twinkle = 0.5 + 0.5 * Math.sin(t * 1.2 + p.phase);
          const opacity = p.baseOpacity * twinkle;
          return (
            <circle
              key={`p-${i}`}
              cx={driftX}
              cy={driftY}
              r={p.r}
              fill="#007AFF"
              opacity={opacity}
            />
          );
        })}

        {/* Layer 4a: Slow-rotating primary arc */}
        <circle
          cx={960}
          cy={540}
          r={380}
          fill="none"
          stroke="#007AFF"
          strokeWidth={0.6}
          opacity={0.18}
          transform={`rotate(${rotation / 3}, 960, 540)`}
          strokeDasharray="80 500"
        />

        {/* Layer 4b: Counter-rotating secondary arc */}
        <circle
          cx={960}
          cy={540}
          r={300}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={0.3}
          opacity={0.06}
          transform={`rotate(${-rotation / 5}, 960, 540)`}
          strokeDasharray="60 600"
        />

        {/* Layer 5: Center spotlight (subtle blue glow behind content) */}
        <rect width="1920" height="1080" fill="url(#bg-spotlight)" />

        {/* Layer 6: Vignette */}
        <rect width="1920" height="1080" fill="url(#bg-vignette)" />
      </svg>
    </AbsoluteFill>
  );
};

export default BackgroundLayer;
