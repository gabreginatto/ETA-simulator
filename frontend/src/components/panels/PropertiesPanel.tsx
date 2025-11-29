/**
 * Right sidebar panel for editing equipment properties.
 * Dark glass morphism floating drawer design.
 */
import {
  X,
  Droplets,
  FlaskConical,
  Factory,
  Activity,
  Layers,
  CircleDot,
  Wind,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Container,
} from "lucide-react";
import { useStore, useSelectedNode } from "../../store/useStore";
import { FeedForm } from "../forms/FeedForm";
import { PumpForm } from "../forms/PumpForm";
import { PolymerForm } from "../forms/PolymerForm";
import { DewateringForm } from "../forms/DewateringForm";
import { ClarifierForm } from "../forms/ClarifierForm";
import { ThickenerForm } from "../forms/ThickenerForm";
// Drinking Water Treatment forms
import { CoagulantForm } from "../forms/CoagulantForm";
import { FlocculatorForm } from "../forms/FlocculatorForm";
import { SedimentationForm } from "../forms/SedimentationForm";
import { DAFForm } from "../forms/DAFForm";
import { FilterForm } from "../forms/FilterForm";
import { ClearwellForm } from "../forms/ClearwellForm";
import type {
  FeedNodeData,
  PumpNodeData,
  PolymerNodeData,
  DewateringNodeData,
  ClarifierNodeData,
  ThickenerNodeData,
  CoagulantNodeData,
  FlocculatorNodeData,
  SedimentationNodeData,
  DAFNodeData,
  FilterNodeData,
  ClearwellNodeData,
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
      // Wastewater treatment nodes
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
      // Drinking water treatment nodes
      case "coagulant":
        return {
          icon: <Droplets className="w-5 h-5" />,
          title: "Coagulant Dosing",
          accentColor: "bg-amber-500",
          textColor: "text-amber-500",
        };
      case "flocculator":
        return {
          icon: <Wind className="w-5 h-5" />,
          title: "Flocculator",
          accentColor: "bg-indigo-500",
          textColor: "text-indigo-500",
        };
      case "sedimentation":
        return {
          icon: <ArrowDownToLine className="w-5 h-5" />,
          title: "Sedimentation Basin",
          accentColor: "bg-pink-500",
          textColor: "text-pink-500",
        };
      case "daf":
        return {
          icon: <ArrowUpFromLine className="w-5 h-5" />,
          title: "Dissolved Air Flotation",
          accentColor: "bg-cyan-500",
          textColor: "text-cyan-500",
        };
      case "filter":
        return {
          icon: <Filter className="w-5 h-5" />,
          title: "Rapid Filter",
          accentColor: "bg-emerald-500",
          textColor: "text-emerald-500",
        };
      case "clearwell":
        return {
          icon: <Container className="w-5 h-5" />,
          title: "Clearwell",
          accentColor: "bg-blue-500",
          textColor: "text-blue-500",
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
        {/* Wastewater treatment forms */}
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
        {/* Drinking water treatment forms */}
        {nodeData.type === "coagulant" && (
          <CoagulantForm
            nodeId={selectedNode.id}
            parameters={(nodeData as CoagulantNodeData).parameters}
          />
        )}
        {nodeData.type === "flocculator" && (
          <FlocculatorForm
            nodeId={selectedNode.id}
            parameters={(nodeData as FlocculatorNodeData).parameters}
          />
        )}
        {nodeData.type === "sedimentation" && (
          <SedimentationForm
            nodeId={selectedNode.id}
            parameters={(nodeData as SedimentationNodeData).parameters}
          />
        )}
        {nodeData.type === "daf" && (
          <DAFForm
            nodeId={selectedNode.id}
            parameters={(nodeData as DAFNodeData).parameters}
          />
        )}
        {nodeData.type === "filter" && (
          <FilterForm
            nodeId={selectedNode.id}
            parameters={(nodeData as FilterNodeData).parameters}
          />
        )}
        {nodeData.type === "clearwell" && (
          <ClearwellForm
            nodeId={selectedNode.id}
            parameters={(nodeData as ClearwellNodeData).parameters}
          />
        )}
      </div>
    </div>
  );
}
