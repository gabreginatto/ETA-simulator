/**
 * Form for editing Thickener parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { ThickenerParams } from "../../types";

interface ThickenerFormProps {
  nodeId: string;
  parameters: ThickenerParams;
}

export function ThickenerForm({ nodeId, parameters }: ThickenerFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<ThickenerParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof ThickenerParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Target TS */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Target Thickened TS
        </label>
        <div className="space-y-2">
          <input
            type="range"
            value={localParams.target_thickened_ts_percent}
            onChange={(e) =>
              handleChange("target_thickened_ts_percent", parseFloat(e.target.value))
            }
            min={2}
            max={12}
            step={0.5}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">2%</span>
            <span className="text-lg font-semibold text-emerald-600">
              {localParams.target_thickened_ts_percent.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">12%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Target total solids in thickened output. Typical: 4-8%
        </p>
      </div>

      {/* Capture Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Solids Capture Rate
        </label>
        <div className="space-y-2">
          <input
            type="range"
            value={(localParams.capture_rate ?? 0.95) * 100}
            onChange={(e) =>
              handleChange("capture_rate", parseFloat(e.target.value) / 100)
            }
            min={80}
            max={100}
            step={1}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">80%</span>
            <span className="text-lg font-semibold text-emerald-600">
              {((localParams.capture_rate ?? 0.95) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of solids captured in thickened output. Typical: 90-98%
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-emerald-50 rounded-md border border-emerald-100">
        <h4 className="text-xs font-medium text-emerald-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-emerald-700">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">Gravity Thickener</span>
          </div>
          <div className="flex justify-between">
            <span>Target TS:</span>
            <span className="font-medium">
              {localParams.target_thickened_ts_percent.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Capture:</span>
            <span className="font-medium">
              {((localParams.capture_rate ?? 0.95) * 100).toFixed(0)}% of solids
            </span>
          </div>
        </div>
        <p className="text-xs text-emerald-600 mt-2">
          Concentrates sludge by gravity settling, removing water to supernatant
        </p>
      </div>
    </div>
  );
}
