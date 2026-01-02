/**
 * Prominent simulate button with loading state, validation, and toast feedback.
 */
import { useEffect, useCallback, useRef, useState } from "react";
import { Play, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { useSimulation } from "../hooks/useSimulation";
import { useToast } from "../hooks/useToast";
import { useStore, useSimulationResult } from "../store/useStore";

interface SimulateButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /** Compact mode for mobile header */
  compact?: boolean;
}

export function SimulateButton({ onSuccess, onError, compact = false }: SimulateButtonProps) {
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

  const buttonClass = `
    flex items-center justify-center gap-2
    ${compact ? "px-4 py-2 text-sm rounded-lg" : "px-6 py-3 rounded-lg"}
    text-white font-semibold shadow-md
    transition-all duration-200
    ${
      isSimulating
        ? "bg-blue-400 cursor-not-allowed"
        : hasErrors
        ? "bg-red-500 cursor-not-allowed"
        : hasWarnings
        ? "bg-amber-500 hover:bg-amber-600 hover:shadow-lg active:scale-[0.98]"
        : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]"
    }
  `;

  // Confirmation dialog for warnings
  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 border border-amber-200">
        <div className="flex items-center gap-2 px-3 py-1 text-amber-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Run with {validationWarnings.length} warning{validationWarnings.length > 1 ? 's' : ''}?</span>
        </div>
        <button
          onClick={handleConfirmSimulate}
          className="px-3 py-1.5 bg-amber-500 text-white text-sm font-medium rounded hover:bg-amber-600 transition-colors"
        >
          Yes, Simulate
        </button>
        <button
          onClick={handleCancelConfirm}
          className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded hover:bg-slate-200 transition-colors"
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
      className={buttonClass}
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
          <Loader2 className={`${compact ? "w-4 h-4" : "w-5 h-5"} animate-spin`} />
          {!compact && "Simulating..."}
        </>
      ) : hasErrors ? (
        <>
          <AlertCircle className={compact ? "w-4 h-4" : "w-5 h-5"} />
          {!compact && "Fix Errors"}
        </>
      ) : hasWarnings ? (
        <>
          <AlertTriangle className={compact ? "w-4 h-4" : "w-5 h-5"} />
          {compact ? "Run" : "Simulate"}
          {resultWarningCount > 0 && !compact && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
              {resultWarningCount}
            </span>
          )}
        </>
      ) : (
        <>
          <Play className={compact ? "w-4 h-4" : "w-5 h-5"} />
          {compact ? "Run" : "Simulate"}
          {resultWarningCount > 0 && !compact && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              {resultWarningCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
