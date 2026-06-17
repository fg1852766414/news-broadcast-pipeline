/**
 * DataTable - Tabular data display with header row and animated rows.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface Column {
  key: string;
  label: string;
  width?: number;
}

interface DataRow {
  [key: string]: string | number;
}

interface DataTableProps {
  columns: Column[];
  rows: DataRow[];
  frameOffset?: number;
  accentColor?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  frameOffset = 0,
  accentColor = "#007AFF",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid #2C2C2E",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          backgroundColor: "#1C1C1E",
          padding: "12px 16px",
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{
              flex: col.width || 1,
              fontSize: 13,
              fontWeight: 600,
              color: accentColor,
              fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {col.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {rows.map((row, i) => {
        const rowSpring = spring({
          frame: frame - frameOffset - i * 4,
          fps,
          config: { damping: 25, stiffness: 100 },
        });
        const visible = frame - frameOffset - i * 4 > 0;

        if (!visible) return null;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              padding: "10px 16px",
              backgroundColor: i % 2 === 0 ? "#000000" : "#0A0A0A",
              borderBottom: i < rows.length - 1 ? "1px solid #2C2C2E" : "none",
              opacity: rowSpring,
              transform: `translateX(${interpolate(rowSpring, [0, 1], [-20, 0])}px)`,
            }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                style={{
                  flex: col.width || 1,
                  fontSize: 15,
                  color: "#ffffff",
                  fontFamily: '"SF Pro Text", "Helvetica Neue", sans-serif',
                }}
              >
                {row[col.key]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default DataTable;