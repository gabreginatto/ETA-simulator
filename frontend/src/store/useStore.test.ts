/**
 * Tests for Zustand store state management.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "./useStore";
import type { PlantConfiguration, FeedNodeData } from "../types";
import type { ValidationError } from "../api/client";

describe("useStore", () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useStore.getState().resetToDefault();
  });

  describe("initializeDefaultPlant", () => {
    it("creates default nodes", () => {
      const state = useStore.getState();
      expect(state.nodes).toHaveLength(4);
      expect(state.nodes.map((n) => n.data.type)).toEqual([
        "feed",
        "pump",
        "polymer",
        "dewatering",
      ]);
    });

    it("creates default edges", () => {
      const state = useStore.getState();
      expect(state.edges).toHaveLength(3);
    });

    it("has default plant configuration", () => {
      const state = useStore.getState();
      expect(state.plantConfiguration.feed_source.parameters.flow_m3_h).toBe(
        100.0
      );
      expect(state.plantConfiguration.feed_source.parameters.ts_percent).toBe(
        3.0
      );
    });
  });

  describe("updateNodeParameters", () => {
    it("updates feed node parameters", () => {
      const state = useStore.getState();
      const feedNode = state.nodes.find((n) => n.data.type === "feed");
      expect(feedNode).toBeDefined();

      useStore.getState().updateNodeParameters(feedNode!.id, {
        flow_m3_h: 200.0,
      });

      const updatedState = useStore.getState();
      expect(
        updatedState.plantConfiguration.feed_source.parameters.flow_m3_h
      ).toBe(200.0);
      // Check node is also updated
      const updatedFeedNode = updatedState.nodes.find((n) => n.data.type === "feed");
      expect((updatedFeedNode?.data as FeedNodeData).parameters.flow_m3_h).toBe(200.0);
    });

    it("clears simulation result when parameters change", () => {
      // Set a mock simulation result with all required stream data
      const mockStreamData = {
        id: "test",
        mass_flow_kg_h: 100000,
        dry_solids_mass_flow_kg_h: 3000,
        polymer_mass_flow_kg_h: 2,
        temperature_C: 20,
        dry_solids_fraction: 0.03,
        dry_solids_percent: 3,
        density_kg_m3: 1000,
        volumetric_flow_m3_h: 100,
        polymer_dose_ppm: 20,
        water_mass_flow_kg_h: 97000,
      };

      useStore.getState().setSimulationResult({
        success: true,
        streams: {
          feed: mockStreamData,
          conditioned: mockStreamData,
          cake: mockStreamData,
          liquid: mockStreamData,
        },
        kpis: {
          polymer_dose_ppm: 20,
          polymer_kg_per_tDS: 6.6,
          polymer_kg_per_h: 2,
          polymer_kg_per_day: 48,
          polymer_kg_per_month: 1440,
          cake_dryness_percent: 23,
          cake_mass_kg_per_h: 12391,
          cake_wet_tons_per_day: 297,
          cake_tDS_per_day: 68.4,
          liquid_flow_m3_h: 87.6,
          liquid_tss_estimate_mg_L: 1714,
          mass_balance_closure_percent: 100,
          solids_capture_actual_percent: 95,
        },
        warnings: [],
        errors: [],
      });

      expect(useStore.getState().simulationResult).not.toBeNull();

      // Update parameters
      const feedNode = useStore.getState().nodes.find((n) => n.data.type === "feed");
      useStore.getState().updateNodeParameters(feedNode!.id, {
        flow_m3_h: 150.0,
      });

      // Simulation result should be cleared
      expect(useStore.getState().simulationResult).toBeNull();
    });
  });

  describe("selectNode", () => {
    it("selects a node by ID", () => {
      const state = useStore.getState();
      const feedNode = state.nodes.find((n) => n.data.type === "feed");

      useStore.getState().selectNode(feedNode!.id);

      expect(useStore.getState().selectedNodeId).toBe(feedNode!.id);
    });

    it("deselects when passed null", () => {
      const state = useStore.getState();
      const feedNode = state.nodes.find((n) => n.data.type === "feed");

      useStore.getState().selectNode(feedNode!.id);
      useStore.getState().selectNode(null);

      expect(useStore.getState().selectedNodeId).toBeNull();
    });
  });

  describe("setPlantConfiguration", () => {
    it("updates plant configuration and syncs nodes", () => {
      const newConfig: PlantConfiguration = {
        feed_source: {
          parameters: {
            flow_m3_h: 250.0,
            ts_percent: 4.5,
            temperature_C: 25.0,
          },
        },
        polymer_conditioner: {
          parameters: {
            jar_test_optimum_ppm: 20.0,
            shear_factor: 1.3,
            safety_factor: 1.2,
          },
        },
        dewatering_unit: {
          parameters: {
            max_flow_m3_h: 300.0,
            capture_rate: 0.97,
            cake_dryness_percent: 25.0,
          },
        },
        settings: {
          polymer_price_per_kg: 7.5,
          operating_hours_per_day: 20,
          currency: "BRL",
        },
      };

      useStore.getState().setPlantConfiguration(newConfig);

      const state = useStore.getState();
      expect(state.plantConfiguration.feed_source.parameters.flow_m3_h).toBe(
        250.0
      );

      // Check that nodes are synced
      const feedNode = state.nodes.find((n) => n.data.type === "feed");
      expect((feedNode?.data as FeedNodeData).parameters.flow_m3_h).toBe(250.0);
    });
  });

  describe("resetToDefault", () => {
    it("resets all state to defaults", () => {
      // Modify state
      useStore.getState().updateNodeParameters("feed-1", { flow_m3_h: 500.0 });
      useStore.getState().selectNode("feed-1");
      useStore.getState().setCurrentProject({
        id: "test",
        name: "Test Project",
        plant_configuration: useStore.getState().plantConfiguration,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Reset
      useStore.getState().resetToDefault();

      const state = useStore.getState();
      expect(state.selectedNodeId).toBeNull();
      expect(state.currentProject).toBeNull();
      expect(state.plantConfiguration.feed_source.parameters.flow_m3_h).toBe(
        100.0
      );
    });
  });

  describe("validation state", () => {
    it("sets validation errors", () => {
      const errors: ValidationError[] = [
        { path: "feed_source.parameters.flow_m3_h", message: "Must be > 0", severity: "error" },
      ];

      useStore.getState().setValidationErrors(errors);

      expect(useStore.getState().validationErrors).toHaveLength(1);
      expect(useStore.getState().validationErrors[0].path).toBe(
        "feed_source.parameters.flow_m3_h"
      );
    });

    it("sets validation warnings", () => {
      const warnings: ValidationError[] = [
        { path: "feed_source.parameters.flow_m3_h", message: "High flow", severity: "warning" },
      ];

      useStore.getState().setValidationWarnings(warnings);

      expect(useStore.getState().validationWarnings).toHaveLength(1);
    });

    it("clears validation state", () => {
      useStore.getState().setValidationErrors([
        { path: "test", message: "error", severity: "error" },
      ]);
      useStore.getState().setValidationWarnings([
        { path: "test", message: "warning", severity: "warning" },
      ]);

      useStore.getState().clearValidation();

      expect(useStore.getState().validationErrors).toHaveLength(0);
      expect(useStore.getState().validationWarnings).toHaveLength(0);
    });
  });

  describe("jar test selection", () => {
    it("selects jar test and updates polymer dose", () => {
      // Set up jar tests
      useStore.getState().setJarTests([
        {
          id: "JT-001",
          date: "2024-01-01",
          sample: { source: "Test", initial_ts_percent: 3.0 },
          polymer: { name: "PAM-855", type: "cationic" },
          doses: [],
          analysis: { optimum_dose_ppm: 18.0 },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      useStore.getState().selectJarTest("JT-001");

      const state = useStore.getState();
      expect(state.selectedJarTestId).toBe("JT-001");
      expect(
        state.plantConfiguration.polymer_conditioner.parameters
          .jar_test_optimum_ppm
      ).toBe(18.0);
    });
  });
});
