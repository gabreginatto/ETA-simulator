/**
 * Custom edge for stream connections with animated flow.
 */
import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

// Edge colors based on stream type
const EDGE_COLORS: Record<string, string> = {
  "feed-to-polymer": "#0891b2", // cyan-600
  "polymer-to-dewatering": "#7c3aed", // violet-600
  "cake": "#d97706", // amber-600
  "liquid": "#0284c7", // sky-600
  default: "#64748b", // slate-500
};

function getEdgeColor(edgeId: string): string {
  if (edgeId.includes("feed")) return EDGE_COLORS["feed-to-polymer"];
  if (edgeId.includes("polymer")) return EDGE_COLORS["polymer-to-dewatering"];
  if (edgeId.includes("cake")) return EDGE_COLORS["cake"];
  if (edgeId.includes("liquid")) return EDGE_COLORS["liquid"];
  return EDGE_COLORS.default;
}

function StreamEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = getEdgeColor(id);

  return (
    <>
      {/* Shadow/glow effect */}
      <BaseEdge
        path={edgePath}
        style={{
          ...style,
          strokeWidth: 6,
          stroke: edgeColor,
          opacity: 0.2,
        }}
      />
      {/* Main edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: edgeColor,
        }}
      />
      {/* Animated flow overlay */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={3}
        stroke={edgeColor}
        strokeDasharray="8 12"
        className="animate-flow"
        style={{
          opacity: 0.6,
        }}
      />
      <style>
        {`
          @keyframes flowAnimation {
            from {
              stroke-dashoffset: 40;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .animate-flow {
            animation: flowAnimation 1s linear infinite;
          }
        `}
      </style>
    </>
  );
}

export const StreamEdge = memo(StreamEdgeComponent);
