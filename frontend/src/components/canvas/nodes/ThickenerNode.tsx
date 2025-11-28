/**
 * Thickener node for React Flow canvas.
 * Concentrates sludge to a target solids percentage, outputs thickened sludge and supernatant.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CircleDot } from "lucide-react";
import type { ThickenerNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function ThickenerNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as ThickenerNodeData;
  const { parameters, thickenedStreamData, supernatantStreamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-thickener-bg)",
        borderColor: selected
          ? "var(--node-thickener-accent)"
          : "var(--node-thickener-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Thickener" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-thickener-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-thickener-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <CircleDot className="w-5 h-5" style={{ color: "var(--node-thickener-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-thickener-text)" }}>
          Thickener
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Target TS
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.target_thickened_ts_percent.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Capture
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {((parameters.capture_rate ?? 0.95) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Output streams info */}
        {(thickenedStreamData || supernatantStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {thickenedStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--node-thickener-text)" }}>
                  Thickened
                </span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {thickenedStreamData.dry_solids_percent.toFixed(1)}% DS
                </span>
              </div>
            )}
            {supernatantStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-teal-600">Supernatant</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {supernatantStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
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
        id="thickened"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '30%',
          backgroundColor: "var(--node-thickener-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="supernatant"
        className="!w-3 !h-3 !bg-teal-500 !border-2"
        style={{
          top: '70%',
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const ThickenerNode = memo(ThickenerNodeComponent);
