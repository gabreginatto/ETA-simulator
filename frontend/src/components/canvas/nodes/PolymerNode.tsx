/**
 * Polymer Conditioner node for React Flow canvas.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FlaskConical } from "lucide-react";
import type { PolymerNodeData } from "../../../types";

function PolymerNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as PolymerNodeData;
  const { parameters, effectiveDose } = nodeData;

  // Calculate effective dose if not provided
  const calculatedEffectiveDose =
    effectiveDose ??
    parameters.jar_test_optimum_ppm *
      parameters.shear_factor *
      parameters.safety_factor;

  return (
    <div
      className={`
        w-44 bg-gradient-to-br from-violet-50 to-purple-100
        rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? "border-violet-500 shadow-lg shadow-violet-200" : "border-violet-200"}
        hover:shadow-lg hover:border-violet-400
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-violet-200 bg-violet-500/10 rounded-t-lg">
        <FlaskConical className="w-5 h-5 text-violet-600" />
        <span className="text-sm font-semibold text-violet-800">Polymer</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Jar Dose</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.jar_test_optimum_ppm.toFixed(1)} ppm
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Shear</span>
          <span className="text-sm font-medium text-gray-700">
            ×{parameters.shear_factor.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Safety</span>
          <span className="text-sm font-medium text-gray-700">
            ×{parameters.safety_factor.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-violet-100">
          <span className="text-xs text-violet-600 font-medium">Effective</span>
          <span className="text-sm font-bold text-violet-700">
            {calculatedEffectiveDose.toFixed(1)} ppm
          </span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white"
      />
    </div>
  );
}

export const PolymerNode = memo(PolymerNodeComponent);
