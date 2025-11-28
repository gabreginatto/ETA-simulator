/**
 * Tests for the SimulateButton component.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders, resetStore } from "../test/utils";
import { SimulateButton } from "../components/SimulateButton";
import { useStore } from "../store/useStore";

// Mock the useSimulation hook
vi.mock("../hooks/useSimulation", () => ({
  useSimulation: vi.fn(() => ({
    runSimulation: vi.fn(),
    isSimulating: false,
    error: null,
    result: null,
  })),
}));

// Mock the useToast hook
vi.mock("../hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("SimulateButton", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("renders simulate button with default state", () => {
    renderWithProviders(<SimulateButton />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("shows 'Simulate' text when no errors or warnings", () => {
    renderWithProviders(<SimulateButton />);

    expect(screen.getByText("Simulate")).toBeInTheDocument();
  });

  it("shows 'Fix Errors' when validation errors exist", () => {
    // Set validation errors in store
    useStore.getState().setValidationErrors([
      { path: "feed_source.parameters.flow_m3_h", message: "Invalid flow", severity: "error" },
    ]);

    renderWithProviders(<SimulateButton />);

    expect(screen.getByText("Fix Errors")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows amber button when only validation warnings exist", () => {
    // Clear any errors first
    useStore.getState().setValidationErrors([]);
    // Set validation warnings in store
    useStore.getState().setValidationWarnings([
      { path: "feed_source.parameters.flow_m3_h", message: "High flow", severity: "warning" },
    ]);

    renderWithProviders(<SimulateButton />);

    const button = screen.getByRole("button");
    // Button should have amber background class
    expect(button.className).toContain("amber");
  });

  it("shows confirmation dialog when clicking button with warnings", async () => {
    // Clear errors and set only warnings
    useStore.getState().setValidationErrors([]);
    useStore.getState().setValidationWarnings([
      { path: "test", message: "Test warning", severity: "warning" },
    ]);

    renderWithProviders(<SimulateButton />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Run with 1 warning/i)).toBeInTheDocument();
    });
  });

  it("displays warning count badge from simulation result", () => {
    // Clear any validation state
    useStore.getState().clearValidation();

    // Set a simulation result with warnings
    useStore.getState().setSimulationResult({
      success: true,
      streams: {
        feed: createMockStreamData(),
        conditioned: createMockStreamData(),
        cake: createMockStreamData(),
        liquid: createMockStreamData(),
      },
      kpis: createMockKPIs(),
      warnings: ["Warning 1", "Warning 2", "Warning 3"],
      errors: [],
    });

    renderWithProviders(<SimulateButton />);

    // Should show warning count badge
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has correct keyboard shortcut title", () => {
    renderWithProviders(<SimulateButton />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Run simulation (Ctrl+Enter)");
  });
});

// Helper functions to create mock data
function createMockStreamData() {
  return {
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
}

function createMockKPIs() {
  return {
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
  };
}
