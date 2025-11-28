/**
 * Dewatering Unit node for React Flow canvas.
 */
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Factory, AlertTriangle } from "lucide-react";
import type { DewateringNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function DewateringNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as DewateringNodeData;
  const { parameters, cakeStreamData, liquidStreamData, isOverCapacity } = nodeData;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`
        w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible
        ${isOverCapacity ? "border-yellow-500 shadow-yellow-200" : ""}
        ${!isOverCapacity ? "shadow-lg" : ""}
        hover:shadow-lg
      `}
      style={{
        background: "var(--node-dewatering-bg)",
        borderColor: isOverCapacity
          ? undefined
          : selected
            ? "var(--node-dewatering-accent)"
            : "var(--node-dewatering-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Dewatering" />

      {/* Warning Tooltip */}
      {isOverCapacity && showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
          Flow exceeds unit capacity
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-yellow-800" />
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-dewatering-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-dewatering-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Factory className="w-5 h-5" style={{ color: "var(--node-dewatering-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-dewatering-text)" }}>
          Dewatering
        </span>
        {isOverCapacity && (
          <AlertTriangle
            className="w-4 h-4 text-yellow-600 ml-auto cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Capture
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {(parameters.capture_rate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Cake DS
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.cake_dryness_percent.toFixed(0)}%
          </span>
        </div>
        {parameters.max_flow_m3_h && (
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
              Max Flow
            </span>
            <span className={`text-sm font-medium ${isOverCapacity ? "text-yellow-600" : ""}`} style={!isOverCapacity ? { color: "var(--node-text-primary)" } : undefined}>
              {parameters.max_flow_m3_h.toFixed(0)} m³/h
            </span>
          </div>
        )}

        {/* Output streams info */}
        {(cakeStreamData || liquidStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {cakeStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-600">Cake</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {(cakeStreamData.mass_flow_kg_h / 1000).toFixed(1)} t/h
                </span>
              </div>
            )}
            {liquidStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Liquid</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {liquidStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
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
        id="cake_out"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '30%',
          backgroundColor: "var(--node-dewatering-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="liquid_out"
        className="!w-3 !h-3 !bg-sky-500 !border-2"
        style={{
          top: '70%',
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const DewateringNode = memo(DewateringNodeComponent);
