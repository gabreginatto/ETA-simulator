/**
 * Banner component showing validation errors and warnings.
 * Dark glass morphism design.
 */
import { AlertCircle, AlertTriangle, X } from "lucide-react";
import { useStore } from "../../store/useStore";

export function ValidationBanner() {
  const errors = useStore((state) => state.validationErrors);
  const warnings = useStore((state) => state.validationWarnings);
  const clearValidation = useStore((state) => state.clearValidation);

  // Don't render if no issues
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 animate-fade-in">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="glass rounded-xl p-3 border border-status-error/30 bg-status-error/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-status-error">
                {errors.length} validation error{errors.length > 1 ? "s" : ""}
              </h4>
              <ul className="mt-1 text-sm text-status-error/80 list-disc list-inside space-y-0.5">
                {errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
                {errors.length > 5 && (
                  <li className="text-status-error/60">
                    ...and {errors.length - 5} more
                  </li>
                )}
              </ul>
            </div>
            <button
              onClick={clearValidation}
              className="p-1 text-status-error/60 hover:text-status-error transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="glass rounded-xl p-3 border border-status-warning/30 bg-status-warning/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-status-warning">
                {warnings.length} warning{warnings.length > 1 ? "s" : ""}
              </h4>
              <ul className="mt-1 text-sm text-status-warning/80 list-disc list-inside space-y-0.5">
                {warnings.slice(0, 3).map((warning, idx) => (
                  <li key={idx}>{warning.message}</li>
                ))}
                {warnings.length > 3 && (
                  <li className="text-status-warning/60">
                    ...and {warnings.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
