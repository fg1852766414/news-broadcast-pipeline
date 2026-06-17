/**
 * Demo: TransitionScene — News segments with professional transitions
 *
 * 使用 @remotion/transitions 的 19 种场景过渡效果
 * 演示 fade / slide / wipe / clockWipe / zoomBlur 等
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  TransitionSeries,
  linearTiming,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { zoomBlur } from "@remotion/transitions/zoom-blur";
import { HeroTitle } from "../components/new/HeroTitle";
import { AnimatedList } from "../components/new/AnimatedList";
import { HighlightQuote } from "../components/new/HighlightQuote";
import { DataHighlight } from "../components/new/DataHighlight";

const Scene1: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <HeroTitle
      title="Today's Headlines"
      subtitle="Top stories from around the world"
      frameOffset={5}
    />
  </AbsoluteFill>
);

const Scene2: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#000",
      justifyContent: "center",
    }}
  >
    <AnimatedList
      items={[
        { text: "AI Agent Social-Engineering Attack", subtext: "Open source supply chain security" },
        { text: "Anthropic Reverses Secret Policy", subtext: "AI ethics and transparency" },
        { text: "Google Releases DiffusionGemma", subtext: "Open-source fast text generation" },
        { text: "PgDog Gets Funded", subtext: "PostgreSQL horizontal scaling" },
        { text: "Eric Ries New Book AMA", subtext: "Organizational integrity" },
      ]}
      frameOffset={5}
    />
  </AbsoluteFill>
);

const Scene3: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#000",
      justifyContent: "center",
    }}
  >
    <DataHighlight
      value="9.0"
      description="Average AI score of today's top stories"
      accentColor="#007AFF"
      size="large"
      frameOffset={5}
    />
  </AbsoluteFill>
);

const Scene4: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: "#000",
      justifyContent: "center",
    }}
  >
    <HighlightQuote
      quote="The safest path is not one of maximum capability concentration — it's one of distributed vigilance."
      author="AI Safety Discussion, June 2026"
      accentColor="#34C759"
      frameOffset={5}
      fontSize={32}
    />
  </AbsoluteFill>
);

export const TransitionScene: React.FC = () => {
  const fps = 30;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {/* Scene 1: Fade in */}
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene1 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({})}
          timing={linearTiming({ durationInFrames: 0.5 * fps })}
        />

        {/* Scene 2: Slide from left */}
        <TransitionSeries.Sequence durationInFrames={4 * fps}>
          <Scene2 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 0.5 * fps })}
        />

        {/* Scene 3: Wipe */}
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene3 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({})}
          timing={linearTiming({ durationInFrames: 0.5 * fps })}
        />

        {/* Scene 4: Zoom blur */}
        <TransitionSeries.Sequence durationInFrames={3 * fps}>
          <Scene4 />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={zoomBlur({})}
          timing={linearTiming({ durationInFrames: 0.5 * fps })}
        />
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export default TransitionScene;