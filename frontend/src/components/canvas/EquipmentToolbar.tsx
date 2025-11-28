/**
 * Equipment toolbar for adding new equipment nodes to the canvas.
 * Supports drag-and-drop to add equipment at specific positions.
 */
import { DragEvent } from "react";
import {
  Droplets,
  Zap,
  FlaskConical,
  Filter,
  CircleDot,
  Layers,
} from "lucide-react";
import type { EquipmentType } from "../../types";

interface EquipmentItem {
  type: EquipmentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    type: "feed",
    label: "Feed Source",
    icon: <Droplets className="w-5 h-5" />,
    color: "bg-cyan-100 border-cyan-300 text-cyan-700 hover:bg-cyan-200",
    description: "Sludge input source",
  },
  {
    type: "pump",
    label: "Pump",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-cyan-100 border-cyan-300 text-cyan-600 hover:bg-cyan-200",
    description: "Transfer pump",
  },
  {
    type: "polymer",
    label: "Polymer",
    icon: <FlaskConical className="w-5 h-5" />,
    color: "bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200",
    description: "Polymer conditioning",
  },
  {
    type: "clarifier",
    label: "Clarifier",
    icon: <CircleDot className="w-5 h-5" />,
    color: "bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200",
    description: "Gravity clarifier",
  },
  {
    type: "thickener",
    label: "Thickener",
    icon: <Layers className="w-5 h-5" />,
    color: "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200",
    description: "Gravity thickener",
  },
  {
    type: "dewatering",
    label: "Dewatering",
    icon: <Filter className="w-5 h-5" />,
    color: "bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200",
    description: "Dewatering unit",
  },
];

interface EquipmentToolbarProps {
  className?: string;
}

export function EquipmentToolbar({ className = "" }: EquipmentToolbarProps) {
  const onDragStart = (event: DragEvent<HTMLDivElement>, equipmentType: EquipmentType) => {
    event.dataTransfer.setData("application/reactflow", equipmentType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      className={`absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 ${className}`}
    >
      <div className="text-xs font-medium text-gray-500 mb-2 px-1">
        Equipment
      </div>
      <div className="flex flex-col gap-1">
        {EQUIPMENT_ITEMS.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => onDragStart(e, item.type)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-grab active:cursor-grabbing transition-colors ${item.color}`}
            title={item.description}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-gray-400 mt-2 px-1">
        Drag to canvas
      </div>
    </div>
  );
}
