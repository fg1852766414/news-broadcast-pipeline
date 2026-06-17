/**
 * Showcase: All installed @remotion packages demonstrated in one composition.
 *
 * 展示所有已安装的套件效果，可注册到 Root.tsx 进行预览
 */
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { dissolve } from "@remotion/transitions/dissolve";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { LightLeak } from "@remotion/light-leaks";
import { HeroTitle } from "../components/new/HeroTitle";
import { DataHighlight } from "../components/new/DataHighlight";
import { ProcessFlow } from "../components/new/ProcessFlow";
import { MetricRow } from "../components/new/MetricRow";
import { HighlightQuote } from "../components/new/HighlightQuote";
import { Circle, Star } from "@remotion/shapes";

const FPS = 30;

/* ── Scene 1: Light Leak + Motion Blur Opening ── */
const SceneLightLeak: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <CameraMotionBlur shutterAngle={180} samples={6}>
      <HeroTitle
        title="Effect Showcase"
        subtitle="@remotion packages demo"
        frameOffset={10}
      />
      <LightLeak durationInFrames={90} seed={42} hueShift={5} />
    </CameraMotionBlur>
  </AbsoluteFill>
);

/* ── Scene 2: Shapes + Metrics ── */
const SceneShapes: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
      gap: 30,
    }}
  >
    <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginBottom: 40 }}>
      <Circle radius={40} fill="#007AFF" />
      <Star innerRadius={20} outerRadius={50} fill="#FF9F0A" points={5} />
      <Circle radius={35} fill="#34C759" />
      <Star innerRadius={18} outerRadius={45} fill="#FF453A" points={5} />
      <Circle radius={45} fill="#AF52DE" />
    </div>
    <MetricRow
      metrics={[
        { value: "19", label: "Transitions", unit: "", accentColor: "#007AFF" },
        { value: "3", label: "Effects", unit: "", accentColor: "#34C759" },
        { value: "4", label: "Media Tools", unit: "", accentColor: "#FF9F0A" },
      ]}
      frameOffset={5}
    />
  </AbsoluteFill>
);

/* ── Scene 3: Process Flow ── */
const SceneFlow: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#000",
      justifyContent: "center",
    }}
  >
    <div style={{ marginBottom: 40, textAlign: "center" }}>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#fff",
          fontFamily: '"SF Pro Display"',
          marginBottom: 40,
        }}
      >
        Video Production Pipeline
      </div>
    </div>
    <ProcessFlow
      steps={[
        { title: "Horizon", description: "News Aggregation" },
        { title: "Broadcast", description: "Script Generation" },
        { title: "Remotion", description: "Video Rendering" },
      ]}
      accentColor="#007AFF"
      frameOffset={10}
    />
  </AbsoluteFill>
);

/* ── Scene 4: Quote ── */
const SceneQuote: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center" }}>
    <HighlightQuote
      quote="Good design is as little design as possible."
      author="Dieter Rams"
      accentColor="#007AFF"
      frameOffset={10}
      fontSize={42}
    />
  </AbsoluteFill>
);

/* ── Main Composition ── */
export const EffectShowcase: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <SceneLightLeak />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={dissolve({})}
        timing={linearTiming({ durationInFrames: 0.5 * FPS })}
      />
      <TransitionSeries.Sequence durationInFrames={4 * FPS}>
        <SceneShapes />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-left" })}
        timing={linearTiming({ durationInFrames: 0.5 * FPS })}
      />
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <SceneFlow />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade({})}
        timing={linearTiming({ durationInFrames: 0.5 * FPS })}
      />
      <TransitionSeries.Sequence durationInFrames={3 * FPS}>
        <SceneQuote />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

export default EffectShowcase;