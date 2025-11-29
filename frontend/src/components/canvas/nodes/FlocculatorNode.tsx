/**
 * Flocculator node for React Flow canvas.
 * Provides gentle mixing for floc growth.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Wind } from "lucide-react";
import type { FlocculatorNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function FlocculatorNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as FlocculatorNodeData;
  const { parameters, streamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-flocculator-bg)",
        borderColor: selected
          ? "var(--node-flocculator-accent)"
          : "var(--node-flocculator-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Flocculator" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-flocculator-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-flocculator-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Wind className="w-5 h-5" style={{ color: "var(--node-flocculator-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-flocculator-text)" }}>
          Flocculator
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Detention
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.detention_time_min.toFixed(0)} min
          </span>
        </div>
        {parameters.g_value !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              G-Value
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
              {parameters.g_value.toFixed(0)} s⁻¹
            </span>
          </div>
        )}

        {/* Output stream info */}
        {streamData && (
          <div className="pt-1 border-t" style={{ borderColor: "var(--node-divider)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--node-flocculator-text)" }}>
                Out
              </span>
              <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                {streamData.volumetric_flow_m3_h.toFixed(1)} m³/h
              </span>
            </div>
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
          backgroundColor: "var(--node-flocculator-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const FlocculatorNode = memo(FlocculatorNodeComponent);
