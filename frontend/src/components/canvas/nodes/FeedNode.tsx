/**
 * Feed Source node for React Flow canvas.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Droplets } from "lucide-react";
import type { FeedNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function FeedNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as FeedNodeData;
  const { parameters, streamData } = nodeData;

  return (
    <div
      className={`
        relative overflow-visible w-44 bg-gradient-to-br from-cyan-50 to-blue-100
        rounded-lg shadow-md border-2 transition-all duration-200
        ${selected ? "border-cyan-500 shadow-lg shadow-cyan-200" : "border-cyan-200"}
        hover:shadow-lg hover:border-cyan-400
      `}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Feed Source" />

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-200 bg-cyan-500/10 rounded-t-lg">
        <Droplets className="w-5 h-5 text-cyan-600" />
        <span className="text-sm font-semibold text-cyan-800">Feed Source</span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Flow</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.flow_m3_h.toFixed(1)} m³/h
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">TS</span>
          <span className="text-sm font-medium text-gray-700">
            {parameters.ts_percent.toFixed(1)}%
          </span>
        </div>
        {streamData && (
          <div className="flex justify-between items-center pt-1 border-t border-cyan-100">
            <span className="text-xs text-gray-400">Mass</span>
            <span className="text-xs text-gray-500">
              {(streamData.mass_flow_kg_h / 1000).toFixed(1)} t/h
            </span>
          </div>
        )}
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

export const FeedNode = memo(FeedNodeComponent);
