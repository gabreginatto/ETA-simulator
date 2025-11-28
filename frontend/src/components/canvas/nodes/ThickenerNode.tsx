/**
 * Thickener node for React Flow canvas.
 * Concentrates sludge to a target solids percentage, outputs thickened sludge and supernatant.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CircleDot } from "lucide-react";
import type { ThickenerNodeData } from "../../../types";

function ThickenerNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ThickenerNodeData;
  const { parameters, thickenedStreamData, supernatantStreamData } = nodeData;

  return (
    <div
      className={`
        w-44 bg-gradient-to-br from-emerald-50 to-green-100
        rounded-lg shadow-md border-2 transition-all duration-200 relative
        ${selected ? "border-emerald-500 shadow-lg shadow-emerald-200" : "border-emerald-200"}
        hover:shadow-lg hover:border-emerald-400
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-200 bg-emerald-500/10 rounded-t-lg">
        <CircleDot className="w-5 h-5 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">Thickener</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Target TS</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.target_thickened_ts_percent.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Capture</span>
          <span className="text-sm font-medium text-gray-700">
            {((parameters.capture_rate ?? 0.95) * 100).toFixed(0)}%
          </span>
        </div>

        {/* Output streams info */}
        {(thickenedStreamData || supernatantStreamData) && (
          <div className="pt-1 border-t border-emerald-100 space-y-1">
            {thickenedStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-700">Thickened</span>
                <span className="text-xs text-gray-500">
                  {thickenedStreamData.dry_solids_percent.toFixed(1)}% DS
                </span>
              </div>
            )}
            {supernatantStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-teal-600">Supernatant</span>
                <span className="text-xs text-gray-500">
                  {supernatantStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-8">
        {/* Thickened output - top (sludge) */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="thickened"
            className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white !top-0"
            style={{ top: -16 }}
          />
          <span className="absolute right-4 -top-4 text-[10px] text-emerald-700 font-medium whitespace-nowrap">
            Thickened
          </span>
        </div>
        {/* Supernatant output - bottom (liquid) */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="supernatant"
            className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white !top-0"
            style={{ top: 16 }}
          />
          <span className="absolute right-4 top-3 text-[10px] text-teal-600 font-medium whitespace-nowrap">
            Supernatant
          </span>
        </div>
      </div>
    </div>
  );
}

export const ThickenerNode = memo(ThickenerNodeComponent);
