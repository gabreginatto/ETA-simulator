/**
 * Custom hook for running simulations.
 */
import { useMutation } from "@tanstack/react-query";
import { simulate } from "../api/client";
import { useStore } from "../store/useStore";
import type { PlantConfiguration, SimulationResult } from "../types";

interface SimulateParams {
  plantDefinition: PlantConfiguration;
  jarTestId?: string;
  jarTestOptimumPpm?: number;
}

export function useSimulation() {
  const setSimulationResult = useStore((state) => state.setSimulationResult);
  const setIsSimulating = useStore((state) => state.setIsSimulating);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);

  const mutation = useMutation({
    mutationFn: async (params: SimulateParams): Promise<SimulationResult> => {
      return simulate(
        params.plantDefinition,
        params.jarTestId,
        params.jarTestOptimumPpm
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
  const runSimulation = () => {
    mutation.mutate({
      plantDefinition: plantConfiguration,
      jarTestId: selectedJarTestId || undefined,
    });
  };

  return {
    simulate: mutation.mutate,
    runSimulation,
    isSimulating: mutation.isPending,
    error: mutation.error,
    result: mutation.data,
    reset: mutation.reset,
  };
}
