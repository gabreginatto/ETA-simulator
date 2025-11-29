/**
 * Profile presets for Wastewater and Drinking Water treatment plants.
 * Each profile defines default settings, nodes, and available equipment.
 */

import type { Node, Edge } from "@xyflow/react";
import type {
  PlantProfile,
  PlantSettings,
  EquipmentType,
  EquipmentNodeData,
} from "../types";

// Node position helpers
const NODE_SPACING_X = 250;
const NODE_SPACING_Y = 0;
const START_X = 100;
const START_Y = 200;

/**
 * Profile preset configuration
 */
export interface ProfilePreset {
  label: string;
  description: string;
  settings: PlantSettings;
  defaultNodes: Node<EquipmentNodeData>[];
  defaultEdges: Edge[];
  availableNodeTypes: EquipmentType[];
  primaryKpis: string[];
  secondaryKpis: string[];
}

/**
 * Wastewater treatment profile - sludge dewatering focus
 */
const WASTEWATER_PRESET: ProfilePreset = {
  label: "Wastewater",
  description: "Sludge dewatering and conditioning",
  settings: {
    plant_profile: "wastewater",
    polymer_price_per_kg: 5.0,
    electricity_price_per_kwh: 0.12,
    operating_hours_per_day: 24.0,
    currency: "BRL",
    water_cost_per_m3: 2.0,
    disposal_cost_per_ton_wet: 100.0,
    storage_cost_per_kg: 0.5,
    handling_cost_per_kg: 0.2,
  },
  defaultNodes: [
    {
      id: "feed-1",
      type: "feed",
      position: { x: START_X, y: START_Y },
      data: {
        type: "feed",
        label: "Feed",
        parameters: {
          flow_m3_h: 100.0,
          ts_percent: 3.0,
          temperature_C: 20.0,
        },
      },
    },
    {
      id: "pump-1",
      type: "pump",
      position: { x: START_X + NODE_SPACING_X, y: START_Y + NODE_SPACING_Y },
      data: {
        type: "pump",
        label: "Transfer Pump",
        parameters: {
          head_m: 20.0,
          efficiency_pump: 0.7,
          efficiency_motor: 0.9,
        },
      },
    },
    {
      id: "polymer-1",
      type: "polymer",
      position: { x: START_X + NODE_SPACING_X * 2, y: START_Y + NODE_SPACING_Y },
      data: {
        type: "polymer",
        label: "Polymer",
        parameters: {
          jar_test_optimum_ppm: 15.0,
          shear_factor: 1.2,
          safety_factor: 1.1,
        },
      },
    },
    {
      id: "dewatering-1",
      type: "dewatering",
      position: { x: START_X + NODE_SPACING_X * 3, y: START_Y + NODE_SPACING_Y },
      data: {
        type: "dewatering",
        label: "Dewatering",
        parameters: {
          max_flow_m3_h: 150.0,
          capture_rate: 0.95,
          cake_dryness_percent: 23.0,
          polymer_split_cake: 0.3,
        },
      },
    },
  ] as Node<EquipmentNodeData>[],
  defaultEdges: [
    { id: "e-feed-pump", source: "feed-1", target: "pump-1", sourceHandle: "output", targetHandle: "input" },
    { id: "e-pump-polymer", source: "pump-1", target: "polymer-1", sourceHandle: "output", targetHandle: "input" },
    { id: "e-polymer-dewatering", source: "polymer-1", target: "dewatering-1", sourceHandle: "output", targetHandle: "input" },
  ],
  availableNodeTypes: ["feed", "pump", "polymer", "clarifier", "thickener", "dewatering"],
  primaryKpis: ["polymer_dose_ppm", "cake_dryness_percent", "solids_capture_actual_percent"],
  secondaryKpis: ["polymer_kg_per_day", "cake_wet_tons_per_day", "liquid_tss_estimate_mg_L"],
};

/**
 * Drinking water treatment profile - WTP focus
 */
