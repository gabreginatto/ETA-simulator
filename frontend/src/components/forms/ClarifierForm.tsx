/**
 * Form for editing Clarifier parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { ClarifierParams } from "../../types";

interface ClarifierFormProps {
  nodeId: string;
  parameters: ClarifierParams;
}

export function ClarifierForm({ nodeId, parameters }: ClarifierFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<ClarifierParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof ClarifierParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Underflow Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Underflow Rate
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.underflow_rate_m3_h}
            onChange={(e) =>
              handleChange("underflow_rate_m3_h", parseFloat(e.target.value) || 0)
            }
            min={0}
            step={0.5}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 w-12">m³/h</span>
        </div>
        <p className="text-xs text-gray-500">
          Volumetric flow rate of the concentrated underflow stream
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
            value={(localParams.capture_rate ?? 0.98) * 100}
            onChange={(e) =>
              handleChange("capture_rate", parseFloat(e.target.value) / 100)
            }
            min={80}
            max={100}
            step={1}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">80%</span>
            <span className="text-lg font-semibold text-blue-600">
              {((localParams.capture_rate ?? 0.98) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of solids captured in underflow. Typical: 95-99%
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
        <h4 className="text-xs font-medium text-blue-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-blue-700">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">Gravity Clarifier</span>
          </div>
          <div className="flex justify-between">
            <span>Underflow:</span>
            <span className="font-medium">
              {localParams.underflow_rate_m3_h.toFixed(1)} m³/h
            </span>
          </div>
          <div className="flex justify-between">
            <span>Capture:</span>
            <span className="font-medium">
              {((localParams.capture_rate ?? 0.98) * 100).toFixed(0)}% of solids
            </span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Overflow (liquid) flow = Feed flow - Underflow rate
        </p>
      </div>
    </div>
  );
}
