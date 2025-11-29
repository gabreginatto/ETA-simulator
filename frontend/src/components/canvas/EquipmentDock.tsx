/**
 * Horizontal equipment dock for adding nodes to the canvas.
 * Dark glass morphism design with icon-only buttons and tooltips.
 * Draggable to reposition on the screen.
 */
import { DragEvent, useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Droplets,
  Zap,
  FlaskConical,
  Filter,
  CircleDot,
  Layers,
  GripVertical,
  Wind,
  ArrowDownToLine,
  ArrowUpFromLine,
  Container,
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

// All equipment items - filtered by profile
const ALL_EQUIPMENT_ITEMS: EquipmentItem[] = [
  // Wastewater Treatment nodes
  {
    type: "feed",
    label: "Feed",
    icon: <Droplets className="w-5 h-5" />,
    color: "text-viz-feed",
    bgColor: "bg-viz-feed/20 hover:bg-viz-feed/30",
    description: "Sludge input source",
  },
  {
    type: "pump",
    label: "Pump",
    icon: <Zap className="w-5 h-5" />,
    color: "text-viz-pump",
    bgColor: "bg-viz-pump/20 hover:bg-viz-pump/30",
    description: "Transfer pump",
  },
  {
    type: "polymer",
    label: "Polymer",
    icon: <FlaskConical className="w-5 h-5" />,
    color: "text-viz-polymer",
    bgColor: "bg-viz-polymer/20 hover:bg-viz-polymer/30",
    description: "Polymer conditioning",
  },
  {
    type: "clarifier",
    label: "Clarifier",
    icon: <CircleDot className="w-5 h-5" />,
    color: "text-viz-clarifier",
    bgColor: "bg-viz-clarifier/20 hover:bg-viz-clarifier/30",
    description: "Gravity clarifier",
  },
  {
    type: "thickener",
    label: "Thickener",
    icon: <Layers className="w-5 h-5" />,
    color: "text-viz-thickener",
    bgColor: "bg-viz-thickener/20 hover:bg-viz-thickener/30",
    description: "Gravity thickener",
  },
  {
    type: "dewatering",
    label: "Dewatering",
    icon: <Filter className="w-5 h-5" />,
    color: "text-viz-dewatering",
    bgColor: "bg-viz-dewatering/20 hover:bg-viz-dewatering/30",
    description: "Dewatering unit",
  },
  // Drinking Water Treatment nodes
  {
    type: "coagulant",
    label: "Coagulant",
    icon: <Droplets className="w-5 h-5" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/20 hover:bg-amber-500/30",
    description: "Coagulant dosing",
  },
  {
    type: "flocculator",
    label: "Flocculator",
    icon: <Wind className="w-5 h-5" />,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/20 hover:bg-indigo-500/30",
    description: "Gentle mixing",
  },
  {
    type: "sedimentation",
    label: "Sedimentation",
    icon: <ArrowDownToLine className="w-5 h-5" />,
    color: "text-pink-500",
    bgColor: "bg-pink-500/20 hover:bg-pink-500/30",
    description: "Gravity settling",
  },
  {
    type: "daf",
    label: "DAF",
    icon: <ArrowUpFromLine className="w-5 h-5" />,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20 hover:bg-cyan-500/30",
    description: "Dissolved air flotation",
  },
  {
    type: "filter",
    label: "Filter",
    icon: <Filter className="w-5 h-5" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/20 hover:bg-emerald-500/30",
    description: "Rapid sand filter",
  },
  {
    type: "clearwell",
    label: "Clearwell",
    icon: <Container className="w-5 h-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/20 hover:bg-blue-500/30",
    description: "Contact tank",
  },
];

// Storage key for persisting dock position
const DOCK_POSITION_KEY = "sludgesim-dock-position";

interface DockPosition {
  x: number;
  y: number;
}

interface EquipmentDockProps {
  className?: string;
}

export function EquipmentDock({ className = "" }: EquipmentDockProps) {
  // Get current profile from store
  const currentProfile: PlantProfile = useStore(
    (state) => state.plantConfiguration.settings.plant_profile || "wastewater"
  );

  // Filter equipment items based on current profile
  const equipmentItems = useMemo(() => {
    const preset = getProfilePreset(currentProfile);
    const availableTypes = new Set(preset.availableNodeTypes);
    return ALL_EQUIPMENT_ITEMS.filter((item) => availableTypes.has(item.type));
  }, [currentProfile]);

  const [dragging, setDragging] = useState<EquipmentType | null>(null);
  const [hoveredItem, setHoveredItem] = useState<EquipmentType | null>(null);

  // Dock dragging state
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const [position, setPosition] = useState<DockPosition | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Load saved position on mount
  useEffect(() => {
    const saved = localStorage.getItem(DOCK_POSITION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (position) {
      localStorage.setItem(DOCK_POSITION_KEY, JSON.stringify(position));
    }
  }, [position]);

  // Handle dock drag start
  const handleDockDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!dockRef.current) return;

    const currentX = position?.x ?? 0;
    const currentY = position?.y ?? 0;

    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      posX: currentX,
      posY: currentY,
    };
    setIsDraggingDock(true);
  }, [position]);

  // Handle dock drag move
  useEffect(() => {
    if (!isDraggingDock) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos.current || !dockRef.current) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      // Calculate new position
      let newX = dragStartPos.current.posX + deltaX;
      let newY = dragStartPos.current.posY + deltaY;

      // Get dock dimensions for bounds
      const { width, height } = dockRef.current.getBoundingClientRect();
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      // Constrain to viewport
      newX = Math.max(-maxX / 2, Math.min(maxX / 2, newX));
      newY = Math.max(-maxY + 50, Math.min(50, newY)); // Keep mostly at bottom

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingDock(false);
      dragStartPos.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingDock]);

  // Reset position to center
  const resetPosition = useCallback(() => {
    setPosition(null);
    localStorage.removeItem(DOCK_POSITION_KEY);
  }, []);

  const onDragStart = (event: DragEvent<HTMLButtonElement>, equipmentType: EquipmentType) => {
    event.dataTransfer.setData("application/reactflow", equipmentType);
    event.dataTransfer.effectAllowed = "move";
    setDragging(equipmentType);
  };

  const onDragEnd = () => {
    setDragging(null);
  };

  return (
    <div
      ref={dockRef}
      className={`
        glass rounded-2xl shadow-dock px-3 py-2
        flex items-center gap-1
        animate-slide-up
        ${isDraggingDock ? "cursor-grabbing" : ""}
        ${className}
      `}
      style={position ? {
        transform: `translate(${position.x}px, ${position.y}px)`,
      } : undefined}
    >
      {/* Drag handle for repositioning dock */}
      <div
        className={`
          flex items-center gap-1 pr-2 border-r border-glass-border
          cursor-grab select-none
          ${isDraggingDock ? "cursor-grabbing" : ""}
        `}
        onMouseDown={handleDockDragStart}
        onDoubleClick={resetPosition}
        title="Drag to reposition, double-click to reset"
      >
        <GripVertical className="w-4 h-4 text-content-subtle" />
        <span className="text-2xs font-medium text-content-subtle uppercase tracking-wider">
          Drag
        </span>
      </div>

      {/* Equipment items */}
      <div className="flex items-center gap-1">
        {equipmentItems.map((item) => (
          <div key={item.type} className="relative">
            <button
              draggable
              onDragStart={(e) => onDragStart(e, item.type)}
              onDragEnd={onDragEnd}
              onMouseEnter={() => setHoveredItem(item.type)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                relative p-2.5 rounded-xl
                transition-all duration-200 ease-out
                cursor-grab active:cursor-grabbing
                ${item.bgColor}
                ${item.color}
                ${dragging === item.type ? "scale-110 ring-2 ring-white/30" : ""}
                hover:scale-110
                focus:outline-none focus:ring-2 focus:ring-primary-400/50
              `}
              aria-label={`Add ${item.label}: ${item.description}`}
            >
              {item.icon}
            </button>

            {/* Tooltip */}
            {hoveredItem === item.type && !dragging && (
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                  px-2.5 py-1.5 rounded-lg
                  bg-surface-elevated border border-glass-border
                  shadow-float
                  whitespace-nowrap
                  animate-fade-in
                  z-50
                "
              >
                <p className="text-xs font-medium text-content-primary">{item.label}</p>
                <p className="text-2xs text-content-subtle">{item.description}</p>
                {/* Arrow */}
                <div
                  className="
                    absolute top-full left-1/2 -translate-x-1/2 -mt-px
                    border-4 border-transparent border-t-surface-elevated
                  "
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
