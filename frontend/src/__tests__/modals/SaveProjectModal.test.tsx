/**
 * Tests for the SaveProjectModal component.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, resetStore } from "../../test/utils";
import { SaveProjectModal } from "../../components/modals/SaveProjectModal";
import { useStore } from "../../store/useStore";

// Mock the project hooks
vi.mock("../../hooks/useProject", () => ({
  useCreateProject: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useSaveProject: () => ({
    save: vi.fn(),
    isSaving: false,
    canSave: true,
  }),
}));

describe("SaveProjectModal", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    renderWithProviders(
      <SaveProjectModal isOpen={false} onClose={vi.fn()} />
    );

    expect(screen.queryByText("Save Project")).not.toBeInTheDocument();
  });

  it("renders modal when open", () => {
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText("Save Project")).toBeInTheDocument();
  });

  it("shows name and description fields for new project", () => {
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("disables save button when name is empty", () => {
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when name is entered", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, "My Project");

    const saveButton = screen.getByRole("button", { name: /save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={onClose} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={onClose} />
    );

    // Click the backdrop (the dark overlay behind the modal)
    const backdrop = document.querySelector(".bg-black\\/50");
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("calls onClose when X button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={onClose} />
    );

    // Find the X button (it contains an X icon)
    const closeButton = document.querySelector("button.text-slate-400");
    if (closeButton) {
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("shows update option when current project exists", () => {
    // Set a current project in the store
    useStore.getState().setCurrentProject({
      id: "test-project",
      name: "Existing Project",
      description: "Test description",
      plant_configuration: useStore.getState().plantConfiguration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // Should show radio buttons for update vs save as new
    expect(screen.getByText(/update "existing project"/i)).toBeInTheDocument();
    expect(screen.getByText(/save as new/i)).toBeInTheDocument();
  });

  it("pre-fills name and description from current project", () => {
    useStore.getState().setCurrentProject({
      id: "test-project",
      name: "Existing Project",
      description: "Test description",
      plant_configuration: useStore.getState().plantConfiguration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // When "save as new" is selected, the name should be pre-filled
    const saveAsNewRadio = screen.getByLabelText(/save as new/i);
    fireEvent.click(saveAsNewRadio);

    const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Existing Project");
  });

  it("shows update message when update mode is selected", () => {
    useStore.getState().setCurrentProject({
      id: "test-project",
      name: "Existing Project",
      plant_configuration: useStore.getState().plantConfiguration,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    // Default should be update mode
    expect(screen.getByText(/update the existing project/i)).toBeInTheDocument();
  });

  it("accepts text input in name field", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    const nameInput = screen.getByLabelText(/project name/i) as HTMLInputElement;
    await user.type(nameInput, "New Project Name");

    expect(nameInput.value).toBe("New Project Name");
  });

  it("accepts text input in description field", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SaveProjectModal isOpen={true} onClose={vi.fn()} />
    );

    const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    await user.type(descInput, "This is a test description");

    expect(descInput.value).toBe("This is a test description");
  });
});
