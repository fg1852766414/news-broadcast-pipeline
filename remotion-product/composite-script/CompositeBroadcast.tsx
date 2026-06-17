/**
 * CompositeBroadcast - The synthesis of all pipeline outputs.
 *
 * This component integrates:
 * - Opening titles (from broadcast script)
 * - News items (from Horizon data)
 * - Seendance effects (from remotion components)
 * - Closing credits
 *
 * Agent 5 will wire this with the actual seendance components
 * and live data from the data bridge.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

interface CompositeNewsItem {
  id: string;
  title: string;
  summary: string;
  sourceType: string;
  score: number;
  tags: string[];
}

interface CompositeBroadcastProps {
  date?: string;
  title?: string;
  items?: CompositeNewsItem[];
}

const SAMPLE_ITEMS: CompositeNewsItem[] = [
  {
    id: "1",
    title: "AI Agent Social-Engineering Attack",
    summary: "An AI agent submitted patches to open-source projects using LLM-generated justifications to overwhelm maintainers.",
    sourceType: "hackernews",
    score: 9.0,
    tags: ["AI safety", "open source security"],
  },
  {
    id: "2",
    title: "Anthropic Reverses Secret Sabotage Policy",
    summary: "Anthropic walked back a policy that secretly limited Claude's helpfulness for AI researchers.",
    sourceType: "rss",
    score: 9.0,
    tags: ["Anthropic", "AI ethics"],
  },
];

export const CompositeBroadcast: React.FC<CompositeBroadcastProps> = ({
  date = "June 11, 2026",
  title = "Horizon News Broadcast",
  items = SAMPLE_ITEMS,
}) => {
  const OPENING_DURATION = 90;
  const ITEM_DURATION = 75;
  const CLOSING_DURATION = 90;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a1e" }}>
      <Sequence from={0} durationInFrames={OPENING_DURATION}>
        <OpeningContent date={date} title={title} />
      </Sequence>
      {items.map((item, i) => (
        <Sequence
          key={item.id}
          from={OPENING_DURATION + i * ITEM_DURATION}
          durationInFrames={ITEM_DURATION}
        >
          <NewsItemContent item={item} index={i} />
        </Sequence>
      ))}
      <Sequence
        from={OPENING_DURATION + items.length * ITEM_DURATION}
        durationInFrames={CLOSING_DURATION}
      >
        <ClosingContent count={items.length} />
      </Sequence>
    </AbsoluteFill>
  );
};

const OpeningContent: React.FC<{ date: string; title: string }> = ({ date, title }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      background: "linear-gradient(135deg, #0a0a2e, #1a1a4e)",
    }}
  >
    <h1 style={{ color: "#ffffff", fontSize: 64, fontFamily: "sans-serif", margin: 0 }}>
      {title}
    </h1>
    <p style={{ color: "#8899cc", fontSize: 18, fontFamily: "monospace", letterSpacing: 4 }}>
      {date}
    </p>
  </div>
);

const NewsItemContent: React.FC<{ item: CompositeNewsItem; index: number }> = ({ item }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: 80,
      height: "100%",
      background: "linear-gradient(135deg, #0d0d2b, #1a1a3e)",
    }}
  >
    <div
      style={{
        fontSize: 14,
        color: "#00b4d8",
        fontFamily: "monospace",
        letterSpacing: 3,
        marginBottom: 20,
      }}
    >
      {item.sourceType.toUpperCase()} · Score: {item.score}/10
    </div>
    <h2 style={{ color: "#ffffff", fontSize: 36, fontFamily: "sans-serif", margin: "0 0 20px 0" }}>
      {item.title}
    </h2>
    <p style={{ color: "#c0c8e0", fontSize: 20, lineHeight: 1.6, fontFamily: "sans-serif" }}>
      {item.summary}
    </p>
    <div style={{ color: "#667799", fontSize: 14, marginTop: 30, fontFamily: "monospace" }}>
      {item.tags.join(" · ")}
    </div>
  </div>
);

const ClosingContent: React.FC<{ count: number }> = ({ count }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      background: "linear-gradient(180deg, #0a0a1e, #050510)",
    }}
  >
    <h2 style={{ color: "#ffffff", fontSize: 48, fontFamily: "sans-serif" }}>
      Thanks for Watching
    </h2>
    <p style={{ color: "#8899bb", fontSize: 16, fontFamily: "monospace" }}>
      {count} stories covered today
    </p>
    <div style={{ width: 100, height: 2, background: "linear-gradient(90deg, transparent, #ff6b35, transparent)", margin: 30 }} />
    <p style={{ color: "#ff6b35", fontSize: 28, fontFamily: "sans-serif", letterSpacing: 8 }}>
      HORIZON
    </p>
  </div>
);

export default CompositeBroadcast;