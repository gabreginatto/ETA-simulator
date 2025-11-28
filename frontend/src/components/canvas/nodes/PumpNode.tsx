/**
 * Transfer Pump node for React Flow canvas.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Activity, Zap } from "lucide-react";
import type { PumpNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function PumpNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as PumpNodeData;
  const { parameters, powerKW } = nodeData;

  return (
    <div
      className={`
        relative overflow-visible w-44 rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? "shadow-lg" : ""}
        hover:shadow-lg
      `}
      style={{
        background: "var(--node-pump-bg)",
        borderColor: selected ? "var(--node-pump-accent)" : "var(--node-pump-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Transfer Pump" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-pump-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-pump-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Activity className="w-5 h-5" style={{ color: "var(--node-pump-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-pump-text)" }}>
          Transfer Pump
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>Head</span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.head_m.toFixed(1)} m
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>Pump Eff.</span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {(parameters.efficiency_pump * 100).toFixed(0)}%
          </span>
        </div>

        {/* Calculated Power */}
        <div
          className="flex justify-between items-center pt-1 border-t"
          style={{ borderColor: "var(--node-divider)" }}
        >
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium" style={{ color: "var(--node-pump-accent)" }}>Power</span>
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--node-pump-text)" }}>
            {powerKW !== undefined ? `${powerKW.toFixed(1)} kW` : "-"}
          </span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-pump-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const PumpNode = memo(PumpNodeComponent);
