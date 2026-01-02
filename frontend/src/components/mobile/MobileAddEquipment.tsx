/**
 * Mobile equipment addition grid.
 * Displays available equipment types in a touch-friendly grid layout.
 */
import { useMemo } from "react";
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
  Plus,
} from "lucide-react";
import type { EquipmentType, PlantProfile } from "../../types";
import { useStore } from "../../store/useStore";
import { getProfilePreset } from "../../config/profilePresets";

interface EquipmentItem {
  type: EquipmentType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
}

// All equipment items
const ALL_EQUIPMENT_ITEMS: EquipmentItem[] = [
  // Wastewater Treatment nodes
  {
    type: "feed",
    label: "Feed Source",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    description: "Sludge input",
  },
  {
    type: "pump",
    label: "Pump",
    icon: <Zap className="w-6 h-6" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    description: "Transfer pump",
  },
  {
    type: "polymer",
    label: "Polymer",
    icon: <FlaskConical className="w-6 h-6" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
    description: "Conditioning",
  },
  {
    type: "clarifier",
    label: "Clarifier",
    icon: <CircleDot className="w-6 h-6" />,
    color: "text-green-500",
    bgColor: "bg-green-500/20",
    description: "Gravity settling",
  },
  {
    type: "thickener",
    label: "Thickener",
    icon: <Layers className="w-6 h-6" />,
    color: "text-teal-500",
    bgColor: "bg-teal-500/20",
    description: "Concentration",
  },
  {
    type: "dewatering",
    label: "Dewatering",
    icon: <Filter className="w-6 h-6" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
    description: "Final drying",
  },
  // Drinking Water Treatment nodes
  {
    type: "coagulant",
    label: "Coagulant",
    icon: <Droplets className="w-6 h-6" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
    description: "Chemical dosing",
  },
  {
    type: "flocculator",
    label: "Flocculator",
    icon: <Wind className="w-6 h-6" />,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/20",
    description: "Gentle mixing",
  },
  {
    type: "sedimentation",
    label: "Sedimentation",
    icon: <ArrowDownToLine className="w-6 h-6" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
    description: "Gravity settling",
  },
  {
    type: "daf",
    label: "DAF",
    icon: <ArrowUpFromLine className="w-6 h-6" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
    description: "Flotation",
  },
  {
    type: "filter",
    label: "Filter",
    icon: <Filter className="w-6 h-6" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    description: "Rapid sand",
  },
  {
    type: "clearwell",
    label: "Clearwell",
    icon: <Container className="w-6 h-6" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
    description: "Storage tank",
  },
];

interface MobileAddEquipmentProps {
  onEquipmentAdded?: () => void;
}

export function MobileAddEquipment({ onEquipmentAdded }: MobileAddEquipmentProps) {
  const addNode = useStore((state) => state.addNode);
  const nodes = useStore((state) => state.nodes);
  const currentProfile: PlantProfile = useStore(
    (state) => state.plantConfiguration.settings.plant_profile || "wastewater"
  );

  // Filter equipment items based on current profile
  const equipmentItems = useMemo(() => {
    const preset = getProfilePreset(currentProfile);
    const availableTypes = new Set(preset.availableNodeTypes);
    return ALL_EQUIPMENT_ITEMS.filter((item) => availableTypes.has(item.type));
  }, [currentProfile]);

  // Calculate position for new node (stagger below existing nodes)
  const getNewNodePosition = () => {
    if (nodes.length === 0) {
      return { x: 100, y: 100 };
    }

    // Find the rightmost and bottommost node
    const maxX = Math.max(...nodes.map((n) => n.position.x));
    const maxY = Math.max(...nodes.map((n) => n.position.y));

    // Place new node to the right or below depending on count
    if (nodes.length % 3 === 0) {
      return { x: 100, y: maxY + 150 };
    }
    return { x: maxX + 250, y: nodes[nodes.length - 1]?.position.y || 100 };
  };

  const handleAddEquipment = (type: EquipmentType) => {
    const position = getNewNodePosition();
    addNode(type, position);
    onEquipmentAdded?.();
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-content-primary">
          Add Equipment
        </h2>
        <p className="text-sm text-content-secondary">
          Tap to add to your {currentProfile === "wastewater" ? "wastewater" : "drinking water"} treatment process
        </p>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-2 gap-3">
        {equipmentItems.map((item) => (
          <button
            key={item.type}
            onClick={() => handleAddEquipment(item.type)}
            className={`
              p-4 rounded-2xl border-2 border-transparent
              ${item.bgColor}
              hover:border-glass-border
              active:scale-95
              transition-all duration-200
              text-left
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                bg-surface-canvas/50
                ${item.color}
              `}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${item.color}`}>
                  {item.label}
                </h3>
                <p className="text-xs text-content-secondary mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end mt-2">
              <span className="text-xs text-content-subtle flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Quick tip */}
      <div className="mt-6 p-4 bg-surface-elevated rounded-xl border border-glass-border">
        <p className="text-sm text-content-secondary">
          <span className="font-medium text-content-primary">Tip:</span> Equipment will be automatically connected in the order you add them. You can reorder from the Flow view.
        </p>
      </div>
    </div>
  );
}
