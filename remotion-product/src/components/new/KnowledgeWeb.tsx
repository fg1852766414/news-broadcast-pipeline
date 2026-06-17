/**
 * KnowledgeWeb - Radial knowledge graph with central node and satellite connections.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface WebNode {
  id: string;
  label: string;
  angle: number;
  distance: number;
  color?: string;
}

interface KnowledgeWebProps {
  centerLabel: string;
  nodes: WebNode[];
  frameOffset?: number;
}

export const KnowledgeWeb: React.FC<KnowledgeWebProps> = ({
  centerLabel,
  nodes,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cx = 400;
  const cy = 250;

  const webSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const getPos = (node: WebNode) => ({
    x: cx + Math.cos((node.angle * Math.PI) / 180) * node.distance,
    y: cy + Math.sin((node.angle * Math.PI) / 180) * node.distance,
  });

  return (
    <svg
      viewBox="0 0 800 500"
      style={{
        width: "100%",
        maxWidth: 800,
        height: 500,
        opacity: webSpring,
      }}
    >
      {/* Connection lines */}
      {nodes.map((node, i) => {
        const pos = getPos(node);
        const lineSpring = spring({
          frame: frame - frameOffset - i * 3,
          fps,
          config: { damping: 25, stiffness: 100 },
        });

        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={pos.x}
            y2={pos.y}
            stroke={node.color || "#2C2C2E"}
            strokeWidth={1}
            opacity={lineSpring}
          />
        );
      })}

      {/* Satellite nodes */}
      {nodes.map((node, i) => {
        const pos = getPos(node);
        const nodeSpring = spring({
          frame: frame - frameOffset - i * 4,
          fps,
          config: { damping: 25, stiffness: 100 },
        });

        return (
          <g
            key={`node-${i}`}
            opacity={nodeSpring}
            transform={`translate(${pos.x}, ${pos.y})`}
          >
            <circle
              r={6}
              fill={node.color || "#1C1C1E"}
              stroke={node.color || "#007AFF"}
              strokeWidth={2}
            />
            <text
              x={12}
              y={4}
              fill="#ffffff"
              fontSize={12}
              fontFamily='"SF Pro Text", "Helvetica Neue", sans-serif'
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* Center node */}
      <g transform={`translate(${cx}, ${cy})`}>
        <circle r={24} fill="#007AFF" />
        <text
          y={4}
          fill="#ffffff"
          fontSize={14}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily='"SF Pro Text", "Helvetica Neue", sans-serif'
        >
          {centerLabel}
        </text>
      </g>
    </svg>
  );
};

export default KnowledgeWeb;