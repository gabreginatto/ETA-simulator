/**
 * Rapid filter node for React Flow canvas.
 * Removes remaining suspended solids after sedimentation/DAF.
 */
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Filter } from "lucide-react";
import type { FilterNodeData } from "../../../types";
import { NodeDeleteButton } from "./NodeDeleteButton";

function FilterNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as FilterNodeData;
  const { parameters, filteredStreamData, backwashStreamData } = nodeData;

  const mediaLabel = parameters.media_type === "dual_media"
    ? "Dual"
    : parameters.media_type === "gac"
      ? "GAC"
      : "Sand";

  return (
    <div
      className="w-44 rounded-lg shadow-md border-2 transition-all duration-200 relative overflow-visible hover:shadow-lg"
      style={{
        background: "var(--node-filter-bg)",
        borderColor: selected
          ? "var(--node-filter-accent)"
          : "var(--node-filter-border)",
      }}
    >
      <NodeDeleteButton nodeId={id} nodeLabel="Filter" />

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !border-2"
        style={{
          backgroundColor: "var(--node-filter-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{
          backgroundColor: "var(--node-filter-header)",
          borderColor: "var(--node-divider)",
        }}
      >
        <Filter className="w-5 h-5" style={{ color: "var(--node-filter-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--node-filter-text)" }}>
          Filter
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Media
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {mediaLabel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: "var(--node-text-secondary)" }}>
            Run Time
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--node-text-primary)" }}>
            {parameters.run_length_h.toFixed(0)}h
          </span>
        </div>

        {/* Output streams info */}
        {(filteredStreamData || backwashStreamData) && (
          <div className="pt-1 border-t space-y-1" style={{ borderColor: "var(--node-divider)" }}>
            {filteredStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-sky-600">Filtered</span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {filteredStreamData.volumetric_flow_m3_h.toFixed(1)} m³/h
                </span>
              </div>
            )}
            {backwashStreamData && (
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "var(--node-filter-text)" }}>
                  Backwash
                </span>
                <span className="text-xs" style={{ color: "var(--node-text-muted)" }}>
                  {backwashStreamData.volumetric_flow_m3_h.toFixed(2)} m³/h
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Output Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="filtered"
        className="!w-3 !h-3 !bg-sky-500 !border-2"
        style={{
          top: '30%',
          borderColor: "var(--rf-handle-border)",
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="backwash"
        className="!w-3 !h-3 !border-2"
        style={{
          top: '70%',
          backgroundColor: "var(--node-filter-accent)",
          borderColor: "var(--rf-handle-border)",
        }}
      />
    </div>
  );
}

export const FilterNode = memo(FilterNodeComponent);
