/**
 * Panel for displaying simulation results, KPIs, and TCO analysis.
 */
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";
import { useStore, useSavedScenarios, useActiveComparisonSlot, usePlantConfiguration } from "../../store/useStore";
import { formatCurrency } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";

// TCO card component
function TCOCard({
  label,
  value,
  currency,
  highlight = false,
  isMissing = false,
}: {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
  isMissing?: boolean;
}) {
  return (
    <div
      className={`p-2 rounded-lg border ${
        highlight
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-gray-200"
      }`}
    >
      <h5 className={`text-xs font-medium mb-0.5 ${highlight ? "text-emerald-600" : "text-gray-500"}`}>
        {label}
      </h5>
      <p className={`text-sm font-bold ${highlight ? "text-emerald-700" : "text-gray-700"}`}>
        {isMissing ? (
          <Tooltip content={`${label} not calculated: missing required inputs`}>
            <span className="text-gray-400 cursor-help">—</span>
          </Tooltip>
        ) : (
          formatCurrency(value, currency)
        )}
      </p>
    </div>
  );
}

// Period selector for TCO
type TCOPeriod = "day" | "month" | "year";

export function ResultsPanel() {
  const simulationResult = useStore((state) => state.simulationResult);
  const isSimulating = useStore((state) => state.isSimulating);
  const plantConfiguration = usePlantConfiguration();
  const savedScenarios = useSavedScenarios();
  const activeComparisonSlot = useActiveComparisonSlot();
  const saveScenarioToSlot = useStore((state) => state.saveScenarioToSlot);
  const clearScenarioSlot = useStore((state) => state.clearScenarioSlot);
  const setActiveComparisonSlot = useStore((state) => state.setActiveComparisonSlot);
  const [isExpanded, setIsExpanded] = useState(true);
  const [tcoPeriod, setTcoPeriod] = useState<TCOPeriod>("month");

  // Active scenario for comparison
  const activeScenario = savedScenarios[activeComparisonSlot];
  const hasAnyScenario = savedScenarios.A !== null || savedScenarios.B !== null;

  const currency = plantConfiguration.settings.currency || "BRL";

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

        {/* TCO Analysis Section */}
        {(() => {
          // Filter TCO-related warnings
          const tcoWarnings = warnings.filter(w =>
            /TCO|chemicals|filtration|sludge|logistics|polymer.*price|disposal|backwash/i.test(w)
          );

          // Determine which pillars are missing based on warnings
          const missingPillars = {
            chemicals: tcoWarnings.some(w => /polymer.*price|chemicals/i.test(w)),
            filtration: tcoWarnings.some(w => /backwash|filtration|filter/i.test(w)),
            sludge: tcoWarnings.some(w => /disposal|sludge/i.test(w)),
            logistics: tcoWarnings.some(w => /storage|handling|logistics/i.test(w)),
          };

          return (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              {/* Header with currency badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-700">TCO Analysis</h4>
                  <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                    {currency}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => saveScenarioToSlot("A", "Scenario A")}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      savedScenarios.A ? "text-emerald-600 hover:bg-emerald-50" : "text-blue-600 hover:bg-blue-50"
                    }`}
                    title={savedScenarios.A ? "Overwrite Scenario A" : "Save as Scenario A"}
                  >
                    <Save className="w-3 h-3" />
                    {savedScenarios.A ? "A" : "Save A"}
                  </button>
                  <button
                    onClick={() => saveScenarioToSlot("B", "Scenario B")}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      savedScenarios.B ? "text-violet-600 hover:bg-violet-50" : "text-blue-600 hover:bg-blue-50"
                    }`}
                    title={savedScenarios.B ? "Overwrite Scenario B" : "Save as Scenario B"}
                  >
                    <Save className="w-3 h-3" />
                    {savedScenarios.B ? "B" : "Save B"}
                  </button>
                </div>
              </div>

              {/* TCO Warnings Banner */}
              {tcoWarnings.length > 0 && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                  <span className="font-medium">TCO incomplete:</span> {tcoWarnings[0]}
                  {tcoWarnings.length > 1 && (
                    <Tooltip content={tcoWarnings.slice(1).join('\n')} position="bottom">
                      <span className="ml-1 underline cursor-help">
                        +{tcoWarnings.length - 1} more
                      </span>
                    </Tooltip>
                  )}
                </div>
              )}

              {!kpis.tco_per_1000m3 ? (
                <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md">
                  TCO not available: configure cost inputs in Settings
                </div>
              ) : (
                <>
                  {/* Unitary Cost (per 1000 m³) - Gray background section */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-xs font-semibold text-gray-700">Unitary TCO (per 1,000 m³)</h5>
                      <span className="text-xs text-gray-500">For benchmarking</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      <TCOCard label="Total" value={kpis.tco_per_1000m3.total} currency={currency} highlight />
                      <TCOCard label="Chemicals" value={kpis.tco_per_1000m3.chemicals} currency={currency} isMissing={missingPillars.chemicals} />
                      <TCOCard label="Filtration" value={kpis.tco_per_1000m3.filtration} currency={currency} isMissing={missingPillars.filtration} />
                      <TCOCard label="Sludge" value={kpis.tco_per_1000m3.sludge} currency={currency} isMissing={missingPillars.sludge} />
                      <TCOCard label="Logistics" value={kpis.tco_per_1000m3.logistics} currency={currency} isMissing={missingPillars.logistics} />
                    </div>
                  </div>

                  {/* Total Plant Cost - White with border section */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-gray-700">Total Plant Cost</h5>
                        <span className="text-xs text-gray-500">
                          ({streams.feed.volumetric_flow_m3_h.toFixed(0)} m³/h × {plantConfiguration.settings.operating_hours_per_day || 24}h/day)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {(["day", "month", "year"] as TCOPeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTcoPeriod(period)}
                            className={`px-2 py-0.5 text-xs rounded ${
                              tcoPeriod === period
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {period === "day" ? "Day" : period === "month" ? "Month" : "Year"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const tco =
                        tcoPeriod === "day"
                          ? kpis.tco_per_day
                          : tcoPeriod === "month"
                          ? kpis.tco_per_month
                          : kpis.tco_per_year;
                      if (!tco) return null;
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          <TCOCard label="Total" value={tco.total} currency={currency} highlight />
                          <TCOCard label="Chemicals" value={tco.chemicals} currency={currency} isMissing={missingPillars.chemicals} />
                          <TCOCard label="Filtration" value={tco.filtration} currency={currency} isMissing={missingPillars.filtration} />
                          <TCOCard label="Sludge" value={tco.sludge} currency={currency} isMissing={missingPillars.sludge} />
                          <TCOCard label="Logistics" value={tco.logistics} currency={currency} isMissing={missingPillars.logistics} />
                        </div>
                      );
                    })()}
                  </div>

                  {/* Scenario Comparison */}
                  {hasAnyScenario && kpis.tco_per_1000m3 && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700">Scenario Comparison (per 1,000 m³)</h5>
                          {/* Slot selector tabs */}
                          <div className="flex items-center gap-1 mt-1">
                            {savedScenarios.A && (
                              <button
                                onClick={() => setActiveComparisonSlot("A")}
                                className={`px-2 py-0.5 text-xs rounded ${
                                  activeComparisonSlot === "A"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                }`}
                              >
                                A: {new Date(savedScenarios.A.timestamp).toLocaleDateString()}
                              </button>
                            )}
                            {savedScenarios.B && (
                              <button
                                onClick={() => setActiveComparisonSlot("B")}
                                className={`px-2 py-0.5 text-xs rounded ${
                                  activeComparisonSlot === "B"
                                    ? "bg-violet-600 text-white"
                                    : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                }`}
                              >
                                B: {new Date(savedScenarios.B.timestamp).toLocaleDateString()}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {activeScenario && (
                            <button
                              onClick={() => clearScenarioSlot(activeComparisonSlot)}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                              title={`Clear Scenario ${activeComparisonSlot}`}
                            >
                              <X className="w-3 h-3" />
                              Clear {activeComparisonSlot}
                            </button>
                          )}
                        </div>
                      </div>
                      {activeScenario ? (
                        <>
                          <div className="text-xs text-gray-500 mb-2">
                            Comparing against {activeScenario.name} • {activeScenario.settings.currency} • {activeScenario.settings.operating_hours_per_day || 24}h/day
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0 bg-white z-10">
                                <tr className="bg-gray-50">
                                  <th className="px-2 py-1 text-left font-medium text-gray-600">Pillar</th>
                                  <th className="px-2 py-1 text-right font-medium text-gray-600">{activeComparisonSlot}</th>
                                  <th className="px-2 py-1 text-right font-medium text-gray-600">Current</th>
                                  <th className="px-2 py-1 text-right font-medium text-gray-600">Delta</th>
                                  <th className="px-2 py-1 text-right font-medium text-gray-600">%</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {(["chemicals", "filtration", "sludge", "logistics", "total"] as const).map((pillar) => {
                                  const savedVal = activeScenario.result.kpis.tco_per_1000m3?.[pillar] || 0;
                                  const currentVal = kpis.tco_per_1000m3?.[pillar] || 0;
                                  const delta = currentVal - savedVal;
                                  const pctChange = savedVal !== 0 ? (delta / savedVal) * 100 : 0;
                                  const isTotal = pillar === "total";
                                  return (
                                    <tr key={pillar} className={isTotal ? "font-semibold bg-gray-50" : ""}>
                                      <td className="px-2 py-1 capitalize">{pillar}</td>
                                      <td className="px-2 py-1 text-right">{formatCurrency(savedVal, currency)}</td>
                                      <td className="px-2 py-1 text-right">{formatCurrency(currentVal, currency)}</td>
                                      <td className={`px-2 py-1 text-right ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-red-600" : ""}`}>
                                        {delta < 0 ? "−" : "+"}{formatCurrency(Math.abs(delta), currency)}
                                      </td>
                                      <td className={`px-2 py-1 text-right ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-red-600" : ""}`}>
                                        {delta < 0 ? "−" : "+"}{Math.abs(pctChange).toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Select a scenario tab above to compare
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
