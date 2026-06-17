/**
 * EvolutionTree - Branching tree structure showing evolution/lineage.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface EvolutionTreeProps {
  root: TreeNode;
  frameOffset?: number;
}

const NodeComponent: React.FC<{
  node: TreeNode;
  x: number;
  y: number;
  frameOffset: number;
  depth: number;
  index: number;
}> = ({ node, x, y, frameOffset, depth, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodeSpring = spring({
    frame: frame - frameOffset - depth * 6 - index * 3,
    fps,
    config: { damping: 25, stiffness: 100 },
  });

  const hasChildren = node.children && node.children.length > 0;

  return (
    <g
      opacity={nodeSpring}
      transform={`translate(${x}, ${y}) scale(${interpolate(
        nodeSpring,
        [0, 1],
        [0.5, 1]
      )})`}
    >
      <circle
        r={hasChildren ? 10 : 6}
        fill={hasChildren ? "#007AFF" : "#1C1C1E"}
        stroke="#007AFF"
        strokeWidth={2}
      />
      <text
        x={16}
        y={4}
        fill="#ffffff"
        fontSize={13}
        fontFamily='"SF Pro Text", "Helvetica Neue", sans-serif'
      >
        {node.label}
      </text>
    </g>
  );
};

export const EvolutionTree: React.FC<EvolutionTreeProps> = ({
  root,
  frameOffset = 0,
}) => {
  const layout: Array<{ node: TreeNode; x: number; y: number }> = [];

  const traverse = (node: TreeNode, depth: number, xOffset: number) => {
    const x = xOffset;
    const y = 40 + depth * 60;
    layout.push({ node, x, y });

    if (node.children) {
      const childSpread = Math.max(80, 200 / (depth + 1));
      const startX = xOffset - ((node.children.length - 1) * childSpread) / 2;
      node.children.forEach((child, i) => {
        traverse(child, depth + 1, startX + i * childSpread);
      });
    }
  };

  traverse(root, 0, 400);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <svg viewBox="0 0 800 400" style={{ width: "100%", height: 400 }}>
        {layout.map((item) =>
          item.node.children?.map((child) => {
            const childLayout = layout.find((l) => l.node.id === child.id);
            if (!childLayout) return null;
            return (
              <line
                key={`edge-${item.node.id}-${child.id}`}
                x1={item.x}
                y1={item.y + 10}
                x2={childLayout.x}
                y2={childLayout.y - 10}
                stroke="#2C2C2E"
                strokeWidth={1}
              />
            );
          })
        )}
        {layout.map((item, i) => (
          <NodeComponent
            key={item.node.id}
            node={item.node}
            x={item.x}
            y={item.y}
            frameOffset={frameOffset}
            depth={Math.floor(i / 2)}
            index={i}
          />
        ))}
      </svg>
    </div>
  );
};

export default EvolutionTree;