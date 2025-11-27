/**
 * Prominent simulate button with loading state and toast feedback.
 */
import { useEffect, useCallback, useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { useToast } from "../hooks/useToast";

interface SimulateButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SimulateButton({ onSuccess, onError }: SimulateButtonProps) {
  const { runSimulation, isSimulating, error, result } = useSimulation();
  const toast = useToast();

  // Track if we've already shown toast for current result/error
  const lastResultRef = useRef<typeof result | null>(null);
  const lastErrorRef = useRef<typeof error | null>(null);

  // Handle simulation results
  useEffect(() => {
    if (result && result.success && result !== lastResultRef.current) {
      lastResultRef.current = result;
      const warnings = result.warnings || [];
      if (warnings.length > 0) {
        toast.warning("Simulation Complete", warnings[0]);
      } else {
        toast.success("Simulation Complete", "Mass balance calculated successfully");
      }
      onSuccess?.();
    }
  }, [result, onSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle simulation errors
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      toast.error("Simulation Failed", error.message || "An unexpected error occurred");
      onError?.(error as Error);
    }
  }, [error, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback(() => {
    runSimulation();
  }, [runSimulation]);

  // Keyboard shortcut: Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSimulating) {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClick, isSimulating]);

  return (
    <button
      onClick={handleClick}
      disabled={isSimulating}
      className={`
        flex items-center justify-center gap-2 px-6 py-3
        text-white font-semibold rounded-lg shadow-md
        transition-all duration-200
        ${
          isSimulating
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
        }
      `}
      title="Run simulation (Ctrl+Enter)"
    >
      {isSimulating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Play className="w-5 h-5" />
          Simulate
        </>
      )}
    </button>
  );
}
