/**
 * Sedimentation basin node for React Flow canvas.
 * Gravity settling to separate clarified water and sludge.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowDownToLine } from "lucide-react";
import type { SedimentationNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function SedimentationNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as SedimentationNodeData;
  const { parameters, clarifiedStreamData, sludgeStreamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-sedimentation-bg)",
        borderColor: selected
          ? "var(--node-sedimentation-accent)"
          : "var(--node-sedimentation-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Sedimentation" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-sedimentation-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-sedimentation-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <ArrowDownToLine className="w-5 h-5" style={{ color: "var(--node-sedimentation-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-sedimentation-text)" }}>
          Sedimentation
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        {parameters.surface_loading_m3_m2_h !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              Loading
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
              {parameters.surface_loading_m3_m2_h.toFixed(1)} m³/m²·h
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
        {(clarifiedStreamData || sludgeStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {clarifiedStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Clarified</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {clarifiedStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
            {sludgeStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--node-sedimentation-text)" }}>
                  Sludge
                </span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {sludgeStreamData.dry_solids_percent.toFixed(1)}% DS
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
        id="sludge"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '70%',
          backgroundColor: "var(--node-sedimentation-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const SedimentationNode = memo(SedimentationNodeComponent);
