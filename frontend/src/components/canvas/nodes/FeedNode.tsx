/**
 * Feed Source node for React Flow canvas.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Droplets } from "lucide-react";
import type { FeedNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function FeedNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as FeedNodeData;
  const { parameters, streamData } = nodeData;

  return (
    <div
      className={`
        relative overflow-visible w-44 rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? "shadow-lg" : ""}
        hover:shadow-lg
      `}
      style={{
        background: "var(--node-feed-bg)",
        borderColor: selected ? "var(--node-feed-accent)" : "var(--node-feed-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Feed Source" />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-feed-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Droplets className="w-5 h-5" style={{ color: "var(--node-feed-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-feed-text)" }}>
          Feed Source
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>Flow</span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.flow_m3_h.toFixed(1)} m³/h
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>TS</span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.ts_percent.toFixed(1)}%
          </span>
        </div>
        {streamData && (
          <div
            className="flex justify-between items-center pt-1 border-t"
            style={{ borderColor: "var(--node-divider)" }}
          >
            <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>Mass</span>
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              {(streamData.mass_flow_kg_h / 1000).toFixed(1)} t/h
            </span>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-feed-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const FeedNode = memo(FeedNodeComponent);
