/**
 * Load Project Modal - allows loading a saved project or deleting projects.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Load Project</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              Error loading projects: {error.message}
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved projects yet.</p>
              <p className="text-sm mt-2">Save your current configuration to get started.</p>
            </div>
          )}

          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((project) => (
                <div
                  key={project.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    currentProject?.id === project.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {deleteConfirmId === project.id ? (
                    // Delete confirmation
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">
                          Delete "{project.name}"?
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={deleteProjectMutation.isPending}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
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
                          <h3 className="font-medium text-slate-800">
                            {project.name}
                          </h3>
                          {currentProject?.id === project.id && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-slate-500 mt-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>Updated: {formatDate(project.updated_at)}</span>
                          <span>
                            Flow: {project.plant_configuration.feed_source.parameters.flow_m3_h} m³/h
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirmId(project.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
