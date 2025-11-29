/**
 * Panel for displaying simulation results, KPIs, and TCO analysis.
 * Dark glass morphism bottom sheet design with collapsible state.
 */
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  X,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useStore, useSavedScenarios, usePlantConfiguration } from "../../store/useStore";
import { formatCurrency } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";
import type { TCOBreakdown, SimulationResult, PlantConfiguration } from "../../types";

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
          ? "bg-status-success/10 border-status-success/30"
          : "bg-surface-elevated border-glass-border"
      }`}
    >
      <h5 className={`text-xs font-medium mb-0.5 ${highlight ? "text-status-success" : "text-content-subtle"}`}>
        {label}
      </h5>
      <p className={`text-sm font-bold font-mono ${highlight ? "text-status-success" : "text-content-primary"}`}>
        {isMissing ? (
          <Tooltip content={`${label} not calculated: missing required inputs`}>
            <span className="text-content-subtle cursor-help">—</span>
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

// Scenario snapshot type (from store)
interface ScenarioSnapshot {
  name: string;
  timestamp: number;
  settings: PlantConfiguration["settings"];
  result: SimulationResult;
}

// Comparison table component for A vs B scenarios
function ComparisonTable({
  scenarioA,
  scenarioB,
  tcoKey,
  currency,
}: {
  scenarioA: ScenarioSnapshot;
  scenarioB: ScenarioSnapshot;
  tcoKey: "tco_per_1000m3" | "tco_per_day" | "tco_per_month" | "tco_per_year";
  currency: string;
}) {
  const pillars = ["chemicals", "filtration", "sludge", "logistics", "total"] as const;

  const getTcoValue = (result: SimulationResult, pillar: typeof pillars[number]): number => {
    const tco = result.kpis[tcoKey] as TCOBreakdown | undefined;
    return tco?.[pillar] ?? 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-surface-elevated z-10">
          <tr className="border-b border-glass-border">
            <th className="px-2 py-1.5 text-left font-medium text-content-subtle">Pillar</th>
            <th className="px-2 py-1.5 text-right font-medium text-status-success">A</th>
            <th className="px-2 py-1.5 text-right font-medium text-viz-polymer">B</th>
            <th className="px-2 py-1.5 text-right font-medium text-content-subtle">Delta</th>
            <th className="px-2 py-1.5 text-right font-medium text-content-subtle">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-glass-border">
          {pillars.map((pillar) => {
            const valA = getTcoValue(scenarioA.result, pillar);
            const valB = getTcoValue(scenarioB.result, pillar);
            const delta = valB - valA;
            const pctChange = valA !== 0 ? (delta / valA) * 100 : 0;
            const isTotal = pillar === "total";

            // Color coding: green for savings (B < A), red for increase (B > A)
            const deltaColor = delta < 0 ? "text-status-success" : delta > 0 ? "text-status-error" : "text-content-subtle";

            return (
              <tr key={pillar} className={isTotal ? "font-semibold bg-surface-highlight/50" : ""}>
                <td className="px-2 py-1.5 capitalize text-content-secondary">{pillar}</td>
                <td className="px-2 py-1.5 text-right font-mono text-content-primary">{formatCurrency(valA, currency)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-content-primary">{formatCurrency(valB, currency)}</td>
                <td className={`px-2 py-1.5 text-right font-mono ${deltaColor}`}>
                  {delta < 0 ? "−" : "+"}{formatCurrency(Math.abs(delta), currency)}
                </td>
                <td className={`px-2 py-1.5 text-right font-mono ${deltaColor}`}>
                  {valA === 0 ? "—" : `${delta < 0 ? "−" : "+"}${Math.abs(pctChange).toFixed(1)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPanel() {
  const simulationResult = useStore((state) => state.simulationResult);
  const isSimulating = useStore((state) => state.isSimulating);
  const plantConfiguration = usePlantConfiguration();
  const savedScenarios = useSavedScenarios();
  const saveScenarioToSlot = useStore((state) => state.saveScenarioToSlot);
  const clearScenarioSlot = useStore((state) => state.clearScenarioSlot);
  const [isExpanded, setIsExpanded] = useState(true);
  const [tcoPeriod, setTcoPeriod] = useState<TCOPeriod>("month");

  // A vs B comparison - both must be saved
  const scenarioA = savedScenarios.A;
  const scenarioB = savedScenarios.B;
  const hasBothScenarios = scenarioA !== null && scenarioB !== null;
  const hasAnyScenario = scenarioA !== null || scenarioB !== null;

  const currency = plantConfiguration.settings.currency || "BRL";
  const plantProfile = plantConfiguration.settings.plant_profile || "wastewater";

  // Loading skeleton
  if (isSimulating) {
    return (
      <div className="glass rounded-2xl shadow-float p-4 w-[420px] animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-surface-highlight rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-surface-highlight rounded-lg"></div>
            <div className="h-16 bg-surface-highlight rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // No results yet
  if (!simulationResult) {
    return (
      <div className="glass rounded-2xl shadow-float px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-highlight rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-content-subtle" />
          </div>
          <p className="text-sm text-content-secondary">
            Click <span className="text-content-accent font-medium">Simulate</span> to run the mass balance
          </p>
        </div>
      </div>
    );
  }

  const { streams, kpis, warnings, errors, success } = simulationResult;

  // Collapsed summary pill
  const CollapsedSummary = () => (
    <button
      onClick={() => setIsExpanded(true)}
      className="glass rounded-2xl shadow-float px-4 py-3 flex items-center gap-4 hover:bg-surface-highlight/50 transition-colors animate-fade-in"
    >
      <div className="flex items-center gap-3">
        {success ? (
          <CheckCircle className="w-5 h-5 text-status-success" />
        ) : (
          <AlertCircle className="w-5 h-5 text-status-error" />
        )}
        <span className="text-sm font-medium text-content-primary">
          {success ? "Mass Balance OK" : "Simulation Failed"}
        </span>
      </div>
      {success && plantProfile === "wastewater" && kpis.cake_dryness_percent !== undefined && (
        <>
          <div className="w-px h-5 bg-glass-border" />
          <span className="text-sm text-content-secondary font-mono">
            {kpis.cake_dryness_percent.toFixed(1)}% DS
          </span>
          <span className="text-sm text-content-secondary font-mono">
            {kpis.cake_tDS_per_day.toFixed(1)} tDS/day
          </span>
        </>
      )}
      {success && plantProfile === "drinking_water" && streams.feed && (
        <>
          <div className="w-px h-5 bg-glass-border" />
          <span className="text-sm text-content-secondary font-mono">
            {streams.feed.volumetric_flow_m3_h.toFixed(0)} m³/h
          </span>
        </>
      )}
      {warnings.length > 0 && (
        <>
          <div className="w-px h-5 bg-glass-border" />
          <span className="flex items-center gap-1 text-sm text-status-warning">
            <AlertTriangle className="w-4 h-4" />
            {warnings.length}
          </span>
        </>
      )}
      <ChevronUp className="w-4 h-4 text-content-subtle ml-auto" />
    </button>
  );

  if (!isExpanded) {
    return <CollapsedSummary />;
  }

  return (
    <div className="glass rounded-2xl shadow-float w-[600px] max-h-[70vh] flex flex-col overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <div className="flex items-center gap-3">
          {success ? (
            <CheckCircle className="w-5 h-5 text-status-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-status-error" />
          )}
          <h3 className="font-semibold text-content-primary">Simulation Results</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-1 text-sm text-content-subtle hover:text-content-secondary transition-colors"
        >
          Collapse <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
                <span className="text-sm text-status-warning">{warning}</span>
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
                className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                <span className="text-sm text-status-error">{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Mass Balance Table */}
        <div>
          <h4 className="text-xs font-semibold text-content-subtle uppercase tracking-wider mb-2">
            {plantProfile === "drinking_water" ? "Treatment Streams" : "Mass Balance"}
          </h4>
          <div className="overflow-x-auto bg-surface-elevated rounded-lg border border-glass-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="px-3 py-2 text-left font-medium text-content-subtle">
                    Stream
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-content-subtle">
                    Flow
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-content-subtle">
                    {plantProfile === "drinking_water" ? "Turbidity" : "DS"}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-content-subtle">
                    Solids
                  </th>
                  {plantProfile === "wastewater" && (
                    <th className="px-3 py-2 text-right font-medium text-content-subtle">
                      Polymer
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border font-mono text-xs">
                {/* Feed stream (always present) */}
                {streams.feed && (
                  <tr>
                    <td className="px-3 py-2 text-viz-feed font-medium font-sans">Feed</td>
                    <td className="px-3 py-2 text-right text-content-primary">
                      {streams.feed.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                    </td>
                    <td className="px-3 py-2 text-right text-content-primary">
                      {streams.feed.dry_solids_percent.toFixed(2)} <span className="text-content-subtle">%</span>
                    </td>
                    <td className="px-3 py-2 text-right text-content-primary">
                      {streams.feed.dry_solids_mass_flow_kg_h.toFixed(0)} <span className="text-content-subtle">kg/h</span>
                    </td>
                    {plantProfile === "wastewater" && (
                      <td className="px-3 py-2 text-right text-content-subtle">—</td>
                    )}
                  </tr>
                )}

                {/* Wastewater-specific streams */}
                {plantProfile === "wastewater" && (
                  <>
                    {streams.conditioned && (
                      <tr>
                        <td className="px-3 py-2 text-viz-polymer font-medium font-sans">
                          Conditioned
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.conditioned.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.conditioned.dry_solids_percent.toFixed(2)} <span className="text-content-subtle">%</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.conditioned.dry_solids_mass_flow_kg_h.toFixed(0)} <span className="text-content-subtle">kg/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.conditioned.polymer_dose_ppm.toFixed(1)} <span className="text-content-subtle">ppm</span>
                        </td>
                      </tr>
                    )}
                    {streams.cake && (
                      <tr>
                        <td className="px-3 py-2 text-viz-cake font-medium font-sans">Cake</td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.cake.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary font-semibold">
                          {streams.cake.dry_solids_percent.toFixed(2)} <span className="text-content-subtle">%</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.cake.dry_solids_mass_flow_kg_h.toFixed(0)} <span className="text-content-subtle">kg/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.cake.polymer_dose_ppm.toFixed(1)} <span className="text-content-subtle">ppm</span>
                        </td>
                      </tr>
                    )}
                    {streams.liquid && (
                      <tr>
                        <td className="px-3 py-2 text-viz-liquid font-medium font-sans">Liquid</td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.liquid.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.liquid.dry_solids_percent.toFixed(2)} <span className="text-content-subtle">%</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.liquid.dry_solids_mass_flow_kg_h.toFixed(0)} <span className="text-content-subtle">kg/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.liquid.polymer_dose_ppm.toFixed(1)} <span className="text-content-subtle">ppm</span>
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Drinking water-specific streams */}
                {plantProfile === "drinking_water" && (
                  <>
                    {streams.finished && (
                      <tr>
                        <td className="px-3 py-2 text-blue-500 font-medium font-sans">Finished Water</td>
                        <td className="px-3 py-2 text-right text-content-primary font-semibold">
                          {streams.finished.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.finished.dry_solids_percent ? (streams.finished.dry_solids_percent * 100).toFixed(1) : '—'} <span className="text-content-subtle">NTU</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.finished.dry_solids_mass_flow_kg_h ? streams.finished.dry_solids_mass_flow_kg_h.toFixed(1) : '—'} <span className="text-content-subtle">kg/h</span>
                        </td>
                      </tr>
                    )}
                    {streams.filtered && !streams.finished && (
                      <tr>
                        <td className="px-3 py-2 text-emerald-500 font-medium font-sans">Filtered Water</td>
                        <td className="px-3 py-2 text-right text-content-primary font-semibold">
                          {streams.filtered.volumetric_flow_m3_h.toFixed(1)} <span className="text-content-subtle">m³/h</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.filtered.dry_solids_percent ? (streams.filtered.dry_solids_percent * 100).toFixed(1) : '—'} <span className="text-content-subtle">NTU</span>
                        </td>
                        <td className="px-3 py-2 text-right text-content-primary">
                          {streams.filtered.dry_solids_mass_flow_kg_h ? streams.filtered.dry_solids_mass_flow_kg_h.toFixed(1) : '—'} <span className="text-content-subtle">kg/h</span>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KPI Cards */}
        {plantProfile === "wastewater" && kpis.polymer_dose_ppm !== undefined && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Polymer KPIs */}
            <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
              <h5 className="text-xs font-medium text-viz-polymer mb-1">
                Effective Dose
              </h5>
              <p className="text-lg font-bold font-mono text-content-primary">
                {kpis.polymer_dose_ppm.toFixed(1)}
                <span className="text-sm font-normal ml-1 text-content-subtle">ppm</span>
              </p>
            </div>
            <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
              <h5 className="text-xs font-medium text-viz-polymer mb-1">
                Consumption
              </h5>
              <p className="text-lg font-bold font-mono text-content-primary">
                {kpis.polymer_kg_per_tDS.toFixed(2)}
                <span className="text-sm font-normal ml-1 text-content-subtle">kg/tDS</span>
              </p>
            </div>

            {/* Dewatering KPIs */}
            <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
              <h5 className="text-xs font-medium text-viz-dewatering mb-1">
                Cake Dryness
              </h5>
              <p className="text-lg font-bold font-mono text-content-primary">
                {kpis.cake_dryness_percent.toFixed(1)}
                <span className="text-sm font-normal ml-1 text-content-subtle">% DS</span>
              </p>
            </div>
            <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
              <h5 className="text-xs font-medium text-viz-dewatering mb-1">
                Capture Rate
              </h5>
              <p className="text-lg font-bold font-mono text-content-primary">
                {kpis.solids_capture_actual_percent.toFixed(1)}
                <span className="text-sm font-normal ml-1 text-content-subtle">%</span>
              </p>
            </div>
          </div>
        )}

        {/* Drinking Water KPIs */}
        {plantProfile === "drinking_water" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
              <h5 className="text-xs font-medium text-blue-500 mb-1">
                Water Produced
              </h5>
              <p className="text-lg font-bold font-mono text-content-primary">
                {streams.feed ? (streams.feed.volumetric_flow_m3_h * (plantConfiguration.settings.operating_hours_per_day || 24)).toFixed(0) : '—'}
                <span className="text-sm font-normal ml-1 text-content-subtle">m³/day</span>
              </p>
            </div>
            {kpis.water_recovery_percent !== undefined && (
              <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
                <h5 className="text-xs font-medium text-emerald-500 mb-1">
                  Recovery Rate
                </h5>
                <p className="text-lg font-bold font-mono text-content-primary">
                  {kpis.water_recovery_percent.toFixed(1)}
                  <span className="text-sm font-normal ml-1 text-content-subtle">%</span>
                </p>
              </div>
            )}
            {kpis.solids_removed_percent !== undefined && (
              <div className="p-3 bg-surface-elevated rounded-lg border border-glass-border">
                <h5 className="text-xs font-medium text-amber-500 mb-1">
                  Solids Removed
                </h5>
                <p className="text-lg font-bold font-mono text-content-primary">
                  {kpis.solids_removed_percent.toFixed(1)}
                  <span className="text-sm font-normal ml-1 text-content-subtle">%</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mass Balance Closure */}
        {kpis.mass_balance_closure_percent !== undefined && (
          <div className="flex items-center justify-center gap-2 p-2 bg-surface-elevated rounded-lg border border-glass-border">
            <span className="text-sm text-content-secondary">Mass Balance Closure:</span>
            <span
              className={`text-sm font-medium font-mono ${
                Math.abs(kpis.mass_balance_closure_percent - 100) < 0.1
                  ? "text-status-success"
                  : "text-status-warning"
              }`}
            >
              {kpis.mass_balance_closure_percent.toFixed(2)}%
            </span>
          </div>
        )}

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
            <div className="pt-4 border-t border-glass-border space-y-4">
              {/* Header with currency badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-content-subtle uppercase tracking-wider">TCO Analysis</h4>
                  <span className="text-xs px-1.5 py-0.5 bg-surface-highlight rounded text-content-secondary font-medium">
                    {currency}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => saveScenarioToSlot("A", "Scenario A")}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      scenarioA
                        ? "bg-status-success/20 text-status-success hover:bg-status-success/30"
                        : "text-content-subtle hover:bg-surface-highlight"
                    }`}
                    title={scenarioA ? "Overwrite Scenario A" : "Save as Scenario A"}
                  >
                    {scenarioA ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                    {scenarioA ? "A Saved" : "Save A"}
                  </button>
                  <button
                    onClick={() => saveScenarioToSlot("B", "Scenario B")}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                      scenarioB
                        ? "bg-viz-polymer/20 text-viz-polymer hover:bg-viz-polymer/30"
                        : "text-content-subtle hover:bg-surface-highlight"
                    }`}
                    title={scenarioB ? "Overwrite Scenario B" : "Save as Scenario B"}
                  >
                    {scenarioB ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                    {scenarioB ? "B Saved" : "Save B"}
                  </button>
                </div>
              </div>

              {/* TCO Warnings Banner */}
              {tcoWarnings.length > 0 && (
                <div className="p-2 bg-status-warning/10 border border-status-warning/30 rounded-lg text-xs text-status-warning">
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
                <div className="text-sm text-content-subtle italic p-3 bg-surface-elevated rounded-lg border border-glass-border">
                  TCO not available: configure cost inputs in Settings
                </div>
              ) : (
                <>
                  {/* Unitary Cost (per 1000 m³) */}
                  <div className="bg-surface-elevated p-3 rounded-lg border border-glass-border">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-xs font-semibold text-content-secondary">Unitary TCO (per 1,000 m³)</h5>
                      <span className="text-xs text-content-subtle">For benchmarking</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      <TCOCard label="Total" value={kpis.tco_per_1000m3.total} currency={currency} highlight />
                      <TCOCard label="Chemicals" value={kpis.tco_per_1000m3.chemicals} currency={currency} isMissing={missingPillars.chemicals} />
                      <TCOCard label="Filtration" value={kpis.tco_per_1000m3.filtration} currency={currency} isMissing={missingPillars.filtration} />
                      <TCOCard label="Sludge" value={kpis.tco_per_1000m3.sludge} currency={currency} isMissing={missingPillars.sludge} />
                      <TCOCard label="Logistics" value={kpis.tco_per_1000m3.logistics} currency={currency} isMissing={missingPillars.logistics} />
                    </div>
                  </div>

                  {/* Total Plant Cost */}
                  <div className="bg-surface-elevated p-3 rounded-lg border border-glass-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-semibold text-content-secondary">Total Plant Cost</h5>
                        <span className="text-xs text-content-subtle">
                          ({streams.feed ? streams.feed.volumetric_flow_m3_h.toFixed(0) : '—'} m³/h × {plantConfiguration.settings.operating_hours_per_day || 24}h/day)
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {(["day", "month", "year"] as TCOPeriod[]).map((period) => (
                          <button
                            key={period}
                            onClick={() => setTcoPeriod(period)}
                            className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                              tcoPeriod === period
                                ? "bg-primary-500 text-white"
                                : "bg-surface-highlight text-content-secondary hover:bg-surface-highlight/80"
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

                  {/* A vs B Scenario Comparison */}
                  {hasBothScenarios && scenarioA && scenarioB && (
                    <div className="pt-3 border-t border-glass-border space-y-4">
                      {/* Header with Clear buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold text-content-secondary">Scenario Comparison</h5>
                          <span className="text-xs text-content-subtle">
                            A: {new Date(scenarioA.timestamp).toLocaleDateString()} vs B: {new Date(scenarioB.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => clearScenarioSlot("A")}
                            className="flex items-center gap-1 text-xs text-content-subtle hover:text-status-error transition-colors"
                            title="Clear Scenario A"
                          >
                            <X className="w-3 h-3" />
                            Clear A
                          </button>
                          <button
                            onClick={() => clearScenarioSlot("B")}
                            className="flex items-center gap-1 text-xs text-content-subtle hover:text-status-error transition-colors"
                            title="Clear Scenario B"
                          >
                            <X className="w-3 h-3" />
                            Clear B
                          </button>
                        </div>
                      </div>

                      {/* Per 1,000 m³ comparison */}
                      <div className="bg-surface-elevated p-3 rounded-lg border border-glass-border">
                        <h6 className="text-xs font-medium text-content-subtle mb-2">Per 1,000 m³ (unitized)</h6>
                        <ComparisonTable
                          scenarioA={scenarioA}
                          scenarioB={scenarioB}
                          tcoKey="tco_per_1000m3"
                          currency={currency}
                        />
                      </div>

                      {/* Total Plant Cost comparison */}
                      <div className="bg-surface-elevated p-3 rounded-lg border border-glass-border">
                        <div className="flex items-center justify-between mb-2">
                          <h6 className="text-xs font-medium text-content-subtle">Total Plant Cost</h6>
                          <div className="flex gap-1">
                            {(["day", "month", "year"] as TCOPeriod[]).map((period) => (
                              <button
                                key={period}
                                onClick={() => setTcoPeriod(period)}
                                className={`px-2 py-0.5 text-xs rounded-lg transition-colors ${
                                  tcoPeriod === period
                                    ? "bg-primary-500 text-white"
                                    : "bg-surface-highlight text-content-secondary hover:bg-surface-highlight/80"
                                }`}
                              >
                                {period === "day" ? "Day" : period === "month" ? "Month" : "Year"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <ComparisonTable
                          scenarioA={scenarioA}
                          scenarioB={scenarioB}
                          tcoKey={`tco_per_${tcoPeriod}` as "tco_per_day" | "tco_per_month" | "tco_per_year"}
                          currency={currency}
                        />
                      </div>
                    </div>
                  )}

                  {/* Prompt to save missing scenario */}
                  {!hasBothScenarios && hasAnyScenario && (
                    <div className="pt-3 border-t border-glass-border">
                      <div className="text-xs text-content-subtle italic p-3 bg-surface-elevated rounded-lg border border-glass-border text-center">
                        {!scenarioA && scenarioB && "Save Scenario A to compare against B"}
                        {scenarioA && !scenarioB && "Save Scenario B to compare against A"}
                      </div>
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
