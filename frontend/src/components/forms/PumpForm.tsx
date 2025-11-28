/**
 * Form for editing Pump parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { PumpParams } from "../../types";

interface PumpFormProps {
  nodeId: string;
  parameters: PumpParams;
}

export function PumpForm({ nodeId, parameters }: PumpFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<PumpParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof PumpParams, value: number) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Head */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Pump Head
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.head_m}
            onChange={(e) => handleChange("head_m", parseFloat(e.target.value) || 0)}
            min={0}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-500 w-12">m</span>
        </div>
      </div>

      {/* Pump Efficiency */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Pump Efficiency
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={Math.round(localParams.efficiency_pump * 100)}
            onChange={(e) => {
               const val = parseFloat(e.target.value) || 0;
               handleChange("efficiency_pump", val / 100);
            }}
            min={0}
            max={100}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-500 w-12">%</span>
        </div>
      </div>

       {/* Motor Efficiency */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Motor Efficiency
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={Math.round(localParams.efficiency_motor * 100)}
            onChange={(e) => {
               const val = parseFloat(e.target.value) || 0;
               handleChange("efficiency_motor", val / 100);
            }}
            min={0}
            max={100}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <span className="text-sm text-gray-500 w-12">%</span>
        </div>
      </div>
    </div>
  );
}
