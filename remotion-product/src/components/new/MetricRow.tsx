/**
 * MetricRow - Horizontal row of MetricCards.
 */
import React from "react";
import { MetricCard } from "./MetricCard";

interface MetricItem {
  value: string;
  label: string;
  unit?: string;
  accentColor?: string;
}

interface MetricRowProps {
  metrics: MetricItem[];
  frameOffset?: number;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  metrics,
  frameOffset = 0,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 16,
        flexWrap: "wrap",
        padding: "0 40px",
      }}
    >
      {metrics.map((metric, i) => (
        <MetricCard
          key={i}
          value={metric.value}
          label={metric.label}
          unit={metric.unit}
          accentColor={metric.accentColor}
          frameOffset={frameOffset + i * 6}
        />
      ))}
    </div>
  );
};

export default MetricRow;