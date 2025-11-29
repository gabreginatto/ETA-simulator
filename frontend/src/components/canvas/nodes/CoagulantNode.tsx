/**
 * Coagulant dosing node for React Flow canvas.
 * Adds coagulant chemicals (alum, ferric, PAC) to raw water.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Droplets } from "lucide-react";
import type { CoagulantNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function CoagulantNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as CoagulantNodeData;
  const { parameters, streamData } = nodeData;

  const coagulantLabel = parameters.coagulant_type === "ferric_chloride"
    ? "FeCl₃"
    : parameters.coagulant_type === "pac"
      ? "PAC"
      : parameters.coagulant_type === "alum"
        ? "Alum"
        : "Other";

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-coagulant-bg)",
        borderColor: selected
          ? "var(--node-coagulant-accent)"
          : "var(--node-coagulant-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Coagulant" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-coagulant-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-coagulant-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Droplets className="w-5 h-5" style={{ color: "var(--node-coagulant-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-coagulant-text)" }}>
          Coagulant
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Dose
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.dose_mg_L.toFixed(0)} mg/L
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Type
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {coagulantLabel}
          </span>
        </div>

        {/* Output stream info */}
        {streamData && (
          <div className="pt-1 border-t" style={{ borderColor: "var(--node-divider)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--node-coagulant-text)" }}>
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
          backgroundColor: "var(--node-coagulant-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const CoagulantNode = memo(CoagulantNodeComponent);
