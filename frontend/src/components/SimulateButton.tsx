/**
 * Prominent simulate button with loading state, validation, and toast feedback.
 * Dark glass morphism design with gradient accents.
 */
import { useEffect, useCallback, useRef, useState } from "react";
import { Play, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { useToast } from "../hooks/useToast";
import { useStore, useSimulationResult } from "../store/useStore";

interface SimulateButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function SimulateButton({ onSuccess, onError }: SimulateButtonProps) {
  const { runSimulation, isSimulating, error, result } = useSimulation();
  const toast = useToast();
  const simulationResult = useSimulationResult();

  const validationErrors = useStore((state) => state.validationErrors);
  const validationWarnings = useStore((state) => state.validationWarnings);
  const isValidating = useStore((state) => state.isValidating);

  const hasErrors = validationErrors.length > 0;
  const hasWarnings = validationWarnings.length > 0;

  // Count warnings from last simulation result
  const resultWarningCount = simulationResult?.warnings?.length ?? 0;

  const [showConfirm, setShowConfirm] = useState(false);

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
    if (hasErrors) {
      toast.error("Cannot Simulate", "Fix validation errors before simulating");
      return;
    }

    if (hasWarnings && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setShowConfirm(false);
    runSimulation();
  }, [runSimulation, hasErrors, hasWarnings, showConfirm, toast]);

  const handleConfirmSimulate = useCallback(() => {
    setShowConfirm(false);
    runSimulation();
  }, [runSimulation]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSimulating && !hasErrors) {
        e.preventDefault();
        if (hasWarnings) {
          setShowConfirm(true);
        } else {
          runSimulation();
        }
      }
      // Escape to cancel confirm
      if (e.key === "Escape" && showConfirm) {
        setShowConfirm(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runSimulation, isSimulating, hasErrors, hasWarnings, showConfirm]);

  // Determine button state and style
  const isDisabled = isSimulating || isValidating || hasErrors;

  // Confirmation dialog for warnings
  if (showConfirm) {
    return (
      <div className="glass rounded-xl shadow-float p-2 flex items-center gap-2 animate-scale-in">
        <div className="flex items-center gap-2 px-3 py-1 text-status-warning">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Run with {validationWarnings.length} warning{validationWarnings.length > 1 ? 's' : ''}?</span>
        </div>
        <button
          onClick={handleConfirmSimulate}
          className="px-3 py-1.5 bg-status-warning text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Yes, Simulate
        </button>
        <button
          onClick={handleCancelConfirm}
          className="px-3 py-1.5 bg-surface-highlight text-content-secondary text-sm font-medium rounded-lg hover:bg-surface-elevated transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex items-center justify-center gap-2
        px-6 py-3 rounded-xl
        font-semibold text-white
        shadow-float
        transition-all duration-200
        animate-slide-up
        ${
          isSimulating
            ? "bg-primary-400/80 cursor-not-allowed"
            : hasErrors
            ? "bg-status-error cursor-not-allowed"
            : hasWarnings
            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 hover:shadow-glow-blue active:scale-[0.98]"
            : "bg-gradient-to-r from-primary-500 to-cyan-400 hover:from-primary-400 hover:to-cyan-300 hover:shadow-glow-cyan active:scale-[0.98]"
        }
        focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:ring-offset-2 focus:ring-offset-surface-canvas
      `}
      title={
        hasErrors
          ? "Fix validation errors before simulating"
          : hasWarnings
          ? "Run with warnings (Ctrl+Enter)"
          : "Run simulation (Ctrl+Enter)"
      }
    >
      {isSimulating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Simulating...</span>
        </>
      ) : hasErrors ? (
        <>
          <AlertCircle className="w-5 h-5" />
          <span>Fix Errors</span>
        </>
      ) : hasWarnings ? (
        <>
          <AlertTriangle className="w-5 h-5" />
          <span>Simulate</span>
          {resultWarningCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              {resultWarningCount}
            </span>
          )}
        </>
      ) : (
        <>
          <Play className="w-5 h-5" />
          <span>Simulate</span>
          {resultWarningCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
              {resultWarningCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
