/**
 * Form for editing Feed Source parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore, useErrorsForPath, useWarningsForPath } from "../../store/useStore";
import { debounce, cn } from "../../lib/utils";
import type { FeedSourceParams } from "../../types";

interface FeedFormProps {
  nodeId: string;
  parameters: FeedSourceParams;
}

export function FeedForm({ nodeId, parameters }: FeedFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Get validation errors/warnings from backend for each field
  const flowErrors = useErrorsForPath("feed_source.parameters.flow_m3_h");
  const tsErrors = useErrorsForPath("feed_source.parameters.ts_percent");
  const tempErrors = useErrorsForPath("feed_source.parameters.temperature_C");
  const flowWarnings = useWarningsForPath("feed_source.parameters.flow_m3_h");
  const tsWarnings = useWarningsForPath("feed_source.parameters.ts_percent");

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<FeedSourceParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof FeedSourceParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Flow Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Flow Rate
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.flow_m3_h}
            onChange={(e) => handleChange("flow_m3_h", parseFloat(e.target.value) || 0)}
            min={0}
            step={1}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1",
              flowErrors.length > 0
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : flowWarnings.length > 0
                ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
            )}
          />
          <span className="text-sm text-gray-500 w-12">m³/h</span>
        </div>
        {localParams.flow_m3_h < 0 && (
          <p className="text-xs text-red-500">Flow rate must be positive</p>
        )}
        {flowErrors.length > 0 && (
          <p className="text-xs text-red-500">{flowErrors[0].message}</p>
        )}
        {flowWarnings.length > 0 && flowErrors.length === 0 && (
          <p className="text-xs text-amber-600">{flowWarnings[0].message}</p>
        )}
      </div>

      {/* Total Solids */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Total Solids (TS)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.ts_percent}
            onChange={(e) => handleChange("ts_percent", parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.1}
            className={cn(
              "flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1",
              tsErrors.length > 0
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : tsWarnings.length > 0
                ? "border-amber-500 focus:border-amber-500 focus:ring-amber-500"
                : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
            )}
          />
          <span className="text-sm text-gray-500 w-12">%</span>
        </div>
        {(localParams.ts_percent < 0 || localParams.ts_percent > 100) && (
          <p className="text-xs text-red-500">TS must be between 0 and 100%</p>
        )}
        {tsErrors.length > 0 && (
          <p className="text-xs text-red-500">{tsErrors[0].message}</p>
        )}
        {tsWarnings.length > 0 && tsErrors.length === 0 && (
          <p className="text-xs text-amber-600">{tsWarnings[0].message}</p>
        )}
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Temperature
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.temperature_C ?? 20}
            onChange={(e) => handleChange("temperature_C", parseFloat(e.target.value) || 20)}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-500 w-12">°C</span>
        </div>
      </div>

      {/* Calculated values */}
      <div className="mt-4 p-3 bg-cyan-50 rounded-md border border-cyan-100">
        <h4 className="text-xs font-medium text-cyan-800 mb-2">Calculated</h4>
        <div className="space-y-1 text-xs text-cyan-700">
          <div className="flex justify-between">
            <span>Mass Flow:</span>
            <span className="font-medium">
              {(localParams.flow_m3_h * 1000).toLocaleString()} kg/h
            </span>
          </div>
          <div className="flex justify-between">
            <span>Dry Solids:</span>
            <span className="font-medium">
              {(localParams.flow_m3_h * 1000 * localParams.ts_percent / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
