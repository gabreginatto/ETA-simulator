/**
 * Custom hook for running simulations using graph-based API.
 *
 * This hook automatically serializes React Flow nodes and edges
 * from the store to the API format.
 */
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { simulate } from "../api/client";
import { useStore, nodesToApiFormat, edgesToApiFormat } from "../store/useStore";
import type { SimulationResult, GraphNode, GraphEdge, PlantSettings } from "../types";

interface SimulateParams {
  jarTestOptimumPpm?: number;
}

export function useSimulation() {
  const setSimulationResult = useStore((state) => state.setSimulationResult);
  const setIsSimulating = useStore((state) => state.setIsSimulating);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const mutation = useMutation({
    mutationFn: async (params?: SimulateParams): Promise<SimulationResult> => {
      // Convert React Flow nodes/edges to API format
      const apiNodes: GraphNode[] = nodesToApiFormat(nodes);
      const apiEdges: GraphEdge[] = edgesToApiFormat(edges);

      // Extract settings from plant configuration
      const settings: PlantSettings | undefined = plantConfiguration?.settings;

      return simulate(
        apiNodes,
        apiEdges,
        selectedJarTestId || undefined,
        params?.jarTestOptimumPpm,
        settings
      );
    },
    onMutate: () => {
      setIsSimulating(true);
    },
    onSuccess: (result) => {
      setSimulationResult(result);
    },
    onError: (error) => {
      console.error("Simulation failed:", error);
      setSimulationResult(null);
    },
    onSettled: () => {
      setIsSimulating(false);
    },
  });

  // Convenience function that uses current store state
  const runSimulation = useCallback(() => {
    mutation.mutate({});
  }, [mutation]);

  return {
    simulate: mutation.mutate,
    runSimulation,
    isSimulating: mutation.isPending,
    error: mutation.error,
    result: mutation.data,
    reset: mutation.reset,
  };
}
