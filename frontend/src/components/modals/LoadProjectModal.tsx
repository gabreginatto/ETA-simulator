/**
 * Load Project Modal - allows loading a saved project or deleting projects.
 * Dark glass morphism design.
 */
import { useState } from "react";
import { X, FolderOpen, Trash2, AlertTriangle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useProjects, useDeleteProject } from "../../hooks/useProject";
import type { Project } from "../../types";

interface LoadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoaded?: () => void;
}

export function LoadProjectModal({ isOpen, onClose, onLoaded }: LoadProjectModalProps) {
  const loadProject = useStore((state) => state.loadProject);
  const currentProject = useStore((state) => state.currentProject);
  const { data, isLoading, error } = useProjects();
  const deleteProjectMutation = useDeleteProject();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoad = (project: Project) => {
    loadProject(project);
    onLoaded?.();
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteProjectMutation.mutate(id, {
      onSuccess: () => {
        setDeleteConfirmId(null);
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl shadow-float w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="text-lg font-semibold text-content-primary">Load Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-content-subtle hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-status-error">
              Error loading projects: {error.message}
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="text-center py-12 text-content-subtle">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-content-secondary">No saved projects yet.</p>
              <p className="text-sm mt-2">Save your current configuration to get started.</p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((project) => (
                <div
                  key={project.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    currentProject?.id === project.id
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-glass-border bg-surface-elevated hover:border-content-subtle"
                  }`}
                >
                  {deleteConfirmId === project.id ? (
                    // Delete confirmation
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-status-warning">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Delete "{project.name}"?
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 text-sm text-content-secondary hover:bg-surface-highlight rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deleteProjectMutation.isPending}
                          className="px-3 py-1 text-sm bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Project info
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleLoad(project)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-content-primary">
                            {project.name}
                          </h3>
                          {currentProject?.id === project.id && (
                            <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-content-secondary mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-content-subtle font-mono">
                          <span>Updated: {formatDate(project.updated_at)}</span>
                          <span>
                            Flow: {project.plant_configuration.feed_source.parameters.flow_m3_h} m³/h
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirmId(project.id)}
                        className="p-2 text-content-subtle hover:text-status-error transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-glass-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-highlight rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
