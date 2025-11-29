/**
 * Form for editing Flocculator parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { FlocculatorParams } from "../../types";

interface FlocculatorFormProps {
  nodeId: string;
  parameters: FlocculatorParams;
}

export function FlocculatorForm({ nodeId, parameters }: FlocculatorFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<FlocculatorParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof FlocculatorParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Detention Time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Detention Time
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.detention_time_min}
            onChange={(e) =>
              handleChange("detention_time_min", parseFloat(e.target.value) || 0)
            }
            min={5}
            max={60}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-500 w-12">min</span>
        </div>
        <p className="text-xs text-gray-500">
          Hydraulic retention time. Typical: 15-30 minutes.
        </p>
      </div>

      {/* G-Value */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          G-Value (Velocity Gradient)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.g_value ?? 50}
            onChange={(e) =>
              handleChange("g_value", parseFloat(e.target.value) || 0)
            }
            min={10}
            max={100}
            step={5}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-500 w-12">s⁻¹</span>
        </div>
        <p className="text-xs text-gray-500">
          Mixing intensity. Typical: 20-75 s⁻¹ for gentle flocculation.
        </p>
      </div>

      {/* GT Product Display */}
      <div className="p-3 bg-indigo-50/50 rounded-md border border-indigo-100">
        <div className="flex justify-between text-sm">
          <span className="text-indigo-700">GT Product:</span>
          <span className="font-semibold text-indigo-800">
            {((localParams.g_value ?? 50) * localParams.detention_time_min * 60).toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-indigo-600 mt-1">
          G × t dimensionless. Optimal: 10,000 - 100,000
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-indigo-50 rounded-md border border-indigo-100">
        <h4 className="text-xs font-medium text-indigo-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-indigo-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Flocculation</span>
          </div>
          <div className="flex justify-between">
            <span>Detention:</span>
            <span className="font-medium">{localParams.detention_time_min} min</span>
          </div>
          <div className="flex justify-between">
            <span>Mixing:</span>
            <span className="font-medium">{localParams.g_value ?? 50} s⁻¹</span>
          </div>
        </div>
        <p className="text-xs text-indigo-600 mt-2">
          Gentle mixing promotes floc growth for sedimentation.
        </p>
      </div>
    </div>
  );
}
