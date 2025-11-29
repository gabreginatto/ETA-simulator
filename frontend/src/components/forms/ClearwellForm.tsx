/**
 * Form for editing Clearwell parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { ClearwellParams } from "../../types";

interface ClearwellFormProps {
  nodeId: string;
  parameters: ClearwellParams;
}

export function ClearwellForm({ nodeId, parameters }: ClearwellFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<ClearwellParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof ClearwellParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Volume */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Storage Volume
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.volume_m3}
            onChange={(e) =>
              handleChange("volume_m3", parseFloat(e.target.value) || 0)
            }
            min={10}
            step={10}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 w-12">m³</span>
        </div>
        <p className="text-xs text-gray-500">
          Total water storage capacity for disinfection contact time.
        </p>
      </div>

      {/* Contact Time */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Contact Time (CT Target)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.contact_time_min ?? 30}
            onChange={(e) =>
              handleChange("contact_time_min", parseFloat(e.target.value) || 0)
            }
            min={10}
            max={120}
            step={5}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500 w-12">min</span>
        </div>
        <p className="text-xs text-gray-500">
          Target detention time for disinfection. Typical: 20-60 minutes.
        </p>
      </div>

      {/* Hydraulic Retention Info */}
      <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Note:</span> Actual HRT depends on inlet flow rate.
          For a 500 m³/h flow with {localParams.volume_m3} m³ volume:
        </p>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-blue-700">Theoretical HRT:</span>
          <span className="font-semibold text-blue-800">
            {((localParams.volume_m3 / 500) * 60).toFixed(1)} min
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
        <h4 className="text-xs font-medium text-blue-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-blue-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Clearwell / Contact Tank</span>
          </div>
          <div className="flex justify-between">
            <span>Volume:</span>
            <span className="font-medium">{localParams.volume_m3} m³</span>
          </div>
          <div className="flex justify-between">
            <span>Target CT:</span>
            <span className="font-medium">{localParams.contact_time_min ?? 30} min</span>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Provides contact time for disinfection and storage buffer.
        </p>
      </div>
    </div>
  );
}
