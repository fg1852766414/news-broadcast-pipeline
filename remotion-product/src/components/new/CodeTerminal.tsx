/**
 * CodeTerminal - Terminal window displaying code with typing animation.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface CodeLine {
  text: string;
  highlight?: boolean;
  indent?: number;
}

interface CodeTerminalProps {
  lines: CodeLine[];
  title?: string;
  frameOffset?: number;
  typingSpeed?: number;
}

export const CodeTerminal: React.FC<CodeTerminalProps> = ({
  lines,
  title = "terminal",
  frameOffset = 0,
  typingSpeed = 3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  return (
    <div
      style={{
        backgroundColor: "#1C1C1E",
        borderRadius: 12,
        padding: 0,
        width: "90%",
        maxWidth: 900,
        margin: "0 auto",
        overflow: "hidden",
        opacity: windowSpring,
        transform: `scale(${interpolate(windowSpring, [0, 1], [0.9, 1])})`,
        fontFamily: '"JetBrains Mono", "SF Mono", "Courier New", monospace',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "#2C2C2E",
          gap: 8,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF453A" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF9F0A" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#34C759" }} />
        <span style={{ color: "#8E8E93", fontSize: 12, marginLeft: 12 }}>{title}</span>
      </div>

      {/* Code content */}
      <div style={{ padding: "16px 20px" }}>
        {lines.map((line, i) => {
          const charStart = i * typingSpeed * 8;
          const lineSpring = spring({
            frame: frame - frameOffset - charStart,
            fps,
            config: { damping: 25, stiffness: 100 },
          });
          const visible = frame - frameOffset - charStart > 0;

          if (!visible) return null;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                opacity: lineSpring,
                paddingLeft: (line.indent || 0) * 20,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  color: line.highlight ? "#007AFF" : "#34C759",
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre",
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CodeTerminal;