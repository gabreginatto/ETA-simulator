/**
 * Form for editing Dewatering Unit parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { DewateringUnitParams } from "../../types";

interface DewateringFormProps {
  nodeId: string;
  parameters: DewateringUnitParams;
}

export function DewateringForm({ nodeId, parameters }: DewateringFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);
  const plantConfiguration = useStore((state) => state.plantConfiguration);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<DewateringUnitParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof DewateringUnitParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  // Check if feed flow exceeds max flow
  const feedFlow = plantConfiguration.feed_source.parameters.flow_m3_h;
  const isOverCapacity =
    localParams.max_flow_m3_h && feedFlow > localParams.max_flow_m3_h;

  return (
    <div className="space-y-4">
      {/* Over Capacity Warning */}
      {isOverCapacity && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Over Capacity
            </p>
            <p className="text-xs text-yellow-700">
              Feed flow ({feedFlow} m³/h) exceeds max capacity (
              {localParams.max_flow_m3_h} m³/h)
            </p>
          </div>
        </div>
      )}

      {/* Max Flow */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Maximum Flow Capacity
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.max_flow_m3_h ?? ""}
            onChange={(e) =>
              handleChange(
                "max_flow_m3_h",
                e.target.value ? parseFloat(e.target.value) : 0
              )
            }
            min={0}
            step={10}
            placeholder="Optional"
            className={`flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
              isOverCapacity
                ? "border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500"
                : "border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            }`}
          />
          <span className="text-sm text-gray-500 w-12">m³/h</span>
        </div>
        <p className="text-xs text-gray-500">
          Leave empty for no capacity limit
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
            value={localParams.capture_rate * 100}
            onChange={(e) =>
              handleChange("capture_rate", parseFloat(e.target.value) / 100)
            }
            min={80}
            max={100}
            step={1}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">80%</span>
            <span className="text-lg font-semibold text-orange-600">
              {(localParams.capture_rate * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">100%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of solids captured in cake. Typical: 90-98%
        </p>
      </div>

      {/* Cake Dryness */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Cake Dryness (DS)
        </label>
        <div className="space-y-2">
          <input
            type="range"
            value={localParams.cake_dryness_percent}
            onChange={(e) =>
              handleChange("cake_dryness_percent", parseFloat(e.target.value))
            }
            min={15}
            max={35}
            step={0.5}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">15%</span>
            <span className="text-lg font-semibold text-orange-600">
              {localParams.cake_dryness_percent.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">35%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Target dry solids content in cake. Typical: 18-28%
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-100">
        <h4 className="text-xs font-medium text-orange-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-orange-700">
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">Centrifuge / Belt Press</span>
          </div>
          <div className="flex justify-between">
            <span>Capture:</span>
            <span className="font-medium">
              {(localParams.capture_rate * 100).toFixed(0)}% of solids
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cake DS:</span>
            <span className="font-medium">
              {localParams.cake_dryness_percent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
