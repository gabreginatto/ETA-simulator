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
import type { SimulationResult, GraphNode, GraphEdge, PlantSettings, EquipmentNodeData } from "../types";
import type { Node, Edge } from "@xyflow/react";

interface SimulateParams {
  jarTestOptimumPpm?: number;
}

/**
 * Filter nodes to only include those connected to the main graph.
 * Disconnected nodes (not connected to any edge) are excluded.
 */
function filterConnectedNodes(
  nodes: Node<EquipmentNodeData>[],
  edges: Edge[]
): Node<EquipmentNodeData>[] {
  // Get all node IDs that are part of any edge
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Return only nodes that are connected via edges
  return nodes.filter((node) => connectedNodeIds.has(node.id));
}

export function useSimulation() {
  const setSimulationResult = useStore((state) => state.setSimulationResult);
  const setIsSimulating = useStore((state) => state.setIsSimulating);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  const mutation = useMutation({
    mutationFn: async (params?: SimulateParams): Promise<SimulationResult> => {
      // Get current nodes/edges directly from store to ensure fresh data
      // (avoids stale closures when simulation is triggered)
      const { nodes, edges } = useStore.getState();

      // Filter out disconnected nodes before simulation
      const connectedNodes = filterConnectedNodes(nodes, edges);

      // Convert React Flow nodes/edges to API format
      const apiNodes: GraphNode[] = nodesToApiFormat(connectedNodes);
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
