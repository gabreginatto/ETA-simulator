/**
 * Equipment card component for mobile process flow view.
 * Displays equipment with key parameters and visual flow indicators.
 */
import { ChevronRight, Trash2 } from "lucide-react";
import {
  Droplets,
  Zap,
  FlaskConical,
  Filter,
  CircleDot,
  Layers,
  Wind,
  ArrowDownToLine,
  ArrowUpFromLine,
  Container,
} from "lucide-react";
import type { Node } from "@xyflow/react";
import type { EquipmentType, StreamData } from "../../types";

interface EquipmentCardProps {
  node: Node;
  isSelected: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

// Equipment type configuration
const equipmentConfig: Record<EquipmentType, {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  // Wastewater
  feed: {
    icon: <Droplets className="w-5 h-5" />,
    title: "Feed Source",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  pump: {
    icon: <Zap className="w-5 h-5" />,
    title: "Transfer Pump",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  polymer: {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Polymer Conditioner",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  clarifier: {
    icon: <CircleDot className="w-5 h-5" />,
    title: "Clarifier",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  thickener: {
    icon: <Layers className="w-5 h-5" />,
    title: "Thickener",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
  },
  dewatering: {
    icon: <Filter className="w-5 h-5" />,
    title: "Dewatering Unit",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  // Drinking water
  coagulant: {
    icon: <Droplets className="w-5 h-5" />,
    title: "Coagulant Dosing",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  flocculator: {
    icon: <Wind className="w-5 h-5" />,
    title: "Flocculator",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
  },
  sedimentation: {
    icon: <ArrowDownToLine className="w-5 h-5" />,
    title: "Sedimentation Basin",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
  },
  daf: {
    icon: <ArrowUpFromLine className="w-5 h-5" />,
    title: "DAF Unit",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  filter: {
    icon: <Filter className="w-5 h-5" />,
    title: "Rapid Filter",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  clearwell: {
    icon: <Container className="w-5 h-5" />,
    title: "Clearwell",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
};

// Helper to get summary text for each equipment type
function getEquipmentSummary(node: Node): string {
  const data = node.data as Record<string, unknown>;
  const params = data.parameters as Record<string, number> | undefined;
  const type = node.type as EquipmentType;

  if (!params) return "";

  switch (type) {
    case "feed":
      return `${params.flow_m3_h?.toFixed(1) || "—"} m³/h • ${params.ts_percent?.toFixed(1) || "—"}% DS`;
    case "pump":
      return `${params.head_m?.toFixed(0) || "—"} m head • ${((params.efficiency_pump || 0) * 100).toFixed(0)}% eff`;
    case "polymer":
      return `${params.jar_test_optimum_ppm?.toFixed(0) || "—"} ppm target`;
    case "clarifier":
      return `${params.underflow_rate_m3_h?.toFixed(1) || "—"} m³/h underflow`;
    case "thickener":
      return `${params.target_thickened_ts_percent?.toFixed(1) || "—"}% target DS`;
    case "dewatering":
      return `${params.cake_dryness_percent?.toFixed(1) || "—"}% cake • ${((params.capture_rate || 0) * 100).toFixed(0)}% capture`;
    case "coagulant":
      return `${params.dose_mg_L?.toFixed(1) || "—"} mg/L dose`;
    case "flocculator":
      return `${params.detention_time_min?.toFixed(0) || "—"} min detention`;
    case "sedimentation":
      return `${((params.capture_rate || 0) * 100).toFixed(0)}% capture`;
    case "daf":
      return `${((params.capture_rate || 0) * 100).toFixed(0)}% capture`;
    case "filter":
      return `${params.run_length_h?.toFixed(0) || "—"} h run time`;
    case "clearwell":
      return `${params.volume_m3?.toFixed(0) || "—"} m³ volume`;
    default:
      return "";
  }
}

// Helper to get stream info if available
function getStreamInfo(node: Node): string | null {
  const data = node.data as Record<string, unknown>;
  const streamData = data.streamData as StreamData | undefined;

  if (!streamData) return null;

  return `${streamData.volumetric_flow_m3_h.toFixed(1)} m³/h → ${streamData.dry_solids_percent.toFixed(2)}% DS`;
}

export function EquipmentCard({
  node,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onDelete,
}: EquipmentCardProps) {
  const type = node.type as EquipmentType;
  const config = equipmentConfig[type] || equipmentConfig.feed;
  const summary = getEquipmentSummary(node);
  const streamInfo = getStreamInfo(node);

  return (
    <div className="relative">
      {/* Flow connector line - before card (except first) */}
      {!isFirst && (
        <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gradient-to-b from-transparent to-content-subtle/30" />
      )}

      {/* Card */}
      <button
        onClick={() => onSelect(node.id)}
        className={`
          w-full text-left
          p-4 rounded-2xl
          border-2 transition-all duration-200
          ${config.bgColor}
          ${isSelected
            ? `${config.borderColor} ring-2 ring-offset-2 ring-offset-surface-canvas ${config.borderColor.replace('border-', 'ring-')}`
            : "border-transparent hover:border-glass-border"
          }
        `}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${config.bgColor} ${config.color}
          `}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`font-semibold ${config.color}`}>
                {config.title}
              </h3>
              <ChevronRight className="w-4 h-4 text-content-subtle flex-shrink-0" />
            </div>

            {/* Parameters summary */}
            <p className="text-sm text-content-secondary mt-0.5">
              {summary}
            </p>

            {/* Stream data if available */}
            {streamInfo && (
              <p className="text-xs text-content-subtle mt-1 font-mono">
                {streamInfo}
              </p>
            )}
          </div>
        </div>

        {/* Delete button - positioned absolutely */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="absolute top-2 right-2 p-2 text-content-subtle hover:text-status-error rounded-lg hover:bg-status-error/10 transition-colors"
          aria-label="Delete equipment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </button>

      {/* Flow connector line - after card (except last) */}
      {!isLast && (
        <div className="flex flex-col items-center py-2">
          <div className="w-0.5 h-4 bg-content-subtle/30" />
          <div className="w-2 h-2 rounded-full bg-content-subtle/30" />
          <div className="w-0.5 h-4 bg-content-subtle/30" />
        </div>
      )}
    </div>
  );
}
