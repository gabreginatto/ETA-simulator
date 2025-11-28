/**
 * Tests for the FeedForm component.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, resetStore, getStoreState } from "../../test/utils";
import { FeedForm } from "../../components/forms/FeedForm";

describe("FeedForm", () => {
  beforeEach(() => {
    resetStore();
  });

  const defaultProps = {
    nodeId: "feed-1",
    parameters: {
      flow_m3_h: 100,
      ts_percent: 3.0,
      temperature_C: 20,
    },
  };

  it("renders all form fields", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    expect(screen.getByText("Flow Rate")).toBeInTheDocument();
    expect(screen.getByText("Total Solids (TS)")).toBeInTheDocument();
    expect(screen.getByText("Temperature")).toBeInTheDocument();
  });

  it("displays initial values correctly", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    // Get all number inputs
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(3);

    // Flow rate input (first)
    expect(inputs[0]).toHaveValue(100);
    // TS percent input (second)
    expect(inputs[1]).toHaveValue(3);
    // Temperature input (third)
    expect(inputs[2]).toHaveValue(20);
  });

  it("shows unit labels", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    expect(screen.getByText("m³/h")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("°C")).toBeInTheDocument();
  });

  it("shows calculated values section", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    expect(screen.getByText("Calculated")).toBeInTheDocument();
    expect(screen.getByText("Mass Flow:")).toBeInTheDocument();
    expect(screen.getByText("Dry Solids:")).toBeInTheDocument();
  });

  it("calculates mass flow correctly", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    // Mass flow = 100 m³/h * 1000 kg/m³ = 100,000 kg/h
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
  });

  it("calculates dry solids correctly", () => {
    renderWithProviders(<FeedForm {...defaultProps} />);

    // Dry solids = 100 * 1000 * 3 / 100 = 3,000 kg/h
    expect(screen.getByText(/3,000/)).toBeInTheDocument();
  });

  it("updates flow rate input on change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedForm {...defaultProps} />);

    const inputs = screen.getAllByRole("spinbutton");
    const flowInput = inputs[0];

    await user.clear(flowInput);
    await user.type(flowInput, "200");

    expect(flowInput).toHaveValue(200);
  });

  it("shows error message for negative flow rate", async () => {
    renderWithProviders(
      <FeedForm
        nodeId="feed-1"
        parameters={{
          flow_m3_h: -50,
          ts_percent: 3.0,
          temperature_C: 20,
        }}
      />
    );

    expect(screen.getByText(/flow rate must be positive/i)).toBeInTheDocument();
  });

  it("shows error message for invalid TS percentage", async () => {
    renderWithProviders(
      <FeedForm
        nodeId="feed-1"
        parameters={{
          flow_m3_h: 100,
          ts_percent: 150, // Invalid > 100%
          temperature_C: 20,
        }}
      />
    );

    expect(screen.getByText(/TS must be between 0 and 100%/i)).toBeInTheDocument();
  });

  it("updates store on parameter change (debounced)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedForm {...defaultProps} />);

    const inputs = screen.getAllByRole("spinbutton");
    const flowInput = inputs[0];

    await user.clear(flowInput);
    await user.type(flowInput, "250");

    // Wait for debounce (300ms in component + buffer)
    await waitFor(
      () => {
        const state = getStoreState();
        expect(state.plantConfiguration.feed_source.parameters.flow_m3_h).toBe(250);
      },
      { timeout: 500 }
    );
  });

  it("syncs local state when props change", async () => {
    const { rerender } = renderWithProviders(<FeedForm {...defaultProps} />);

    let inputs = screen.getAllByRole("spinbutton");
    expect(inputs[0]).toHaveValue(100);

    // Rerender with new props
    rerender(
      <FeedForm
        nodeId="feed-1"
        parameters={{
          flow_m3_h: 300,
          ts_percent: 4.0,
          temperature_C: 25,
        }}
      />
    );

    // Input should update to new value
    await waitFor(() => {
      inputs = screen.getAllByRole("spinbutton");
      expect(inputs[0]).toHaveValue(300);
    });
  });
});
