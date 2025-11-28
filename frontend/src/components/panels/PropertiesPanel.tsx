/**
 * Right sidebar panel for editing equipment properties.
 */
import { X, Droplets, FlaskConical, Factory, Activity } from "lucide-react";
import { useStore, useSelectedNode } from "../../store/useStore";
import { FeedForm } from "../forms/FeedForm";
import { PumpForm } from "../forms/PumpForm";
import { PolymerForm } from "../forms/PolymerForm";
import { DewateringForm } from "../forms/DewateringForm";
import type {
  FeedNodeData,
  PumpNodeData,
  PolymerNodeData,
  DewateringNodeData,
} from "../../types";

export function PropertiesPanel() {
  const selectedNode = useSelectedNode();
  const selectNode = useStore((state) => state.selectNode);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Factory className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Equipment Selected
        </h3>
        <p className="text-sm text-gray-500">
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
          bgColor: "bg-cyan-500",
          textColor: "text-white",
        };
      case "pump":
        return {
          icon: <Activity className="w-5 h-5" />,
          title: "Transfer Pump",
          bgColor: "bg-cyan-500",
          textColor: "text-white",
        };
      case "polymer":
        return {
          icon: <FlaskConical className="w-5 h-5" />,
          title: "Polymer Conditioner",
          bgColor: "bg-violet-500",
          textColor: "text-white",
        };
      case "dewatering":
        return {
          icon: <Factory className="w-5 h-5" />,
          title: "Dewatering Unit",
          bgColor: "bg-orange-500",
          textColor: "text-white",
        };
      default:
        return {
          icon: null,
          title: "Equipment",
          bgColor: "bg-gray-500",
          textColor: "text-white",
        };
    }
  };

  const headerStyle = getHeaderStyle();

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${headerStyle.bgColor} ${headerStyle.textColor}`}
      >
        <div className="flex items-center gap-2">
          {headerStyle.icon}
          <h2 className="font-semibold">{headerStyle.title}</h2>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="p-1 hover:bg-white/20 rounded-md transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
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
      </div>
    </div>
  );
}
