/**
 * Save Project Modal - allows saving current configuration as a new or existing project.
 * Dark glass morphism design.
 */
import { useState, useEffect, useCallback } from "react";
import { X, Save } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useCreateProject, useSaveProject } from "../../hooks/useProject";

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveProjectModal({ isOpen, onClose, onSaved }: SaveProjectModalProps) {
  const currentProject = useStore((state) => state.currentProject);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  const createMutation = useCreateProject();
  const { save, isSaving: isSavingExisting, canSave } = useSaveProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saveMode, setSaveMode] = useState<"new" | "update">("new");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentProject) {
        setName(currentProject.name);
        setDescription(currentProject.description || "");
        setSaveMode("update");
      } else {
        setName("");
        setDescription("");
        setSaveMode("new");
      }
    }
  }, [isOpen, currentProject]);

  const handleSaveSuccess = useCallback(() => {
    onSaved?.();
    onClose();
  }, [onSaved, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (saveMode === "update" && canSave) {
      save();
      handleSaveSuccess();
    } else if (saveMode === "new" && name.trim()) {
      createMutation.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          plant_configuration: plantConfiguration,
          jar_test_id: selectedJarTestId || undefined,
        },
        {
          onSuccess: handleSaveSuccess,
        }
      );
    }
  };

  const isSavingNew = createMutation.isPending;
  const isSaving = isSavingNew || isSavingExisting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl shadow-float w-full max-w-md p-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-content-primary">Save Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-content-subtle hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save mode selection (only if existing project) */}
        {currentProject && (
          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                value="update"
                checked={saveMode === "update"}
                onChange={() => setSaveMode("update")}
                className="text-primary-500 focus:ring-primary-500 bg-surface-elevated border-glass-border"
              />
              <span className="text-sm text-content-secondary">
                Update "{currentProject.name}"
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="saveMode"
                value="new"
                checked={saveMode === "new"}
                onChange={() => setSaveMode("new")}
                className="text-primary-500 focus:ring-primary-500 bg-surface-elevated border-glass-border"
              />
              <span className="text-sm text-content-secondary">Save as new</span>
            </label>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {(saveMode === "new" || !currentProject) && (
            <>
              <div className="mb-4">
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold text-content-subtle uppercase tracking-wider mb-1"
                >
                  Project Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 bg-surface-elevated border border-glass-border rounded-lg text-content-primary placeholder-content-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                  required
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold text-content-subtle uppercase tracking-wider mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-elevated border border-glass-border rounded-lg text-content-primary placeholder-content-subtle focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
                />
              </div>
            </>
          )}

          {saveMode === "update" && currentProject && (
            <p className="mb-6 text-sm text-content-secondary">
              This will update the existing project with your current
              configuration.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-highlight rounded-lg transition-colors"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (saveMode === "new" && !name.trim())}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
