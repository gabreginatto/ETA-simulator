/**
 * Hook for validating plant configuration with debounced API calls.
 * Updates the global store with validation results.
 */
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "../store/useStore";
import { validateConfiguration, ValidationResult } from "../api/client";

const DEBOUNCE_MS = 500;

/**
 * Hook that automatically validates plant configuration on changes.
 * Updates the store with validation errors and warnings.
 */
export function useValidation(): void {
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const setValidationErrors = useStore((state) => state.setValidationErrors);
  const setValidationWarnings = useStore((state) => state.setValidationWarnings);
  const setIsValidating = useStore((state) => state.setIsValidating);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Validate function
  const validate = useCallback(async (): Promise<ValidationResult | null> => {
    setIsValidating(true);

    try {
      const result = await validateConfiguration(plantConfiguration);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
      return result;
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [plantConfiguration, setValidationErrors, setValidationWarnings, setIsValidating]);

  // Debounced validation on config change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      validate();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [plantConfiguration, validate]);
}

/**
 * Hook to manually trigger validation and get the result.
 */
export function useValidateOnDemand() {
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const setValidationErrors = useStore((state) => state.setValidationErrors);
  const setValidationWarnings = useStore((state) => state.setValidationWarnings);
  const setIsValidating = useStore((state) => state.setIsValidating);

  return useCallback(async (): Promise<ValidationResult | null> => {
    setIsValidating(true);

    try {
      const result = await validateConfiguration(plantConfiguration);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
      return result;
    } catch (error) {
      console.error("Validation error:", error);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [plantConfiguration, setValidationErrors, setValidationWarnings, setIsValidating]);
}
