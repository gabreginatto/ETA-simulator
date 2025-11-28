/**
 * Polymer Conditioner node for React Flow canvas.
 */
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FlaskConical, AlertTriangle } from "lucide-react";
import type { PolymerNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function PolymerNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as PolymerNodeData;
  const { parameters, effectiveDose, isDoseOutOfRange } = nodeData;
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate effective dose if not provided
  const calculatedEffectiveDose =
    effectiveDose ??
    parameters.jar_test_optimum_ppm *
      parameters.shear_factor *
      parameters.safety_factor;

  return (
    <div
      className={`
        w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible
        ${isDoseOutOfRange ? "border-yellow-500 shadow-yellow-200" : ""}
        ${!isDoseOutOfRange ? "shadow-lg" : ""}
        hover:shadow-lg
      `}
      style={{
        background: "var(--node-polymer-bg)",
        borderColor: isDoseOutOfRange
          ? undefined
          : selected
            ? "var(--node-polymer-accent)"
            : "var(--node-polymer-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Polymer" />
      {/* Warning Tooltip */}
      {isDoseOutOfRange && showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
          Dose outside jar test range
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
          backgroundColor: "var(--node-polymer-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-polymer-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <FlaskConical className="w-5 h-5" style={{ color: "var(--node-polymer-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-polymer-text)" }}>
          Polymer
        </span>
        {isDoseOutOfRange && (
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
            Jar Dose
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.jar_test_optimum_ppm.toFixed(1)} ppm
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Shear
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            ×{parameters.shear_factor.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Safety
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            ×{parameters.safety_factor.toFixed(2)}
          </span>
        </div>
        <div
          className="flex justify-between items-center pt-1 border-t"
          style={{ borderColor: "var(--node-divider)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--node-polymer-accent)" }}>
            Effective
          </span>
          <span className="text-sm font-bold" style={{ color: "var(--node-polymer-text)" }}>
            {calculatedEffectiveDose.toFixed(1)} ppm
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
          backgroundColor: "var(--node-polymer-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const PolymerNode = memo(PolymerNodeComponent);
