/**
 * Main Zustand store for SludgeSim application state.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Node, Edge, NodeChange, EdgeChange } from "@xyflow/react";
import type {
  EquipmentNodeData,
  FeedNodeData,
  PolymerNodeData,
  DewateringNodeData,
  PlantConfiguration,
  Project,
  SimulationResult,
  JarTest,
  FeedSourceParams,
  PolymerConditionerParams,
  DewateringUnitParams,
} from "../types";

// Default plant configuration
const DEFAULT_PLANT_CONFIG: PlantConfiguration = {
  feed_source: {
    parameters: {
      flow_m3_h: 100.0,
      ts_percent: 3.0,
      temperature_C: 20.0,
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
    },
  },
  settings: {
    polymer_price_per_kg: 5.0,
    operating_hours_per_day: 24.0,
  },
};

// Default nodes for the canvas
const createDefaultNodes = (): Node<EquipmentNodeData>[] => [
  {
    id: "feed-1",
    type: "feed",
    position: { x: 100, y: 200 },
    data: {
      type: "feed",
      label: "Feed Source",
      parameters: { ...DEFAULT_PLANT_CONFIG.feed_source.parameters },
    } as FeedNodeData,
  },
  {
    id: "polymer-1",
    type: "polymer",
    position: { x: 400, y: 200 },
    data: {
      type: "polymer",
      label: "Polymer Conditioner",
      parameters: { ...DEFAULT_PLANT_CONFIG.polymer_conditioner.parameters },
    } as PolymerNodeData,
  },
  {
    id: "dewatering-1",
    type: "dewatering",
    position: { x: 700, y: 200 },
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
    id: "feed-to-polymer",
    source: "feed-1",
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

interface PlantState {
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

  // Jar tests
  jarTests: JarTest[];
  selectedJarTestId: string | null;

  // Actions
  initializeDefaultPlant: () => void;
  setNodes: (nodes: Node<EquipmentNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  updateNodeParameters: (
    nodeId: string,
    params: Partial<FeedSourceParams | PolymerConditionerParams | DewateringUnitParams>
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
}

export const useStore = create<PlantState>()(
  immer((set, _get) => ({
    // Initial state
    nodes: createDefaultNodes(),
    edges: createDefaultEdges(),
    selectedNodeId: null,
    plantConfiguration: { ...DEFAULT_PLANT_CONFIG },
    currentProject: null,
    simulationResult: null,
    isSimulating: false,
    jarTests: [],
    selectedJarTestId: null,

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

    // Handle React Flow node changes (position, selection, etc.)
    onNodesChange: (changes: NodeChange[]) =>
      set((state) => {
        changes.forEach((change: NodeChange) => {
          if (change.type === "position" && "position" in change && change.position) {
            const node = state.nodes.find((n: Node<EquipmentNodeData>) => n.id === change.id);
            if (node) {
              node.position = change.position;
            }
          }
          if (change.type === "select" && "selected" in change) {
            state.selectedNodeId = change.selected ? change.id : null;
          }
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
          // Update stream data on nodes
          state.nodes.forEach((node: Node<EquipmentNodeData>) => {
            if (node.data.type === "feed") {
              (node.data as FeedNodeData).streamData = result.streams.feed;
            } else if (node.data.type === "polymer") {
              (node.data as PolymerNodeData).streamData = result.streams.conditioned;
              (node.data as PolymerNodeData).effectiveDose = result.kpis.polymer_dose_ppm;
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
        state.selectedJarTestId = project.linked_jar_test_id || null;
        state.simulationResult = null;

        // Update nodes with project configuration
        state.nodes.forEach((node: Node<EquipmentNodeData>) => {
          if (node.data.type === "feed") {
            (node.data as FeedNodeData).parameters = {
              ...project.plant_configuration.feed_source.parameters,
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
          } else if (node.data.type === "polymer") {
            (node.data as PolymerNodeData).streamData = result.streams.conditioned;
            (node.data as PolymerNodeData).effectiveDose = result.kpis.polymer_dose_ppm;
          } else if (node.data.type === "dewatering") {
            const dewateringData = node.data as DewateringNodeData;
            dewateringData.cakeStreamData = result.streams.cake;
            dewateringData.liquidStreamData = result.streams.liquid;
          }
        });
      }),
  }))
);

// Selector hooks for common state slices
export const useNodes = () => useStore((state) => state.nodes);
export const useEdges = () => useStore((state) => state.edges);
export const useSelectedNodeId = () => useStore((state) => state.selectedNodeId);
export const usePlantConfiguration = () => useStore((state) => state.plantConfiguration);
export const useSimulationResult = () => useStore((state) => state.simulationResult);
export const useIsSimulating = () => useStore((state) => state.isSimulating);
export const useCurrentProject = () => useStore((state) => state.currentProject);
export const useJarTests = () => useStore((state) => state.jarTests);
export const useSelectedJarTestId = () => useStore((state) => state.selectedJarTestId);

// Get the selected node data
export const useSelectedNode = () =>
  useStore((state) => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find((n) => n.id === state.selectedNodeId) || null;
  });
