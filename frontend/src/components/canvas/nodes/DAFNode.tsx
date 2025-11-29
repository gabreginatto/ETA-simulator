/**
 * Dissolved Air Flotation (DAF) node for React Flow canvas.
 * Uses air bubbles to float particles to the surface for removal.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowUpFromLine } from "lucide-react";
import type { DAFNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function DAFNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as DAFNodeData;
  const { parameters, clarifiedStreamData, floatStreamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-daf-bg)",
        borderColor: selected
          ? "var(--node-daf-accent)"
          : "var(--node-daf-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="DAF" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-daf-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-daf-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <ArrowUpFromLine className="w-5 h-5" style={{ color: "var(--node-daf-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-daf-text)" }}>
          DAF
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        {parameters.recycle_rate !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              Recycle
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
              {(parameters.recycle_rate * 100).toFixed(0)}%
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Capture
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {(parameters.capture_rate * 100).toFixed(0)}%
          </span>
        </div>

        {/* Output streams info */}
        {(clarifiedStreamData || floatStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {clarifiedStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Clarified</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {clarifiedStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
            {floatStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--node-daf-text)" }}>
                  Float
                </span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {floatStreamData.dry_solids_percent.toFixed(1)}% DS
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="clarified"
        className="!w-3 !h-3 !bg-sky-500 !border-2"
        style={{
          top: '30%',
          borderColor: "var(--rf-handle-border)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="float"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '70%',
          backgroundColor: "var(--node-daf-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const DAFNode = memo(DAFNodeComponent);
