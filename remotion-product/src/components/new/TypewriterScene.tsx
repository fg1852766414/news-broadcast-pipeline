/**
 * TypewriterScene - Full-screen typewriter reveal scene with completion callback
 * that auto-advances to next content.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { TypewriterText } from "./TypewriterText";

interface TypewriterSceneProps {
  text: string;
  subtitle?: string;
  fontSize?: number;
  frameOffset?: number;
  charsPerFrame?: number;
  accentColor?: string;
}

export const TypewriterScene: React.FC<TypewriterSceneProps> = ({
  text,
  subtitle,
  fontSize = 48,
  frameOffset = 0,
  charsPerFrame = 2,
  accentColor = "#007AFF",
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
        }}
      >
        <TypewriterText
          text={text}
          fontSize={fontSize}
          color="#ffffff"
          frameOffset={frameOffset}
          charsPerFrame={charsPerFrame}
        />
      </div>
      {subtitle && (
        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: accentColor,
            fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

export default TypewriterScene;