const DRINKING_WATER_PRESET: ProfilePreset = {
  label: "Drinking Water",
  description: "Water treatment plant (coagulation, filtration)",
  settings: {
    plant_profile: "drinking_water",
    coagulant_price_per_kg: 2.0,
    coagulant_dose_mg_L: 30.0,
    electricity_price_per_kwh: 0.12,
    operating_hours_per_day: 24.0,
    currency: "BRL",
    water_cost_per_m3: 1.5,
    product_price_per_m3: 3.0,
    filter_runtime_hours_to_clog: 24.0,
    filter_flow_m3_h: 50.0,
    filters_in_parallel: 4,
    backwash_volume_m3: 10.0,
    backwash_time_hours: 0.5,
    disposal_cost_per_ton_wet: 60.0,
    storage_cost_per_kg: 0.3,
    handling_cost_per_kg: 0.1,
  },
  defaultNodes: [
    {
      id: "feed-1",
      type: "feed",
      position: { x: START_X, y: START_Y },
      data: {
        type: "feed",
        label: "Raw Water Intake",
        parameters: {
          flow_m3_h: 500.0,
          ts_percent: 0.05,  // Low solids for raw water (~500 mg/L as NTU proxy)
          temperature_C: 20.0,
        },
      },
    },
    {
      id: "coagulant-1",
      type: "coagulant",
      position: { x: START_X + NODE_SPACING_X, y: START_Y },
      data: {
        type: "coagulant",
        label: "Coagulant",
        parameters: {
          dose_mg_L: 30.0,
          coagulant_type: "alum",
        },
      },
    },
    {
      id: "flocculator-1",
      type: "flocculator",
      position: { x: START_X + NODE_SPACING_X * 2, y: START_Y },
      data: {
        type: "flocculator",
        label: "Flocculator",
        parameters: {
          detention_time_min: 20.0,
          g_value: 50.0,
        },
      },
    },
    {
      id: "sedimentation-1",
      type: "sedimentation",
      position: { x: START_X + NODE_SPACING_X * 3, y: START_Y },
      data: {
        type: "sedimentation",
        label: "Sedimentation",
        parameters: {
          surface_loading_m3_m2_h: 2.5,
          capture_rate: 0.90,
        },
      },
    },
    {
      id: "filter-1",
      type: "filter",
      position: { x: START_X + NODE_SPACING_X * 4, y: START_Y },
      data: {
        type: "filter",
        label: "Rapid Filter",
        parameters: {
          media_type: "dual_media",
          run_length_h: 24.0,
          loading_rate_m3_m2_h: 10.0,
          capture_rate: 0.95,
        },
      },
    },
  ] as Node<EquipmentNodeData>[],
  defaultEdges: [
    { id: "e-feed-coag", source: "feed-1", target: "coagulant-1", sourceHandle: "output", targetHandle: "input" },
    { id: "e-coag-floc", source: "coagulant-1", target: "flocculator-1", sourceHandle: "output", targetHandle: "input" },
    { id: "e-floc-sed", source: "flocculator-1", target: "sedimentation-1", sourceHandle: "output", targetHandle: "input" },
    { id: "e-sed-filter", source: "sedimentation-1", target: "filter-1", sourceHandle: "clarified", targetHandle: "input" },
  ],
  availableNodeTypes: [
    "feed", "pump", "coagulant", "flocculator", "sedimentation", "daf",
    "filter", "clearwell", "clarifier", "thickener", "dewatering"
  ],
  primaryKpis: ["finished_water_flow_m3_h", "filter_washes_per_day", "coagulant_kg_per_day"],
  secondaryKpis: ["residuals_mass_kg_h", "finished_water_turbidity_ntu"],
};

/**
 * All profile presets indexed by profile type
 */
export const PROFILE_PRESETS: Record<PlantProfile, ProfilePreset> = {
  wastewater: WASTEWATER_PRESET,
  drinking_water: DRINKING_WATER_PRESET,
};

/**
 * Get the preset for a given profile
 */
export function getProfilePreset(profile: PlantProfile): ProfilePreset {
  return PROFILE_PRESETS[profile];
}

/**
 * Get available node types for a profile
 */
export function getAvailableNodeTypes(profile: PlantProfile): EquipmentType[] {
  return PROFILE_PRESETS[profile].availableNodeTypes;
}

/**
 * Check if a node type is available for a profile
 */
export function isNodeTypeAvailable(profile: PlantProfile, nodeType: EquipmentType): boolean {
  return PROFILE_PRESETS[profile].availableNodeTypes.includes(nodeType);
}

/**
 * Get default nodes for a profile
 */
export function getDefaultNodes(profile: PlantProfile): Node<EquipmentNodeData>[] {
  return PROFILE_PRESETS[profile].defaultNodes;
}

/**
 * Get default edges for a profile
 */
export function getDefaultEdges(profile: PlantProfile): Edge[] {
  return PROFILE_PRESETS[profile].defaultEdges;
}

/**
 * Get default settings for a profile
 */
export function getDefaultSettings(profile: PlantProfile): PlantSettings {
  return PROFILE_PRESETS[profile].settings;
}
