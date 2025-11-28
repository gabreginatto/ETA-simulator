/**
 * Thickener node for React Flow canvas.
 * Concentrates sludge to a target solids percentage, outputs thickened sludge and supernatant.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CircleDot } from "lucide-react";
import type { ThickenerNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function ThickenerNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as ThickenerNodeData;
  const { parameters, thickenedStreamData, supernatantStreamData } = nodeData;

  return (
    <div
      className={`
        w-44 bg-gradient-to-br from-emerald-50 to-green-100
        rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible
        ${selected ? "border-emerald-500 shadow-lg shadow-emerald-200" : "border-emerald-200"}
        hover:shadow-lg hover:border-emerald-400
      `}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Thickener" />

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

      {/* Output Handles - positioned at the right edge */}
      <Handle
        type="source"
        position={Position.Right}
        id="thickened"
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white"
        style={{ top: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="supernatant"
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white"
        style={{ top: '70%' }}
      />
    </div>
  );
}

export const ThickenerNode = memo(ThickenerNodeComponent);
