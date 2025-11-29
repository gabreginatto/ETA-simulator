/**
 * Form for editing DAF (Dissolved Air Flotation) parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { DAFParams } from "../../types";

interface DAFFormProps {
  nodeId: string;
  parameters: DAFParams;
}

export function DAFForm({ nodeId, parameters }: DAFFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<DAFParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof DAFParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Air-to-Solids Ratio */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Air-to-Solids Ratio
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.air_to_solids_ratio ?? 0.02}
            onChange={(e) =>
              handleChange("air_to_solids_ratio", parseFloat(e.target.value) || 0)
            }
            min={0.01}
            max={0.1}
            step={0.005}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-500 w-20">kg/kg</span>
        </div>
        <p className="text-xs text-gray-500">
          Mass of air per mass of solids. Typical: 0.02-0.06 kg/kg
        </p>
      </div>

      {/* Recycle Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Recycle Rate
        </label>
        <div className="space-y-2">
          <input
            type="range"
            value={(localParams.recycle_rate ?? 0.1) * 100}
            onChange={(e) =>
              handleChange("recycle_rate", parseFloat(e.target.value) / 100)
            }
            min={5}
            max={30}
            step={1}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">5%</span>
            <span className="text-lg font-semibold text-cyan-600">
              {((localParams.recycle_rate ?? 0.1) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">30%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Fraction of flow recycled through pressurized system. Typical: 8-15%
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
            min={80}
            max={99}
            step={1}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">80%</span>
            <span className="text-lg font-semibold text-cyan-600">
              {(localParams.capture_rate * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">99%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of suspended solids removed. Typical: 90-98%
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-cyan-50 rounded-md border border-cyan-100">
        <h4 className="text-xs font-medium text-cyan-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-cyan-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Dissolved Air Flotation</span>
          </div>
          <div className="flex justify-between">
            <span>A/S Ratio:</span>
            <span className="font-medium">
              {(localParams.air_to_solids_ratio ?? 0.02).toFixed(3)} kg/kg
            </span>
          </div>
          <div className="flex justify-between">
            <span>Recycle:</span>
            <span className="font-medium">
              {((localParams.recycle_rate ?? 0.1) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Removal:</span>
            <span className="font-medium">
              {(localParams.capture_rate * 100).toFixed(0)}% of solids
            </span>
          </div>
        </div>
        <p className="text-xs text-cyan-600 mt-2">
          Float stream contains removed solids; clarified water continues.
        </p>
      </div>
    </div>
  );
}
