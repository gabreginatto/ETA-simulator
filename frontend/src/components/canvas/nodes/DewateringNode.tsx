/**
 * Dewatering Unit node for React Flow canvas.
 */
import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Factory, AlertTriangle } from "lucide-react";
import type { DewateringNodeData } from "../../../types";

function DewateringNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as DewateringNodeData;
  const { parameters, cakeStreamData, liquidStreamData, isOverCapacity } = nodeData;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`
        w-44 bg-gradient-to-br from-amber-50 to-orange-100
        rounded-lg shadow-md border-2 transition-all duration-200 relative
        ${isOverCapacity ? "border-yellow-500 shadow-yellow-200" : ""}
        ${selected && !isOverCapacity ? "border-orange-500 shadow-lg shadow-orange-200" : ""}
        ${!selected && !isOverCapacity ? "border-orange-200" : ""}
        hover:shadow-lg hover:border-orange-400
      `}
    >
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
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-orange-200 bg-orange-500/10 rounded-t-lg">
        <Factory className="w-5 h-5 text-orange-600" />
        <span className="text-sm font-semibold text-orange-800">Dewatering</span>
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
          <span className="text-xs text-gray-500">Capture</span>
          <span className="text-sm font-medium text-gray-700">
            {(parameters.capture_rate * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Cake DS</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.cake_dryness_percent.toFixed(0)}%
          </span>
        </div>
        {parameters.max_flow_m3_h && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Max Flow</span>
            <span className={`text-sm font-medium ${isOverCapacity ? "text-yellow-600" : "text-gray-700"}`}>
              {parameters.max_flow_m3_h.toFixed(0)} m³/h
            </span>
          </div>
        )}

        {/* Output streams info */}
        {(cakeStreamData || liquidStreamData) && (
          <div className="pt-1 border-t border-orange-100 space-y-1">
            {cakeStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-600">Cake</span>
                <span className="text-xs text-gray-500">
                  {(cakeStreamData.mass_flow_kg_h / 1000).toFixed(1)} t/h
                </span>
              </div>
            )}
            {liquidStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Liquid</span>
                <span className="text-xs text-gray-500">
                  {liquidStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-8">
        {/* Cake output - top */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="cake_out"
            className="!w-3 !h-3 !bg-amber-600 !border-2 !border-white !top-0"
            style={{ top: -16 }}
          />
          <span className="absolute right-4 -top-4 text-[10px] text-amber-600 font-medium whitespace-nowrap">
            Cake
          </span>
        </div>
        {/* Liquid output - bottom */}
        <div className="relative">
          <Handle
            type="source"
            position={Position.Right}
            id="liquid_out"
            className="!w-3 !h-3 !bg-sky-500 !border-2 !border-white !top-0"
            style={{ top: 16 }}
          />
          <span className="absolute right-4 top-3 text-[10px] text-sky-600 font-medium whitespace-nowrap">
            Liquid
          </span>
        </div>
      </div>
    </div>
  );
}

export const DewateringNode = memo(DewateringNodeComponent);
