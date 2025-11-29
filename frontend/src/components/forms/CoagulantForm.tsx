/**
 * Form for editing Coagulant parameters.
 */
import { useState, useCallback, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { debounce } from "../../lib/utils";
import type { CoagulantParams } from "../../types";

interface CoagulantFormProps {
  nodeId: string;
  parameters: CoagulantParams;
}

const COAGULANT_TYPES = [
  { value: "alum", label: "Aluminum Sulfate (Alum)" },
  { value: "ferric_chloride", label: "Ferric Chloride" },
  { value: "pac", label: "Polyaluminum Chloride (PAC)" },
  { value: "other", label: "Other" },
] as const;

export function CoagulantForm({ nodeId, parameters }: CoagulantFormProps) {
  const updateNodeParameters = useStore((state) => state.updateNodeParameters);

  // Local state for immediate UI updates
  const [localParams, setLocalParams] = useState(parameters);

  // Sync local state when props change
  useEffect(() => {
    setLocalParams(parameters);
  }, [parameters]);

  // Debounced update to store
  const debouncedUpdate = useCallback(
    debounce((params: Partial<CoagulantParams>) => {
      updateNodeParameters(nodeId, params);
    }, 300),
    [nodeId, updateNodeParameters]
  );

  const handleChange = (field: keyof CoagulantParams, value: number | string) => {
    setLocalParams((prev) => ({ ...prev, [field]: value }));
    debouncedUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Dose */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Coagulant Dose
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localParams.dose_mg_L}
            onChange={(e) =>
              handleChange("dose_mg_L", parseFloat(e.target.value) || 0)
            }
            min={0}
            step={1}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm text-gray-500 w-12">mg/L</span>
        </div>
        <p className="text-xs text-gray-500">
          Coagulant dosage rate. Typical: 10-50 mg/L depending on raw water quality.
        </p>
      </div>

      {/* Coagulant Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Coagulant Type
        </label>
        <select
          value={localParams.coagulant_type || "alum"}
          onChange={(e) => handleChange("coagulant_type", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-amber-500 focus:ring-amber-500"
        >
          {COAGULANT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Type of coagulant used for floc formation.
        </p>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-100">
        <h4 className="text-xs font-medium text-amber-800 mb-2">
          Equipment Summary
        </h4>
        <div className="space-y-1 text-xs text-amber-700">
          <div className="flex justify-between">
            <span>Process:</span>
            <span className="font-medium">Coagulation</span>
          </div>
          <div className="flex justify-between">
            <span>Dose:</span>
            <span className="font-medium">{localParams.dose_mg_L} mg/L</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium">
              {COAGULANT_TYPES.find((t) => t.value === (localParams.coagulant_type || "alum"))?.label || "Alum"}
            </span>
          </div>
        </div>
        <p className="text-xs text-amber-600 mt-2">
          Destabilizes particles for removal in downstream processes.
        </p>
      </div>
    </div>
  );
}
