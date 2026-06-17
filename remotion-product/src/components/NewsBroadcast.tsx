/**
 * NewsBroadcast - The main video composition.
 *
 * Sequences the video into three acts:
 * 1. Opening Title (frames 0-89, ~3 seconds)
 * 2. News Items (frames 90-479, ~13 seconds for 5 items)
 * 3. Closing Credits (frames 480-569, ~3 seconds)
 *
 * Total: ~570 frames @ 30fps = ~19 seconds
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { OpeningTitle } from "./OpeningTitle";
import NewsItemCard from "./NewsItemCard";
import { ClosingCredits } from "./ClosingCredits";
import { sampleBroadcast } from "../data";

// Timing constants (in frames at 30fps)
export const OPENING_DURATION = 90; // 3 seconds
export const NEWS_ITEM_DURATION = 75; // 2.5 seconds per item
export const CLOSING_DURATION = 90; // 3 seconds
export const TOTAL_DURATION =
  OPENING_DURATION +
  sampleBroadcast.newsItems.length * NEWS_ITEM_DURATION +
  CLOSING_DURATION; // ~555 frames

// FPS for the composition
export const FPS = 30;

// Video dimensions
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const NewsBroadcast: React.FC = () => {
  const { newsItems, date, title, subtitle, closingText } = sampleBroadcast;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a1e",
        width: WIDTH,
        height: HEIGHT,
      }}
    >
      {/* Act 1: Opening Title */}
      <Sequence
        name="Opening"
        from={0}
        durationInFrames={OPENING_DURATION}
      >
        <OpeningTitle
          date={date}
          title={title}
          subtitle={subtitle}
        />
      </Sequence>

      {/* Act 2: News Items (each shown sequentially) */}
      {newsItems.map((item, index) => {
        const startFrame = OPENING_DURATION + index * NEWS_ITEM_DURATION;
        return (
          <Sequence
            key={item.id}
            name={`News-${index + 1}`}
            from={startFrame}
            durationInFrames={NEWS_ITEM_DURATION}
          >
            <NewsItemCard
              item={item}
              index={index}
              totalItems={newsItems.length}
            />
          </Sequence>
        );
      })}

      {/* Act 3: Closing Credits */}
      <Sequence
        name="Closing"
        from={OPENING_DURATION + newsItems.length * NEWS_ITEM_DURATION}
        durationInFrames={CLOSING_DURATION}
      >
        <ClosingCredits
          date={date}
          closingText={closingText}
          totalNewsItems={newsItems.length}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

export default NewsBroadcast;