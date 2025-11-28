/**
 * Form for editing Polymer Conditioner parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore, useErrorsForPath, useWarningsForPath } from "../../store/useStore";
import { debounce, cn } from "../../lib/utils";
import type { PolymerConditionerParams } from "../../types";

interface PolymerFormProps {
  nodeId: string;
  parameters: PolymerConditionerParams;
}

export function PolymerForm({ nodeId, parameters }: PolymerFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);
  const jarTests = useStore((state) => state.jarTests);
  const selectedJarTestId = useStore((state) => state.selectedJarTestId);
  const selectJarTest = useStore((state) => state.selectJarTest);

  // Get validation errors/warnings from backend
  const doseErrors = useErrorsForPath("polymer_conditioner.parameters.jar_test_optimum_ppm");
  const shearErrors = useErrorsForPath("polymer_conditioner.parameters.shear_factor");
  const safetyErrors = useErrorsForPath("polymer_conditioner.parameters.safety_factor");
  const doseWarnings = useWarningsForPath("polymer_conditioner.parameters.jar_test_optimum_ppm");

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<PolymerConditionerParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof PolymerConditionerParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  const handleJarTestSelect = (jarTestId: string) => {
    if (jarTestId === "") {
      selectJarTest(null);
    } else {
      selectJarTest(jarTestId);
      // The store will automatically update the polymer dose
    }
  };

  // Calculate effective dose
  const effectiveDose =
    localParams.jar_test_optimum_ppm *
    localParams.shear_factor *
    localParams.safety_factor;

  // Find selected jar test for display
  const selectedJarTest = jarTests.find((jt) => jt.id === selectedJarTestId);

  return (
    <div className="space-y-4">
      {/* Jar Test Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Jar Test
        </label>
        <select
          value={selectedJarTestId || ""}
          onChange={(e) => handleJarTestSelect(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">Manual dose entry</option>
          {jarTests.map((jt) => (
            <option key={jt.id} value={jt.id}>
              {jt.polymer.name} ({jt.analysis.optimum_dose_ppm} ppm) - {jt.id}
            </option>
          ))}
        </select>
        {selectedJarTest && (
          <p className="text-xs text-violet-600">
            {selectedJarTest.sample.source} • {selectedJarTest.date}
          </p>
        )}
      </div>

      {/* Jar Test Optimum Dose */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Optimum Dose (from jar test)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.jar_test_optimum_ppm}
            onChange={(e) =>
              handleChange("jar_test_optimum_ppm", parseFloat(e.target.value) || 0)
            }
            min={0}
            step={0.5}
            disabled={!!selectedJarTestId}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:cursor-not-allowed",
              doseErrors.length > 0
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : doseWarnings.length > 0
                ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                : "border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            )}
          />
          <span className="text-sm text-gray-500 w-12">ppm</span>
        </div>
        {doseErrors.length > 0 && (
          <p className="text-xs text-red-500">{doseErrors[0].message}</p>
        )}
        {doseWarnings.length > 0 && doseErrors.length === 0 && (
          <p className="text-xs text-amber-600">{doseWarnings[0].message}</p>
        )}
      </div>

      {/* Shear Factor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Shear Factor
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.shear_factor}
            onChange={(e) => handleChange("shear_factor", parseFloat(e.target.value) || 1)}
            min={1}
            max={2}
            step={0.1}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1",
              shearErrors.length > 0
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            )}
          />
          <span className="text-sm text-gray-500 w-12">×</span>
        </div>
        <p className="text-xs text-gray-500">
          Accounts for polymer degradation due to shear. Typical: 1.1-1.5
        </p>
        {shearErrors.length > 0 && (
          <p className="text-xs text-red-500">{shearErrors[0].message}</p>
        )}
      </div>

      {/* Safety Factor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Safety Factor
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.safety_factor}
            onChange={(e) => handleChange("safety_factor", parseFloat(e.target.value) || 1)}
            min={1}
            max={1.5}
            step={0.05}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1",
              safetyErrors.length > 0
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-violet-500 focus:ring-violet-500"
            )}
          />
          <span className="text-sm text-gray-500 w-12">×</span>
        </div>
        <p className="text-xs text-gray-500">
          Extra margin for variability. Typical: 1.05-1.15
        </p>
        {safetyErrors.length > 0 && (
          <p className="text-xs text-red-500">{safetyErrors[0].message}</p>
        )}
      </div>

      {/* Effective Dose Calculation */}
      <div className="mt-4 p-3 bg-violet-50 rounded-md border border-violet-100">
        <h4 className="text-xs font-medium text-violet-800 mb-2">
          Effective Dose
        </h4>
        <div className="text-center">
          <span className="text-2xl font-bold text-violet-700">
            {effectiveDose.toFixed(1)}
          </span>
          <span className="text-sm text-violet-600 ml-1">ppm</span>
        </div>
        <p className="text-xs text-violet-600 text-center mt-1">
          {localParams.jar_test_optimum_ppm} × {localParams.shear_factor} ×{" "}
          {localParams.safety_factor}
        </p>
      </div>
    </div>
  );
}
