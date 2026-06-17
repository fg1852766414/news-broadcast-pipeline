/**
 * FeatureGrid - Grid layout for FeatureCard components.
 */
import React from "react";
import { FeatureCard } from "./FeatureCard";

interface FeatureItem {
  title: string;
  description: string;
  accentColor?: string;
}

interface FeatureGridProps {
  features: FeatureItem[];
  columns?: number;
  frameOffset?: number;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  features,
  columns = 2,
  frameOffset = 0,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
        padding: "0 40px",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {features.map((feature, i) => (
        <FeatureCard
          key={i}
          title={feature.title}
          description={feature.description}
          accentColor={feature.accentColor}
          frameOffset={frameOffset + i * 5}
        />
      ))}
    </div>
  );
};

export default FeatureGrid;