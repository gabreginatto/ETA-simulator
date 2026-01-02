/**
 * Mobile equipment editor component.
 * Displays equipment forms in a bottom sheet for mobile editing.
 */
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
import { BottomSheet } from "./BottomSheet";
import { useStore, useSelectedNode } from "../../store/useStore";

// Import all forms
import { FeedForm } from "../forms/FeedForm";
import { PumpForm } from "../forms/PumpForm";
import { PolymerForm } from "../forms/PolymerForm";
import { DewateringForm } from "../forms/DewateringForm";
import { ClarifierForm } from "../forms/ClarifierForm";
import { ThickenerForm } from "../forms/ThickenerForm";
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
  EquipmentType,
} from "../../types";

// Equipment type configuration for headers
const equipmentConfig: Record<EquipmentType, {
  icon: React.ReactNode;
  title: string;
  color: string;
}> = {
  feed: {
    icon: <Droplets className="w-5 h-5" />,
    title: "Feed Source",
    color: "text-cyan-500",
  },
  pump: {
    icon: <Zap className="w-5 h-5" />,
    title: "Transfer Pump",
    color: "text-blue-500",
  },
  polymer: {
    icon: <FlaskConical className="w-5 h-5" />,
    title: "Polymer Conditioner",
    color: "text-purple-500",
  },
  clarifier: {
    icon: <CircleDot className="w-5 h-5" />,
    title: "Clarifier",
    color: "text-green-500",
  },
  thickener: {
    icon: <Layers className="w-5 h-5" />,
    title: "Thickener",
    color: "text-teal-500",
  },
  dewatering: {
    icon: <Filter className="w-5 h-5" />,
    title: "Dewatering Unit",
    color: "text-orange-500",
  },
  coagulant: {
    icon: <Droplets className="w-5 h-5" />,
    title: "Coagulant Dosing",
    color: "text-amber-500",
  },
  flocculator: {
    icon: <Wind className="w-5 h-5" />,
    title: "Flocculator",
    color: "text-indigo-500",
  },
  sedimentation: {
    icon: <ArrowDownToLine className="w-5 h-5" />,
    title: "Sedimentation Basin",
    color: "text-pink-500",
  },
  daf: {
    icon: <ArrowUpFromLine className="w-5 h-5" />,
    title: "DAF Unit",
    color: "text-cyan-500",
  },
  filter: {
    icon: <Filter className="w-5 h-5" />,
    title: "Rapid Filter",
    color: "text-emerald-500",
  },
  clearwell: {
    icon: <Container className="w-5 h-5" />,
    title: "Clearwell",
    color: "text-blue-500",
  },
};

interface MobileEquipmentEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileEquipmentEditor({ isOpen, onClose }: MobileEquipmentEditorProps) {
  const selectedNode = useSelectedNode();
  const selectNode = useStore((state) => state.selectNode);

  const handleClose = () => {
    selectNode(null);
    onClose();
  };

  if (!selectedNode) {
    return null;
  }

  const nodeData = selectedNode.data;
  const type = nodeData.type as EquipmentType;
  const config = equipmentConfig[type] || equipmentConfig.feed;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={config.title}
      titleIcon={config.icon}
      titleColor={config.color}
    >
      {/* Render appropriate form based on equipment type */}
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
    </BottomSheet>
  );
}
