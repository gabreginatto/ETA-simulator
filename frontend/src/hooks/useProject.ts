/**
 * Custom hooks for project CRUD operations.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../api/client";
import { useStore } from "../store/useStore";
import type { CreateProjectRequest, UpdateProjectRequest, Project } from "../types";

// Query keys
const PROJECTS_KEY = ["projects"];

// List all projects
export function useProjects(skip?: number, limit?: number) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, { skip, limit }],
    queryFn: () => getProjects(skip, limit),
  });
}

// Get single project
export function useProject(id: string | null) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    queryFn: () => getProject(id!),
    enabled: !!id,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  const setCurrentProject = useStore((state) => state.setCurrentProject);

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => createProject(data),
    onSuccess: (project) => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      // Set as current project
      setCurrentProject(project);
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectRequest;
    }) => updateProject(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...PROJECTS_KEY, id] });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>([
        ...PROJECTS_KEY,
        id,
      ]);

      // Optimistically update
      if (previousProject) {
        queryClient.setQueryData([...PROJECTS_KEY, id], {
          ...previousProject,
          ...data,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProject };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData([...PROJECTS_KEY, id], context.previousProject);
      }
    },
    onSuccess: (project) => {
      // Update current project if it's the one being edited
      if (currentProject?.id === project.id) {
        setCurrentProject(project);
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const currentProject = useStore((state) => state.currentProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_, id) => {
      // If deleted project was current, clear it
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

// Save current configuration as new project
export function useSaveAsProject() {
  const createMutation = useCreateProject();
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  const saveAs = (name: string, description?: string) => {
    createMutation.mutate({
      name,
      description,
      plant_configuration: plantConfiguration,
      jar_test_id: selectedJarTestId || undefined,
    });
  };

  return {
    saveAs,
    isSaving: createMutation.isPending,
    error: createMutation.error,
    savedProject: createMutation.data,
  };
}

// Update current project with current configuration
export function useSaveProject() {
  const updateMutation = useUpdateProject();
  const currentProject = useStore((state) => state.currentProject);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  const save = () => {
    if (!currentProject) {
      console.error("No current project to save");
      return;
    }

    updateMutation.mutate({
      id: currentProject.id,
      data: {
        plant_configuration: plantConfiguration,
        jar_test_id: selectedJarTestId || undefined,
      },
    });
  };

  return {
    save,
    isSaving: updateMutation.isPending,
    error: updateMutation.error,
    canSave: !!currentProject,
  };
}
