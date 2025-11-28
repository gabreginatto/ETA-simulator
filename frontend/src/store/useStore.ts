/**
 * Main Zustand store for SludgeSim application state.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Node, Edge, NodeChange, EdgeChange } from "@xyflow/react";
import type {
  EquipmentNodeData,
  FeedNodeData,
  PumpNodeData,
  PolymerNodeData,
  DewateringNodeData,
  ClarifierNodeData,
  ThickenerNodeData,
  PlantConfiguration,
  Project,
  SimulationResult,
  JarTest,
  FeedSourceParams,
  PumpParams,
  PolymerConditionerParams,
  DewateringUnitParams,
  ClarifierParams,
  ThickenerParams,
  GraphNode,
  GraphEdge,
  EquipmentType,
} from "../types";
import type { ValidationError } from "../api/client";

// Re-export ValidationError type for convenience
export type { ValidationError };

// Default plant configuration
const DEFAULT_PLANT_CONFIG: PlantConfiguration = {
  feed_source: {
    parameters: {
      flow_m3_h: 100.0,
      ts_percent: 3.0,
      temperature_C: 20.0,
    },
  },
  transfer_pump: {
    parameters: {
      head_m: 20.0,
      efficiency_pump: 0.7,
      efficiency_motor: 0.9,
    },
  },
  polymer_conditioner: {
    parameters: {
      jar_test_optimum_ppm: 15.0,
      shear_factor: 1.2,
      safety_factor: 1.1,
    },
  },
  dewatering_unit: {
    parameters: {
      max_flow_m3_h: 150.0,
      capture_rate: 0.95,
      cake_dryness_percent: 23.0,
      polymer_split_cake: 0.3,
    },
  },
  settings: {
    // Basic settings
    polymer_price_per_kg: 5.0,
    electricity_price_per_kwh: 0.12,
    operating_hours_per_day: 24.0,
    currency: "BRL",

    // TCO defaults
    water_cost_per_m3: 2.0,
    disposal_cost_per_ton_wet: 100.0,
    storage_cost_per_kg: 0.5,
    handling_cost_per_kg: 0.2,
  },
};

// Default nodes for the canvas
// Note: measured property is needed for MiniMap to render nodes correctly in React Flow v12
const createDefaultNodes = (): Node<EquipmentNodeData>[] => [
  {
    id: "feed-1",
    type: "feed",
    position: { x: 50, y: 200 },
    measured: { width: 176, height: 100 },
    data: {
      type: "feed",
      label: "Feed Source",
      parameters: { ...DEFAULT_PLANT_CONFIG.feed_source.parameters },
    } as FeedNodeData,
  },
  {
    id: "pump-1",
    type: "pump",
    position: { x: 300, y: 200 },
    measured: { width: 176, height: 120 },
    data: {
      type: "pump",
      label: "Transfer Pump",
      parameters: { ...DEFAULT_PLANT_CONFIG.transfer_pump!.parameters },
    } as PumpNodeData,
  },
  {
    id: "polymer-1",
    type: "polymer",
    position: { x: 550, y: 200 },
    measured: { width: 176, height: 140 },
    data: {
      type: "polymer",
      label: "Polymer Conditioner",
      parameters: { ...DEFAULT_PLANT_CONFIG.polymer_conditioner.parameters },
    } as PolymerNodeData,
  },
  {
    id: "dewatering-1",
    type: "dewatering",
    position: { x: 800, y: 200 },
    measured: { width: 176, height: 140 },
    data: {
      type: "dewatering",
      label: "Dewatering Unit",
      parameters: { ...DEFAULT_PLANT_CONFIG.dewatering_unit.parameters },
    } as DewateringNodeData,
  },
];

// Default edges connecting the nodes
const createDefaultEdges = (): Edge[] => [
  {
    id: "feed-to-pump",
    source: "feed-1",
    target: "pump-1",
    sourceHandle: "output",
    targetHandle: "input",
    type: "stream",
  },
  {
    id: "pump-to-polymer",
    source: "pump-1",
    target: "polymer-1",
    sourceHandle: "output",
    targetHandle: "input",
    type: "stream",
  },
  {
    id: "polymer-to-dewatering",
    source: "polymer-1",
    target: "dewatering-1",
    sourceHandle: "output",
    targetHandle: "input",
    type: "stream",
  },
];

// Scenario for TCO comparison
interface ScenarioSnapshot {
  name: string;
  timestamp: number;
  settings: PlantConfiguration["settings"];
  result: SimulationResult;
}

// Theme type
type Theme = "light" | "dark";

interface PlantState {
  // UI state
  theme: Theme;

  // React Flow state
  nodes: Node<EquipmentNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Plant configuration
  plantConfiguration: PlantConfiguration;

  // Project state
  currentProject: Project | null;

  // Simulation state
  simulationResult: SimulationResult | null;
  isSimulating: boolean;

  // Validation state
  validationErrors: ValidationError[];
  validationWarnings: ValidationError[];
  isValidating: boolean;

  // Jar tests
  jarTests: JarTest[];
  selectedJarTestId: string | null;

  // TCO Scenario comparison (two slots for A/B comparison)
  savedScenarios: {
    A: ScenarioSnapshot | null;
    B: ScenarioSnapshot | null;
  };
  activeComparisonSlot: "A" | "B";  // Which slot to compare current against

  // Actions
  initializeDefaultPlant: () => void;
  setNodes: (nodes: Node<EquipmentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  updateNodeParameters: (
    nodeId: string,
    params: Partial<FeedSourceParams | PumpParams | PolymerConditionerParams | DewateringUnitParams | ClarifierParams | ThickenerParams>
  ) => void;
  selectNode: (nodeId: string | null) => void;
  setPlantConfiguration: (config: PlantConfiguration) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setIsSimulating: (value: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  loadProject: (project: Project) => void;
  resetToDefault: () => void;
  setJarTests: (tests: JarTest[]) => void;
  selectJarTest: (id: string | null) => void;
  updateStreamData: (result: SimulationResult) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setValidationWarnings: (warnings: ValidationError[]) => void;
  setIsValidating: (value: boolean) => void;
  clearValidation: () => void;

  // TCO Scenario comparison actions
  saveScenarioToSlot: (slot: "A" | "B", name: string) => void;
  clearScenarioSlot: (slot: "A" | "B") => void;
  setActiveComparisonSlot: (slot: "A" | "B") => void;
  swapScenarioSlots: () => void;

  // Dynamic node/edge actions
  addNode: (type: EquipmentType, position: { x: number; y: number }) => string;
  deleteNode: (nodeId: string) => void;
  addEdge: (sourceId: string, targetId: string, sourceHandle: string, targetHandle: string) => void;

  // UI actions
  setTheme: (theme: Theme) => void;
}

// Get initial theme from localStorage or default to light
const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("sludgesim-theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  }
  return "light";
};

export const useStore = create<PlantState>()(
  immer((set) => ({
    // Initial state
    theme: getInitialTheme(),
    nodes: createDefaultNodes(),
    edges: createDefaultEdges(),
    selectedNodeId: null,
    plantConfiguration: { ...DEFAULT_PLANT_CONFIG },
    currentProject: null,
    simulationResult: null,
    isSimulating: false,
    validationErrors: [],
    validationWarnings: [],
    isValidating: false,
    jarTests: [],
    selectedJarTestId: null,
    savedScenarios: { A: null, B: null },
    activeComparisonSlot: "A",

    // Initialize default plant layout
    initializeDefaultPlant: () =>
      set((state) => {
        state.nodes = createDefaultNodes();
        state.edges = createDefaultEdges();
        state.plantConfiguration = { ...DEFAULT_PLANT_CONFIG };
        state.simulationResult = null;
        state.selectedNodeId = null;
      }),

    // React Flow node/edge setters
    setNodes: (nodes) =>
      set((state) => {
        state.nodes = nodes;
      }),

    setEdges: (edges) =>
      set((state) => {
        state.edges = edges;
      }),

    // Handle React Flow node changes (position, etc.)
    // Note: Selection is handled separately via onSelectionChange in FlowCanvas
    onNodesChange: (changes: NodeChange[]) =>
      set((state) => {
        changes.forEach((change: NodeChange) => {
          if (change.type === "position" && "position" in change && change.position) {
            const node = state.nodes.find((n: Node<EquipmentNodeData>) => n.id === change.id);
            if (node) {
              node.position = change.position;
            }
          }
          // Selection changes are intentionally not handled here - they're managed
          // via handleSelectionChange in FlowCanvas to prevent panel from closing
          // when interacting with form inputs
        });
      }),

    // Handle React Flow edge changes
    onEdgesChange: (changes: EdgeChange[]) =>
      set((state) => {
        changes.forEach((change: EdgeChange) => {
          if (change.type === "remove") {
            state.edges = state.edges.filter((e: Edge) => e.id !== change.id);
          }
        });
      }),

    // Update node parameters and sync with plantConfiguration
    updateNodeParameters: (nodeId, params) =>
      set((state) => {
        const node = state.nodes.find((n: Node<EquipmentNodeData>) => n.id === nodeId);
        if (!node) return;

        // Sync with plant configuration and update node based on type
        if (node.data.type === "feed") {
          const updatedParams = {
            ...state.plantConfiguration.feed_source.parameters,
            ...params,
          } as FeedSourceParams;
          state.plantConfiguration.feed_source.parameters = updatedParams;
          (node.data as FeedNodeData).parameters = updatedParams;
        } else if (node.data.type === "pump") {
          // Ensure transfer_pump exists in config
          if (!state.plantConfiguration.transfer_pump) {
             state.plantConfiguration.transfer_pump = { parameters: { head_m: 20, efficiency_pump: 0.7, efficiency_motor: 0.9 } };
          }
          const updatedParams = {
            ...state.plantConfiguration.transfer_pump.parameters,
            ...params,
          } as PumpParams;
          state.plantConfiguration.transfer_pump.parameters = updatedParams;
          (node.data as PumpNodeData).parameters = updatedParams;
        } else if (node.data.type === "polymer") {
          const updatedParams = {
            ...state.plantConfiguration.polymer_conditioner.parameters,
            ...params,
          } as PolymerConditionerParams;
          state.plantConfiguration.polymer_conditioner.parameters = updatedParams;
          (node.data as PolymerNodeData).parameters = updatedParams;
        } else if (node.data.type === "dewatering") {
          const updatedParams = {
            ...state.plantConfiguration.dewatering_unit.parameters,
            ...params,
          } as DewateringUnitParams;
          state.plantConfiguration.dewatering_unit.parameters = updatedParams;
          (node.data as DewateringNodeData).parameters = updatedParams;
        } else if (node.data.type === "clarifier") {
          // Clarifier nodes - update node data directly (not stored in plantConfiguration)
          const currentParams = (node.data as ClarifierNodeData).parameters;
          const updatedParams = {
            ...currentParams,
            ...params,
          } as ClarifierParams;
          (node.data as ClarifierNodeData).parameters = updatedParams;
        } else if (node.data.type === "thickener") {
          // Thickener nodes - update node data directly (not stored in plantConfiguration)
          const currentParams = (node.data as ThickenerNodeData).parameters;
          const updatedParams = {
            ...currentParams,
            ...params,
          } as ThickenerParams;
          (node.data as ThickenerNodeData).parameters = updatedParams;
        }

        // Clear simulation result when parameters change
        state.simulationResult = null;
      }),

    // Select a node
    selectNode: (nodeId) =>
      set((state) => {
        state.selectedNodeId = nodeId;
      }),

    // Set entire plant configuration
    setPlantConfiguration: (config) =>
      set((state) => {
        state.plantConfiguration = config;

        // Sync nodes with new configuration
        state.nodes.forEach((node: Node<EquipmentNodeData>) => {
          if (node.data.type === "feed") {
            (node.data as FeedNodeData).parameters = {
              ...config.feed_source.parameters,
            };
          } else if (node.data.type === "pump" && config.transfer_pump) {
            (node.data as PumpNodeData).parameters = {
              ...config.transfer_pump.parameters,
            };
          } else if (node.data.type === "polymer") {
            (node.data as PolymerNodeData).parameters = {
              ...config.polymer_conditioner.parameters,
            };
          } else if (node.data.type === "dewatering") {
            (node.data as DewateringNodeData).parameters = {
              ...config.dewatering_unit.parameters,
            };
          }
        });
      }),

    // Set simulation result
    setSimulationResult: (result) =>
      set((state) => {
        state.simulationResult = result;
        if (result) {
          // Parse warnings to detect node-specific issues
          const warnings = result.warnings || [];
          const hasDoseOutOfRange = warnings.some(
            (w) =>
              w.toLowerCase().includes("jar test acceptable range") ||
              w.toLowerCase().includes("very low effective dose") ||
              w.toLowerCase().includes("very high effective dose")
          );

          // Update stream data on nodes
          state.nodes.forEach((node: Node<EquipmentNodeData>) => {
            if (node.data.type === "feed") {
              (node.data as FeedNodeData).streamData = result.streams.feed;
            } else if (node.data.type === "pump") {
              (node.data as PumpNodeData).streamData = result.streams.pump_out || result.streams.feed;
              (node.data as PumpNodeData).powerKW = result.kpis.pump_power_kW;
            } else if (node.data.type === "polymer") {
              (node.data as PolymerNodeData).streamData = result.streams.conditioned;
              (node.data as PolymerNodeData).effectiveDose = result.kpis.polymer_dose_ppm;
              (node.data as PolymerNodeData).isDoseOutOfRange = hasDoseOutOfRange;
            } else if (node.data.type === "dewatering") {
              const dewateringData = node.data as DewateringNodeData;
              dewateringData.cakeStreamData = result.streams.cake;
              dewateringData.liquidStreamData = result.streams.liquid;
              // Check if over capacity
              const maxFlow = dewateringData.parameters.max_flow_m3_h;
              if (maxFlow) {
                dewateringData.isOverCapacity =
                  result.streams.conditioned.volumetric_flow_m3_h > maxFlow;
              }
            } else if (node.data.type === "clarifier") {
              const clarifierData = node.data as ClarifierNodeData;
              clarifierData.overflowStreamData = result.streams.clarifier_overflow;
              clarifierData.underflowStreamData = result.streams.clarifier_underflow;
            } else if (node.data.type === "thickener") {
              const thickenerData = node.data as ThickenerNodeData;
              thickenerData.thickenedStreamData = result.streams.thickened;
              thickenerData.supernatantStreamData = result.streams.supernatant;
            }
          });
        }
      }),

    // Set simulating state
    setIsSimulating: (value) =>
      set((state) => {
        state.isSimulating = value;
      }),

    // Set current project
    setCurrentProject: (project) =>
      set((state) => {
        state.currentProject = project;
      }),

    // Load a project into the canvas
    loadProject: (project) =>
      set((state) => {
        state.currentProject = project;
        state.plantConfiguration = project.plant_configuration;
        state.selectedJarTestId = project.jar_test_id || null;
        state.simulationResult = null;

        // Update nodes with project configuration
        state.nodes.forEach((node: Node<EquipmentNodeData>) => {
          if (node.data.type === "feed") {
            (node.data as FeedNodeData).parameters = {
              ...project.plant_configuration.feed_source.parameters,
            };
          } else if (node.data.type === "pump" && project.plant_configuration.transfer_pump) {
            (node.data as PumpNodeData).parameters = {
              ...project.plant_configuration.transfer_pump.parameters,
            };
          } else if (node.data.type === "polymer") {
            (node.data as PolymerNodeData).parameters = {
              ...project.plant_configuration.polymer_conditioner.parameters,
            };
          } else if (node.data.type === "dewatering") {
            (node.data as DewateringNodeData).parameters = {
              ...project.plant_configuration.dewatering_unit.parameters,
            };
          }
        });
      }),

    // Reset to default state
    resetToDefault: () =>
      set((state) => {
        state.nodes = createDefaultNodes();
        state.edges = createDefaultEdges();
        state.plantConfiguration = { ...DEFAULT_PLANT_CONFIG };
        state.currentProject = null;
        state.simulationResult = null;
        state.selectedNodeId = null;
        state.selectedJarTestId = null;
      }),

    // Set jar tests
    setJarTests: (tests) =>
      set((state) => {
        state.jarTests = tests;
      }),

    // Select a jar test
    selectJarTest: (id) =>
      set((state) => {
        state.selectedJarTestId = id;

        // If a jar test is selected, update the polymer dose
        if (id) {
          const jarTest = state.jarTests.find((jt: JarTest) => jt.id === id);
          if (jarTest) {
            // Update polymer conditioner with jar test optimum dose
            state.plantConfiguration.polymer_conditioner.parameters.jar_test_optimum_ppm =
              jarTest.analysis.optimum_dose_ppm;

            // Update the polymer node
            const polymerNode = state.nodes.find(
              (n: Node<EquipmentNodeData>) => n.data.type === "polymer"
            );
            if (polymerNode) {
              (polymerNode.data as PolymerNodeData).parameters.jar_test_optimum_ppm =
                jarTest.analysis.optimum_dose_ppm;
            }

            // Clear simulation result
            state.simulationResult = null;
          }
        }
      }),

    // Update stream data on nodes from simulation result
    updateStreamData: (result) =>
      set((state) => {
        state.nodes.forEach((node: Node<EquipmentNodeData>) => {
          if (node.data.type === "feed") {
            (node.data as FeedNodeData).streamData = result.streams.feed;
          } else if (node.data.type === "pump") {
            (node.data as PumpNodeData).streamData = result.streams.pump_out || result.streams.feed;
            (node.data as PumpNodeData).powerKW = result.kpis.pump_power_kW;
          } else if (node.data.type === "polymer") {
            (node.data as PolymerNodeData).streamData = result.streams.conditioned;
            (node.data as PolymerNodeData).effectiveDose = result.kpis.polymer_dose_ppm;
          } else if (node.data.type === "dewatering") {
            const dewateringData = node.data as DewateringNodeData;
            dewateringData.cakeStreamData = result.streams.cake;
            dewateringData.liquidStreamData = result.streams.liquid;
          } else if (node.data.type === "clarifier") {
            const clarifierData = node.data as ClarifierNodeData;
            clarifierData.overflowStreamData = result.streams.clarifier_overflow;
            clarifierData.underflowStreamData = result.streams.clarifier_underflow;
          } else if (node.data.type === "thickener") {
            const thickenerData = node.data as ThickenerNodeData;
            thickenerData.thickenedStreamData = result.streams.thickened;
            thickenerData.supernatantStreamData = result.streams.supernatant;
          }
        });
      }),

    // Validation actions
    setValidationErrors: (errors) =>
      set((state) => {
        state.validationErrors = errors;
      }),

    setValidationWarnings: (warnings) =>
      set((state) => {
        state.validationWarnings = warnings;
      }),

    setIsValidating: (value) =>
      set((state) => {
        state.isValidating = value;
      }),

    clearValidation: () =>
      set((state) => {
        state.validationErrors = [];
        state.validationWarnings = [];
      }),

    // Save current simulation to a specific slot (A or B)
    saveScenarioToSlot: (slot, name) =>
      set((state) => {
        if (state.simulationResult) {
          state.savedScenarios[slot] = {
            name,
            timestamp: Date.now(),
            settings: { ...state.plantConfiguration.settings },
            result: state.simulationResult,
          };
          // Only auto-switch to slot A when saving A (the baseline).
          // When saving B, keep comparing against A so user can see A vs B difference.
          if (slot === "A") {
            state.activeComparisonSlot = "A";
          }
          // If saving B and no baseline (A) exists yet, use B as baseline
          else if (slot === "B" && !state.savedScenarios.A) {
            state.activeComparisonSlot = "B";
          }
          // Otherwise, keep the current comparison baseline (typically A)
        }
      }),

    // Clear a specific scenario slot
    clearScenarioSlot: (slot) =>
      set((state) => {
        state.savedScenarios[slot] = null;
        // If we cleared the active slot, switch to the other if available
        if (state.activeComparisonSlot === slot) {
          const otherSlot = slot === "A" ? "B" : "A";
          if (state.savedScenarios[otherSlot]) {
            state.activeComparisonSlot = otherSlot;
          }
        }
      }),

    // Set which slot to compare current results against
    setActiveComparisonSlot: (slot) =>
      set((state) => {
        state.activeComparisonSlot = slot;
      }),

    // Swap the contents of slots A and B
    swapScenarioSlots: () =>
      set((state) => {
        const temp = state.savedScenarios.A;
        state.savedScenarios.A = state.savedScenarios.B;
        state.savedScenarios.B = temp;
      }),

    // Add a new node at the specified position
    addNode: (type, position) => {
      let newNodeId = "";
      set((state) => {
        // Generate unique ID based on type and count
        const existingCount = state.nodes.filter(
          (n: Node<EquipmentNodeData>) => n.data.type === type
        ).length;
        newNodeId = `${type}-${existingCount + 1}-${Date.now()}`;

        // Create default parameters based on type
        let data: EquipmentNodeData;
        switch (type) {
          case "feed":
            data = {
              type: "feed",
              label: "Feed Source",
              parameters: {
                flow_m3_h: 100.0,
                ts_percent: 3.0,
                temperature_C: 20.0,
              },
            } as FeedNodeData;
            break;
          case "pump":
            data = {
              type: "pump",
              label: "Transfer Pump",
              parameters: {
                head_m: 20.0,
                efficiency_pump: 0.7,
                efficiency_motor: 0.9,
              },
            } as PumpNodeData;
            break;
          case "polymer":
            data = {
              type: "polymer",
              label: "Polymer",
              parameters: {
                jar_test_optimum_ppm: 15.0,
                shear_factor: 1.2,
                safety_factor: 1.1,
              },
            } as PolymerNodeData;
            break;
          case "clarifier":
            data = {
              type: "clarifier",
              label: "Clarifier",
              parameters: {
                underflow_rate_m3_h: 10.0,
                capture_rate: 0.85,
              },
            } as ClarifierNodeData;
            break;
          case "thickener":
            data = {
              type: "thickener",
              label: "Thickener",
              parameters: {
                target_thickened_ts_percent: 5.0,
                capture_rate: 0.90,
              },
            } as ThickenerNodeData;
            break;
          case "dewatering":
            data = {
              type: "dewatering",
              label: "Dewatering",
              parameters: {
                max_flow_m3_h: 150.0,
                capture_rate: 0.95,
                cake_dryness_percent: 23.0,
                polymer_split_cake: 0.3,
              },
            } as DewateringNodeData;
            break;
          default:
            throw new Error(`Unknown equipment type: ${type}`);
        }

        const newNode: Node<EquipmentNodeData> = {
          id: newNodeId,
          type,
          position,
          measured: { width: 176, height: 120 },
          data,
        };

        state.nodes.push(newNode);
        state.simulationResult = null; // Clear simulation when topology changes
      });
      return newNodeId;
    },

    // Delete a node and its connected edges
    deleteNode: (nodeId) =>
      set((state) => {
        // Don't allow deleting the last node of certain types if needed
        const nodeToDelete = state.nodes.find(
          (n: Node<EquipmentNodeData>) => n.id === nodeId
        );
        if (!nodeToDelete) return;

        // Remove the node
        state.nodes = state.nodes.filter(
          (n: Node<EquipmentNodeData>) => n.id !== nodeId
        );

        // Remove all edges connected to this node
        state.edges = state.edges.filter(
          (e: Edge) => e.source !== nodeId && e.target !== nodeId
        );

        // Clear selection if deleted node was selected
        if (state.selectedNodeId === nodeId) {
          state.selectedNodeId = null;
        }

        // Clear simulation result when topology changes
        state.simulationResult = null;
      }),

    // Add a new edge between nodes
    addEdge: (sourceId, targetId, sourceHandle, targetHandle) =>
      set((state) => {
        // Check if edge already exists
        const exists = state.edges.some(
          (e: Edge) =>
            e.source === sourceId &&
            e.target === targetId &&
            e.sourceHandle === sourceHandle &&
            e.targetHandle === targetHandle
        );
        if (exists) return;

        const newEdge: Edge = {
          id: `${sourceId}-${sourceHandle}-${targetId}-${targetHandle}`,
          source: sourceId,
          target: targetId,
          sourceHandle,
          targetHandle,
          type: "stream",
        };

        state.edges.push(newEdge);
        state.simulationResult = null; // Clear simulation when topology changes
      }),

    // Set theme and persist to localStorage
    setTheme: (theme) =>
      set((state) => {
        state.theme = theme;
        localStorage.setItem("sludgesim-theme", theme);
        // Apply/remove dark class on document
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }),
  }))
);

// Selector hooks for common state slices
export const useTheme = () => useStore((state) => state.theme);
export const useNodes = () => useStore((state) => state.nodes);
export const useEdges = () => useStore((state) => state.edges);
export const useSelectedNodeId = () => useStore((state) => state.selectedNodeId);
export const usePlantConfiguration = () => useStore((state) => state.plantConfiguration);
export const useSimulationResult = () => useStore((state) => state.simulationResult);
export const useIsSimulating = () => useStore((state) => state.isSimulating);
export const useCurrentProject = () => useStore((state) => state.currentProject);
export const useJarTestsState = () => useStore((state) => state.jarTests);
export const useSelectedJarTestId = () => useStore((state) => state.selectedJarTestId);
export const useSavedScenarios = () => useStore((state) => state.savedScenarios);
export const useActiveComparisonSlot = () => useStore((state) => state.activeComparisonSlot);

// Validation selectors
export const useValidationErrors = () => useStore((state) => state.validationErrors);
export const useValidationWarnings = () => useStore((state) => state.validationWarnings);
export const useIsValidating = () => useStore((state) => state.isValidating);
export const useIsValid = () => useStore((state) => state.validationErrors.length === 0);

// Get errors for a specific path
export const useErrorsForPath = (path: string) =>
  useStore((state) =>
    state.validationErrors.filter(
      (e) => e.path === path || e.path.startsWith(path + ".")
    )
  );

// Get warnings for a specific path
export const useWarningsForPath = (path: string) =>
  useStore((state) =>
    state.validationWarnings.filter(
      (w) => w.path === path || w.path.startsWith(path + ".")
    )
  );

// Get the selected node data
export const useSelectedNode = () =>
  useStore((state) => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  });

// ============================================
// Graph API helpers
// ============================================

/**
 * Convert React Flow nodes to API GraphNode format.
 */
export function nodesToApiFormat(nodes: Node<EquipmentNodeData>[]): GraphNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.data.type as EquipmentType,
    data: {
      parameters: node.data.parameters,
    },
  }));
}

/**
 * Convert React Flow edges to API GraphEdge format.
 */
export function edgesToApiFormat(edges: Edge[]): GraphEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle || "output",
    target: edge.target,
    targetHandle: edge.targetHandle || "input",
  }));
}

/**
 * Hook to get nodes in API format.
 */
export const useNodesForApi = () =>
  useStore((state) => nodesToApiFormat(state.nodes));

/**
 * Hook to get edges in API format.
 */
export const useEdgesForApi = () =>
  useStore((state) => edgesToApiFormat(state.edges));
