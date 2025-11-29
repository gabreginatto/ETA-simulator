/**
 * Form for editing Filter parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { FilterParams } from "../../types";

interface FilterFormProps {
  nodeId: string;
  parameters: FilterParams;
}

const MEDIA_TYPES = [
  { value: "sand", label: "Sand" },
  { value: "dual_media", label: "Dual Media (Anthracite/Sand)" },
  { value: "gac", label: "Granular Activated Carbon (GAC)" },
] as const;

export function FilterForm({ nodeId, parameters }: FilterFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<FilterParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof FilterParams, value: number | string) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Media Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Filter Media Type
        </label>
        <select
          value={localParams.media_type || "dual_media"}
          onChange={(e) => handleChange("media_type", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500"
        >
          {MEDIA_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Filter media composition affects removal and head loss.
        </p>
      </div>

      {/* Run Length */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Filter Run Length
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.run_length_h}
            onChange={(e) =>
              handleChange("run_length_h", parseFloat(e.target.value) || 0)
            }
            min={4}
            max={72}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-500 w-16">hours</span>
        </div>
        <p className="text-xs text-gray-500">
          Time between backwashes. Typical: 12-48 hours
        </p>
      </div>

      {/* Loading Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Loading Rate
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.loading_rate_m3_m2_h ?? 10}
            onChange={(e) =>
              handleChange("loading_rate_m3_m2_h", parseFloat(e.target.value) || 0)
            }
            min={5}
            max={20}
            step={0.5}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-500 w-20">m³/m²·h</span>
        </div>
        <p className="text-xs text-gray-500">
          Hydraulic loading rate. Typical: 5-15 m³/m²·h
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
            min={85}
            max={99}
            step={1}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">85%</span>
            <span className="text-lg font-semibold text-emerald-600">
              {((localParams.capture_rate ?? 0.95) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">99%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Percentage of remaining solids captured. Typical: 90-98%
        </p>
      </div>

      {/* Backwash Info */}
      <div className="p-3 bg-emerald-50/50 rounded-md border border-emerald-100">
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700">Backwashes/day:</span>
          <span className="font-semibold text-emerald-800">
            {(24 / localParams.run_length_h).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-emerald-50 rounded-md border border-emerald-100">
        <h4 className="text-xs font-medium text-emerald-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-emerald-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Rapid Filtration</span>
          </div>
          <div className="flex justify-between">
            <span>Media:</span>
            <span className="font-medium">
              {MEDIA_TYPES.find((t) => t.value === (localParams.media_type || "dual_media"))?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Run:</span>
            <span className="font-medium">{localParams.run_length_h} hours</span>
          </div>
          <div className="flex justify-between">
            <span>Capture:</span>
            <span className="font-medium">
              {((localParams.capture_rate ?? 0.95) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-emerald-600 mt-2">
          Final polishing removes remaining suspended solids.
        </p>
      </div>
    </div>
  );
}
