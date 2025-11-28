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
        relative overflow-visible w-44 bg-gradient-to-br from-blue-50 to-cyan-100
        rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? "border-cyan-500 shadow-lg shadow-cyan-200" : "border-cyan-200"}
        hover:shadow-lg hover:border-cyan-400
      `}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Transfer Pump" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-200 bg-cyan-500/10 rounded-t-lg">
        <Activity className="w-5 h-5 text-cyan-600" />
        <span className="text-sm font-semibold text-cyan-800">Transfer Pump</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Head</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.head_m.toFixed(1)} m
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Pump Eff.</span>
          <span className="text-sm font-medium text-gray-700">
            {(parameters.efficiency_pump * 100).toFixed(0)}%
          </span>
        </div>
        
        {/* Calculated Power */}
        <div className="flex justify-between items-center pt-1 border-t border-cyan-100">
           <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-cyan-600 font-medium">Power</span>
           </div>
           <span className="text-sm font-bold text-cyan-700">
             {powerKW !== undefined ? `${powerKW.toFixed(1)} kW` : "-"}
           </span>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white"
      />
    </div>
  );
}

export const PumpNode = memo(PumpNodeComponent);
