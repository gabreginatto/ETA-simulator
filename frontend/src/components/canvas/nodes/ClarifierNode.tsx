/**
 * Clarifier node for React Flow canvas.
 * Separates sludge into overflow (liquid) and underflow (concentrated sludge).
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";
import type { ClarifierNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function ClarifierNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as ClarifierNodeData;
  const { parameters, overflowStreamData, underflowStreamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-clarifier-bg)",
        borderColor: selected
          ? "var(--node-clarifier-accent)"
          : "var(--node-clarifier-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Clarifier" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-clarifier-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-clarifier-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Layers className="w-5 h-5" style={{ color: "var(--node-clarifier-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-clarifier-text)" }}>
          Clarifier
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Underflow
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.underflow_rate_m3_h.toFixed(1)} m³/h
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Capture
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {((parameters.capture_rate ?? 0.98) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Output streams info */}
        {(overflowStreamData || underflowStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {overflowStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Overflow</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {overflowStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
            {underflowStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--node-clarifier-text)" }}>
                  Underflow
                </span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {underflowStreamData.dry_solids_percent.toFixed(1)}% DS
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles - positioned at the right edge */}
      <Handle
        type="source"
        position={Position.Right}
        id="overflow"
        className="!w-3 !h-3 !bg-sky-500 !border-2"
        style={{
          top: '30%',
          borderColor: "var(--rf-handle-border)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="underflow"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '70%',
          backgroundColor: "var(--node-clarifier-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const ClarifierNode = memo(ClarifierNodeComponent);
