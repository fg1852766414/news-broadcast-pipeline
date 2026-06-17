/**
 * ProgressTable - Tabular data with visual progress bars.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface ProgressRow {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

interface ProgressTableProps {
  rows: ProgressRow[];
  title?: string;
  frameOffset?: number;
}

export const ProgressTable: React.FC<ProgressTableProps> = ({
  rows,
  title,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
      {title && (
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: '"SF Pro Display", "Helvetica Neue", sans-serif',
            marginBottom: 20,
            paddingLeft: 4,
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {rows.map((row, i) => {
          const rowSpring = spring({
            frame: frame - frameOffset - i * 5,
            fps,
            config: { damping: 25, stiffness: 100 },
          });
          const visible = frame - frameOffset - i * 5 > 0;
          if (!visible) return null;

          const pct = Math.min(row.value / (row.maxValue || 100), 1);
          const barColor = row.color || "#007AFF";

          return (
            <div key={i} style={{ opacity: rowSpring }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: "#ffffff",
                    fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: barColor,
                    fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                  }}
                >
                  {row.value}
                  {row.maxValue ? `/${row.maxValue}` : ""}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#2C2C2E",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${interpolate(rowSpring, [0, 1], [0, pct * 100])}%`,
                    borderRadius: 3,
                    backgroundColor: barColor,
                    transition: "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTable;