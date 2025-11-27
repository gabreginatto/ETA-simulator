/**
 * Panel for displaying simulation results and KPIs.
 */
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { formatCurrency } from "../../lib/utils";

export function ResultsPanel() {
  const simulationResult = useStore((state) => state.simulationResult);
  const isSimulating = useStore((state) => state.isSimulating);
  const [isExpanded, setIsExpanded] = useState(true);

  // Loading skeleton
  if (isSimulating) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No results yet
  if (!simulationResult) {
    return (
      <div className="bg-gray-50 border-t border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">
          Click "Simulate" to run the mass balance calculation
        </p>
      </div>
    );
  }

  const { streams, kpis, warnings, errors, success } = simulationResult;

  // Collapsed summary
  const CollapsedSummary = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        {success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-500" />
        )}
        <span className="text-sm font-medium text-gray-700">
          {success ? "Simulation Complete" : "Simulation Failed"}
        </span>
        {success && (
          <span className="text-sm text-gray-500">
            Cake: {kpis.cake_dryness_percent.toFixed(1)}% DS •{" "}
            {kpis.cake_tDS_per_day.toFixed(1)} tDS/day
          </span>
        )}
        {warnings.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            {warnings.length} warning{warnings.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        Show Details <ChevronUp className="w-4 h-4" />
      </button>
    </div>
  );

  if (!isExpanded) {
    return <CollapsedSummary />;
  }

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <h3 className="font-semibold text-gray-800">Simulation Results</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          Collapse <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md"
              >
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mass Balance Table */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Mass Balance Summary
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-600">
                    Stream
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Flow (m³/h)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    DS (%)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Solids (kg/h)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">
                    Polymer (ppm)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 text-cyan-700 font-medium">Feed</td>
                  <td className="px-3 py-2 text-right">
                    {streams.feed.volumetric_flow_m3_h.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.feed.dry_solids_percent.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.feed.dry_solids_mass_flow_kg_h.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-400">0</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-violet-700 font-medium">
                    Conditioned
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.conditioned.volumetric_flow_m3_h.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.conditioned.dry_solids_percent.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.conditioned.dry_solids_mass_flow_kg_h.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.conditioned.polymer_dose_ppm.toFixed(1)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-amber-700 font-medium">Cake</td>
                  <td className="px-3 py-2 text-right">
                    {streams.cake.volumetric_flow_m3_h.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {streams.cake.dry_solids_percent.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.cake.dry_solids_mass_flow_kg_h.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.cake.polymer_dose_ppm.toFixed(1)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-sky-700 font-medium">Liquid</td>
                  <td className="px-3 py-2 text-right">
                    {streams.liquid.volumetric_flow_m3_h.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.liquid.dry_solids_percent.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.liquid.dry_solids_mass_flow_kg_h.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {streams.liquid.polymer_dose_ppm.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Polymer KPIs */}
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
            <h5 className="text-xs font-medium text-violet-600 mb-1">
              Effective Dose
            </h5>
            <p className="text-xl font-bold text-violet-700">
              {kpis.polymer_dose_ppm.toFixed(1)}
              <span className="text-sm font-normal ml-1">ppm</span>
            </p>
          </div>
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
            <h5 className="text-xs font-medium text-violet-600 mb-1">
              Consumption
            </h5>
            <p className="text-xl font-bold text-violet-700">
              {kpis.polymer_kg_per_tDS.toFixed(2)}
              <span className="text-sm font-normal ml-1">kg/tDS</span>
            </p>
          </div>
          <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
            <h5 className="text-xs font-medium text-violet-600 mb-1">
              Monthly Usage
            </h5>
            <p className="text-xl font-bold text-violet-700">
              {(kpis.polymer_kg_per_month / 1000).toFixed(1)}
              <span className="text-sm font-normal ml-1">t/mo</span>
            </p>
          </div>
          {kpis.polymer_cost_per_month && (
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
              <h5 className="text-xs font-medium text-violet-600 mb-1">
                Monthly Cost
              </h5>
              <p className="text-xl font-bold text-violet-700">
                {formatCurrency(kpis.polymer_cost_per_month)}
              </p>
            </div>
          )}

          {/* Dewatering KPIs */}
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
            <h5 className="text-xs font-medium text-orange-600 mb-1">
              Cake Dryness
            </h5>
            <p className="text-xl font-bold text-orange-700">
              {kpis.cake_dryness_percent.toFixed(1)}
              <span className="text-sm font-normal ml-1">% DS</span>
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
            <h5 className="text-xs font-medium text-orange-600 mb-1">
              Cake Production
            </h5>
            <p className="text-xl font-bold text-orange-700">
              {kpis.cake_wet_tons_per_day.toFixed(1)}
              <span className="text-sm font-normal ml-1">t/day</span>
            </p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
            <h5 className="text-xs font-medium text-orange-600 mb-1">
              Capture Rate
            </h5>
            <p className="text-xl font-bold text-orange-700">
              {kpis.solids_capture_actual_percent.toFixed(1)}
              <span className="text-sm font-normal ml-1">%</span>
            </p>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg border border-sky-100">
            <h5 className="text-xs font-medium text-sky-600 mb-1">
              Liquid TSS
            </h5>
            <p className="text-xl font-bold text-sky-700">
              {kpis.liquid_tss_estimate_mg_L.toFixed(0)}
              <span className="text-sm font-normal ml-1">mg/L</span>
            </p>
          </div>
        </div>

        {/* Mass Balance Closure */}
        <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-md">
          <span className="text-sm text-gray-600">Mass Balance Closure:</span>
          <span
            className={`text-sm font-medium ${
              Math.abs(kpis.mass_balance_closure_percent - 100) < 0.1
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {kpis.mass_balance_closure_percent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
