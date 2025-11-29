/**
 * Clearwell (contact tank) node for React Flow canvas.
 * Provides contact time for disinfection before distribution.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Container } from "lucide-react";
import type { ClearwellNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function ClearwellNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as ClearwellNodeData;
  const { parameters, streamData } = nodeData;

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-clearwell-bg)",
        borderColor: selected
          ? "var(--node-clearwell-accent)"
          : "var(--node-clearwell-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Clearwell" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-clearwell-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-clearwell-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Container className="w-5 h-5" style={{ color: "var(--node-clearwell-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-clearwell-text)" }}>
          Clearwell
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Volume
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.volume_m3.toFixed(0)} m³
          </span>
        </div>
        {parameters.contact_time_min !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              Contact
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
              {parameters.contact_time_min.toFixed(0)} min
            </span>
          </div>
        )}

        {/* Output stream info */}
        {streamData && (
          <div className="pt-1 border-t" style={{ borderColor: "var(--node-divider)" }}>
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "var(--node-clearwell-text)" }}>
                Finished
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
          backgroundColor: "var(--node-clearwell-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const ClearwellNode = memo(ClearwellNodeComponent);
