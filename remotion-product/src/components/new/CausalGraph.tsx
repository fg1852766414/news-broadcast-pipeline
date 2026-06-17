/**
 * CausalGraph - Directed graph showing cause-and-effect with animated edge flow.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

interface CausalGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  frameOffset?: number;
}

export const CausalGraph: React.FC<CausalGraphProps> = ({
  nodes,
  edges,
  frameOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const graphSpring = spring({
    frame: frame - frameOffset,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 800 500"
      style={{
        width: "100%",
        maxWidth: 800,
        height: 500,
        opacity: graphSpring,
      }}
    >
      <defs>
        {/* Animated flow gradient for edges */}
        <linearGradient id="causal-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#007AFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#007AFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#007AFF" stopOpacity="0.3" />
        </linearGradient>
        <marker
          id="causal-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#007AFF" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;

        const edgeSpring = spring({
          frame: frame - frameOffset - 10 - i * 3,
          fps,
          config: { damping: 25, stiffness: 100 },
        });

        return (
          <g key={`edge-${i}`} opacity={edgeSpring}>
            {/* v5: thicker 2px edges in apple blue */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#007AFF"
              strokeWidth={2}
              opacity={0.35}
              markerEnd="url(#causal-arrow)"
            />
            {/* v5: animated pulse on edge for "flowing data" effect */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#causal-edge-gradient)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="20 200"
              strokeDashoffset={interpolate(
                (frame - frameOffset - 10 - i * 3) % 60,
                [0, 60],
                [220, 0]
              )}
            />
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 10}
                fill="#FFFFFF"
                fontSize={13}
                fontWeight={500}
                textAnchor="middle"
                fontFamily='"SF Pro Text", "Helvetica Neue", sans-serif'
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const nodeSpring = spring({
          frame: frame - frameOffset - i * 4,
          fps,
          config: { damping: 25, stiffness: 100 },
        });

        return (
          <g
            key={node.id}
            opacity={nodeSpring}
            transform={`scale(${interpolate(nodeSpring, [0, 1], [0.5, 1])})`}
            style={{ transformOrigin: `${node.x}px ${node.y}px` }}
          >
            {/* v5: bigger nodes 140×50, glowing for first/highlighted */}
            <rect
              x={node.x - 70}
              y={node.y - 25}
              width={140}
              height={50}
              rx={12}
              fill={i === 0 ? "#007AFF" : node.color || "#1C1C1E"}
              stroke="#007AFF"
              strokeWidth={i === 0 ? 0 : 1.5}
              filter={i === 0 ? "drop-shadow(0 0 12px #007AFF80)" : undefined}
            />
            <text
              x={node.x}
              y={node.y + 6}
              fill="#ffffff"
              fontSize={18}
              fontWeight={i === 0 ? 700 : 600}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily='"SF Pro Text", "Helvetica Neue", sans-serif'
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default CausalGraph;
