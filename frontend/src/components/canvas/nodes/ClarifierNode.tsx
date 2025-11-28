/**
 * Clarifier node for React Flow canvas.
 * Separates sludge into overflow (liquid) and underflow (concentrated sludge).
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Layers } from "lucide-react";
import type { ClarifierNodeData } from "../../../types";

function ClarifierNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ClarifierNodeData;
  const { parameters, overflowStreamData, underflowStreamData } = nodeData;

  return (
    <div
      className={`
        w-44 bg-gradient-to-br from-blue-50 to-sky-100
        rounded-lg shadow-md border-2 transition-all duration-200 relative
        ${selected ? "border-blue-500 shadow-lg shadow-blue-200" : "border-blue-200"}
        hover:shadow-lg hover:border-blue-400
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-blue-200 bg-blue-500/10 rounded-t-lg">
        <Layers className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">Clarifier</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Underflow</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.underflow_rate_m3_h.toFixed(1)} m³/h
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Capture</span>
          <span className="text-sm font-medium text-gray-700">
            {((parameters.capture_rate ?? 0.98) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Output streams info */}
        {(overflowStreamData || underflowStreamData) && (
          <div className="pt-1 border-t border-blue-100 space-y-1">
            {overflowStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Overflow</span>
                <span className="text-xs text-gray-500">
                  {overflowStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
            {underflowStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-700">Underflow</span>
                <span className="text-xs text-gray-500">
                  {underflowStreamData.dry_solids_percent.toFixed(1)}% DS
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-8">
        {/* Overflow output - top (liquid) */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="overflow"
            className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white !top-0"
            style={{ top: -16 }}
          />
          <span className="absolute right-4 -top-4 text-[10px] text-sky-600 font-medium whitespace-nowrap">
            Overflow
          </span>
        </div>
        {/* Underflow output - bottom (sludge) */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="underflow"
            className="!w-3 !h-3 !bg-blue-600 !border-2 !border-white !top-0"
            style={{ top: 16 }}
          />
          <span className="absolute right-4 top-3 text-[10px] text-blue-700 font-medium whitespace-nowrap">
            Underflow
          </span>
        </div>
      </div>
    </div>
  );
}

export const ClarifierNode = memo(ClarifierNodeComponent);
