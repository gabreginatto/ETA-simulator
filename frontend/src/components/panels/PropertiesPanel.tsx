/**
 * Right sidebar panel for editing equipment properties.
 * Dark glass morphism floating drawer design.
 */
import { X, Droplets, FlaskConical, Factory, Activity, Layers, CircleDot } from "lucide-react";
import { useStore, useSelectedNode } from "../../store/useStore";
import { FeedForm } from "../forms/FeedForm";
import { PumpForm } from "../forms/PumpForm";
import { PolymerForm } from "../forms/PolymerForm";
import { DewateringForm } from "../forms/DewateringForm";
import { ClarifierForm } from "../forms/ClarifierForm";
import { ThickenerForm } from "../forms/ThickenerForm";
import type {
  FeedNodeData,
  PumpNodeData,
  PolymerNodeData,
  DewateringNodeData,
  ClarifierNodeData,
  ThickenerNodeData,
} from "../../types";

export function PropertiesPanel() {
  const selectedNode = useSelectedNode();
  const selectNode = useStore((state) => state.selectNode);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full glass rounded-2xl shadow-float flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-16 h-16 bg-surface-highlight rounded-2xl flex items-center justify-center mb-4">
          <Factory className="w-8 h-8 text-content-subtle" />
        </div>
        <h3 className="text-lg font-medium text-content-primary mb-2">
          No Equipment Selected
        </h3>
        <p className="text-sm text-content-secondary">
          Click on a node in the canvas to edit its parameters
        </p>
      </div>
    );
  }

  const nodeData = selectedNode.data;

  // Determine header style based on equipment type
  const getHeaderStyle = () => {
    switch (nodeData.type) {
      case "feed":
        return {
          icon: <Droplets className="w-5 h-5" />,
          title: "Feed Source",
          accentColor: "bg-viz-feed",
          textColor: "text-viz-feed",
        };
      case "pump":
        return {
          icon: <Activity className="w-5 h-5" />,
          title: "Transfer Pump",
          accentColor: "bg-viz-pump",
          textColor: "text-viz-pump",
        };
      case "polymer":
        return {
          icon: <FlaskConical className="w-5 h-5" />,
          title: "Polymer Conditioner",
          accentColor: "bg-viz-polymer",
          textColor: "text-viz-polymer",
        };
      case "dewatering":
        return {
          icon: <Factory className="w-5 h-5" />,
          title: "Dewatering Unit",
          accentColor: "bg-viz-dewatering",
          textColor: "text-viz-dewatering",
        };
      case "clarifier":
        return {
          icon: <CircleDot className="w-5 h-5" />,
          title: "Clarifier",
          accentColor: "bg-viz-clarifier",
          textColor: "text-viz-clarifier",
        };
      case "thickener":
        return {
          icon: <Layers className="w-5 h-5" />,
          title: "Thickener",
          accentColor: "bg-viz-thickener",
          textColor: "text-viz-thickener",
        };
      default:
        return {
          icon: null,
          title: "Equipment",
          accentColor: "bg-content-subtle",
          textColor: "text-content-subtle",
        };
    }
  };

  const headerStyle = getHeaderStyle();

  return (
    <div className="w-80 h-full glass rounded-2xl shadow-float flex flex-col overflow-hidden animate-slide-down">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-3">
          {/* Colored accent dot */}
          <div className={`w-2.5 h-2.5 rounded-full ${headerStyle.accentColor}`} />
          <div className="flex items-center gap-2">
            <span className={headerStyle.textColor}>{headerStyle.icon}</span>
            <h2 className="font-semibold text-content-primary">{headerStyle.title}</h2>
          </div>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1.5 text-content-subtle hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-colors"
          title="Close panel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {nodeData.type === "feed" && (
          <FeedForm
            nodeId={selectedNode.id}
            parameters={(nodeData as FeedNodeData).parameters}
          />
        )}
        {nodeData.type === "pump" && (
          <PumpForm
            nodeId={selectedNode.id}
            parameters={(nodeData as PumpNodeData).parameters}
          />
        )}
        {nodeData.type === "polymer" && (
          <PolymerForm
            nodeId={selectedNode.id}
            parameters={(nodeData as PolymerNodeData).parameters}
          />
        )}
        {nodeData.type === "dewatering" && (
          <DewateringForm
            nodeId={selectedNode.id}
            parameters={(nodeData as DewateringNodeData).parameters}
          />
        )}
        {nodeData.type === "clarifier" && (
          <ClarifierForm
            nodeId={selectedNode.id}
            parameters={(nodeData as ClarifierNodeData).parameters}
          />
        )}
        {nodeData.type === "thickener" && (
          <ThickenerForm
            nodeId={selectedNode.id}
            parameters={(nodeData as ThickenerNodeData).parameters}
          />
        )}
      </div>
    </div>
  );
}
