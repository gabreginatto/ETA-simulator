/**
 * Form for editing Sedimentation parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { SedimentationParams } from "../../types";

interface SedimentationFormProps {
  nodeId: string;
  parameters: SedimentationParams;
}

export function SedimentationForm({ nodeId, parameters }: SedimentationFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<SedimentationParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof SedimentationParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Surface Loading Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Surface Loading Rate
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.surface_loading_m3_m2_h ?? 2.5}
            onChange={(e) =>
              handleChange("surface_loading_m3_m2_h", parseFloat(e.target.value) || 0)
            }
            min={0.5}
            max={5}
            step={0.1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-pink-500 focus:ring-pink-500"
          />
          <span className="text-sm text-gray-500 w-20">m³/m²·h</span>
        </div>
        <p className="text-xs text-gray-500">
          Overflow rate. Typical: 1.5-3.0 m³/m²·h for conventional settling.
        </p>
      </div>

      {/* Capture Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Solids Removal Efficiency
        </label>
        <div className="space-y-2">
          <input
            type="range"
            value={localParams.capture_rate * 100}
            onChange={(e) =>
              handleChange("capture_rate", parseFloat(e.target.value) / 100)
            }
            min={70}
            max={99}
            step={1}
            className="w-full accent-pink-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">70%</span>
            <span className="text-lg font-semibold text-pink-600">
              {(localParams.capture_rate * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">99%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of suspended solids removed. Typical: 85-95%
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-pink-50 rounded-md border border-pink-100">
        <h4 className="text-xs font-medium text-pink-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-pink-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Sedimentation</span>
          </div>
          <div className="flex justify-between">
            <span>Loading:</span>
            <span className="font-medium">
              {(localParams.surface_loading_m3_m2_h ?? 2.5).toFixed(1)} m³/m²·h
            </span>
          </div>
          <div className="flex justify-between">
            <span>Removal:</span>
            <span className="font-medium">
              {(localParams.capture_rate * 100).toFixed(0)}% of solids
            </span>
          </div>
        </div>
        <p className="text-xs text-pink-600 mt-2">
          Gravity settling removes floc before filtration.
        </p>
      </div>
    </div>
  );
}
