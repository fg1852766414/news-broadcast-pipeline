/**
 * ProcessFlow - Horizontal process flow with connected steps + step icons.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Step {
  title: string;
  description: string;
  icon?: "play" | "settings" | "check" | "alert" | "rocket" | "default";
}

interface ProcessFlowProps {
  steps: Step[];
  frameOffset?: number;
  accentColor?: string;
}

const StepIcon: React.FC<{ type: string; color: string; isFirst: boolean }> = ({ type, color, isFirst }) => {
  const stroke = isFirst ? "#ffffff" : color;
  switch (type) {
    case "play":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <polygon points="6 4 20 12 6 20" fill={stroke} />
        </svg>
      );
    case "settings":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="2.5" fill="none" />
          <path d="M12 2 L12 5 M12 19 L12 22 M22 12 L19 12 M5 12 L2 12 M19 5 L17 7 M7 17 L5 19 M19 19 L17 17 M7 7 L5 5" stroke={stroke} strokeWidth="2.5" />
        </svg>
      );
    case "check":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 12 L10 17 L19 7" stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "alert":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 3 L22 20 L2 20 Z" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
          <line x1="12" y1="10" x2="12" y2="14" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.3" fill={stroke} />
        </svg>
      );
    case "rocket":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2 L8 9 L12 7 L16 9 Z" fill={stroke} />
          <circle cx="12" cy="11" r="1.5" fill={stroke} />
        </svg>
      );
    default:
      return (
        <span style={{ fontSize: 18, fontWeight: 700, color: stroke }}>?</span>
      );
  }
};

export const ProcessFlow: React.FC<ProcessFlowProps> = ({
  steps,
  frameOffset = 0,
  accentColor = "#007AFF",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 0,
        padding: "0 20px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {steps.map((step, i) => {
        const stepSpring = spring({
          frame: frame - frameOffset - i * 8,
          fps,
          config: { damping: 25, stiffness: 100 },
        });
        const visible = frame - frameOffset - i * 8 > 0;

        if (!visible) return null;

        return (
          <React.Fragment key={i}>
            {/* Step node */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                opacity: stepSpring,
                transform: `translateY(${interpolate(stepSpring, [0, 1], [20, 0])}px)`,
              }}
            >
              {/* Circle with icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: i === 0 ? accentColor : "#1C1C1E",
                  border: `2px solid ${accentColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  boxShadow: i === 0 ? `0 0 25px ${accentColor}80` : "none",
                }}
              >
                <StepIcon type={step.icon || "default"} color={accentColor} isFirst={i === 0} />
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#ffffff",
                  fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {step.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "#B0B0B5",
                  fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                  textAlign: "center",
                  maxWidth: 140,
                  lineHeight: 1.5,
                }}
              >
                {step.description}
              </div>
            </div>

            {/* Connector line (except after last) — v5: gradient line with pulse */}
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: "0 0 40px",
                  height: 2,
                  marginTop: 27,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "#2C2C2E",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
                    transform: `translateX(${interpolate(
                      (frame - frameOffset - i * 8 - 15) % 30,
                      [0, 30],
                      [-50, 100]
                    )}%)`,
                    width: "50%",
                    height: "100%",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProcessFlow;
