/**
 * TypeScript type definitions for SludgeSim frontend.
 * Mirrors backend Pydantic models.
 */

// Stream data as returned from simulation
export interface StreamData {
  id: string;
  mass_flow_kg_h: number;
  dry_solids_mass_flow_kg_h: number;
  polymer_mass_flow_kg_h: number;
  temperature_C: number;
  dry_solids_fraction: number;
  dry_solids_percent: number;
  density_kg_m3: number;
  volumetric_flow_m3_h: number;
  polymer_dose_ppm: number;
  water_mass_flow_kg_h: number;
}

// Equipment parameter interfaces
export interface FeedSourceParams {
  flow_m3_h: number;
  ts_percent: number;
  temperature_C?: number;
}

export interface PolymerConditionerParams {
  jar_test_optimum_ppm: number;
  shear_factor: number;
  safety_factor: number;
}

export interface DewateringUnitParams {
  max_flow_m3_h?: number;
  capture_rate: number;
  cake_dryness_percent: number;
  polymer_split_cake?: number;
}

export interface PlantSettings {
  polymer_price_per_kg?: number;
  operating_hours_per_day?: number;
  currency?: string;
}

// Plant configuration structure
export interface PlantConfiguration {
  feed_source: {
    parameters: FeedSourceParams;
  };
  polymer_conditioner: {
    parameters: PolymerConditionerParams;
  };
  dewatering_unit: {
    parameters: DewateringUnitParams;
  };
  settings: PlantSettings;
}

// KPIs from simulation
export interface KPIs {
  // Polymer metrics
  polymer_dose_ppm: number;
  polymer_kg_per_tDS: number;
  polymer_kg_per_h: number;
  polymer_kg_per_day: number;
  polymer_kg_per_month: number;

  // Cake metrics
  cake_dryness_percent: number;
  cake_mass_kg_per_h: number;
  cake_wet_tons_per_day: number;
  cake_tDS_per_day: number;

  // Liquid metrics
  liquid_flow_m3_h: number;
  liquid_tss_estimate_mg_L: number;

  // Mass balance
  mass_balance_closure_percent: number;
  solids_capture_actual_percent: number;

  // Cost metrics (optional)
  polymer_cost_per_day?: number;
  polymer_cost_per_month?: number;
  polymer_cost_per_year?: number;
  polymer_cost_per_tDS?: number;
}

// Simulation result
export interface SimulationResult {
  success: boolean;
  streams: {
    feed: StreamData;
    conditioned: StreamData;
    cake: StreamData;
    liquid: StreamData;
  };
  kpis: KPIs;
  warnings: string[];
  errors: string[];
}

// Jar test types
export interface JarTestDose {
  dose_ppm: number;
  supernatant_tss_mg_L?: number;
  cst_s?: number;
  floc_score?: number;
}

export interface JarTestSample {
  source: string;
  initial_ts_percent: number;
}

export interface JarTestPolymer {
  name: string;
  type: "cationic" | "anionic" | "nonionic";
}

export interface JarTestAnalysis {
  optimum_dose_ppm: number;
  acceptable_range_min_ppm?: number;
  acceptable_range_max_ppm?: number;
}

export interface JarTest {
  id: string;
  date: string;
  sample: JarTestSample;
  polymer: JarTestPolymer;
  doses: JarTestDose[];
  analysis: JarTestAnalysis;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  plant_configuration: PlantConfiguration;
  jar_test_id?: string;
  created_at: string;
  updated_at: string;
}

// React Flow node data types
export type EquipmentType = "feed" | "polymer" | "dewatering";

export interface BaseNodeData {
  type: EquipmentType;
  label: string;
  [key: string]: unknown;
}

export interface FeedNodeData extends BaseNodeData {
  type: "feed";
  parameters: FeedSourceParams;
  streamData?: StreamData;
}

export interface PolymerNodeData extends BaseNodeData {
  type: "polymer";
  parameters: PolymerConditionerParams;
  streamData?: StreamData;
  effectiveDose?: number;
  isDoseOutOfRange?: boolean;
}

export interface DewateringNodeData extends BaseNodeData {
  type: "dewatering";
  parameters: DewateringUnitParams;
  cakeStreamData?: StreamData;
  liquidStreamData?: StreamData;
  isOverCapacity?: boolean;
}

export type EquipmentNodeData =
  | FeedNodeData
  | PolymerNodeData
  | DewateringNodeData;

// ============================================
// Graph types for connection validation
// ============================================

export type PortType = "sludge" | "cake" | "liquid" | "polymer";
export type PortDirection = "input" | "output";

export interface Port {
  id: string;
  portType: PortType;
  direction: PortDirection;
  label?: string;
}

export interface EquipmentPorts {
  inputs: Port[];
  outputs: Port[];
}

// Standard port definitions for equipment types
export const EQUIPMENT_PORTS: Record<EquipmentType, EquipmentPorts> = {
  feed: {
    inputs: [],
    outputs: [{ id: "output", portType: "sludge", direction: "output", label: "Sludge Out" }],
  },
  polymer: {
    inputs: [{ id: "input", portType: "sludge", direction: "input", label: "Sludge In" }],
    outputs: [{ id: "output", portType: "sludge", direction: "output", label: "Conditioned Out" }],
  },
  dewatering: {
    inputs: [{ id: "input", portType: "sludge", direction: "input", label: "Sludge In" }],
    outputs: [
      { id: "cake", portType: "cake", direction: "output", label: "Cake Out" },
      { id: "liquid", portType: "liquid", direction: "output", label: "Centrate Out" },
    ],
  },
};

// Port compatibility: source port type -> compatible target port types
export const PORT_COMPATIBILITY: Record<PortType, PortType[]> = {
  sludge: ["sludge"],
  cake: [],
  liquid: ["sludge"], // Liquid can recycle to sludge input
  polymer: [],
};

/**
 * Check if a connection between two port types is valid.
 */
export function isConnectionValid(
  sourcePortType: PortType,
  targetPortType: PortType
): boolean {
  const compatible = PORT_COMPATIBILITY[sourcePortType] || [];
  return compatible.includes(targetPortType);
}

/**
 * Get port type for a given equipment and handle.
 */
export function getPortType(
  equipmentType: EquipmentType,
  handleId: string,
  direction: PortDirection
): PortType | null {
  const ports = EQUIPMENT_PORTS[equipmentType];
  if (!ports) return null;

  const portList = direction === "input" ? ports.inputs : ports.outputs;
  const port = portList.find((p) => p.id === handleId);
  return port?.portType || null;
}

// ============================================
// API request/response types
// ============================================

export interface SimulateRequest {
  plant_definition: PlantConfiguration;
  jar_test_id?: string;
  jar_test_optimum_ppm?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  plant_configuration: PlantConfiguration;
  jar_test_id?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  plant_configuration?: PlantConfiguration;
  jar_test_id?: string;
}

export interface CreateJarTestRequest {
  date: string;
  sample: JarTestSample;
  polymer: JarTestPolymer;
  doses: JarTestDose[];
  analysis: JarTestAnalysis;
  notes?: string;
}
