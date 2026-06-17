/**
 * Composite Video Script
 *
 * Integrates:
 * 1. Horizon enriched news data (JSON)
 * 2. Broadcast-engine broadcast scripts (Markdown)
 * 3. Remotion video components (React/Remotion)
 * 4. Review report feedback (for improvements)
 *
 * This is the master composition that ties everything together.
 * Agent 5 will enhance this with live data from the pipeline.
 */
import React from "react";
import { Composition } from "remotion";
import { CompositeBroadcast } from "./CompositeBroadcast";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

const TOTAL_DURATION = 600; // 20 seconds @ 30fps

export const CompositeRoot: React.FC = () => {
  return (
    <Composition
      id="CompositeBroadcast"
      component={CompositeBroadcast}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};