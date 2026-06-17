/**
 * Root - Registers the Remotion composition.
 *
 * This is the entry point for the Remotion Studio and renderer.
 * It defines the composition with its metadata (dimensions, fps, duration).
 */
import React from "react";
import { Composition } from "remotion";
import { NewsBroadcast, TOTAL_DURATION, FPS, WIDTH, HEIGHT } from "./components/NewsBroadcast";
import { EffectShowcase } from "./effects/EffectShowcase";
import { CinematicOpening } from "./effects/CinematicOpening";
import { TransitionScene } from "./effects/TransitionScene";
import { ManifestVideo } from "./effects/ManifestVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NewsBroadcast"
        component={NewsBroadcast}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{}}
      />
      <Composition
        id="EffectShowcase"
        component={EffectShowcase}
        durationInFrames={13 * 30 + 3 * 15}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CinematicOpening"
        component={CinematicOpening}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TransitionScene"
        component={TransitionScene}
        durationInFrames={16 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ManifestVideo"
        component={ManifestVideo}
        durationInFrames={3090}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

export default RemotionRoot;