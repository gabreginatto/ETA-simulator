/**
 * Mobile-optimized results view.
 * Displays simulation results, KPIs, and TCO in a touch-friendly layout.
 */
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Play,
  TrendingUp,
  Droplets,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useStore, usePlantConfiguration } from "../../store/useStore";
import { useSimulation } from "../../hooks/useSimulation";
import { formatCurrency } from "../../lib/utils";
import type { TCOBreakdown } from "../../types";

// KPI Card component
function KPICard({
  label,
  value,
  unit,
  color = "text-content-primary",
  icon,
}: {
  label: string;
  value: string | number;
  unit: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-elevated rounded-xl p-3 border border-glass-border">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={color}>{icon}</span>}
        <span className="text-xs text-content-subtle">{label}</span>
      </div>
      <p className={`text-xl font-bold font-mono ${color}`}>
        {value}
        <span className="text-sm font-normal ml-1 text-content-subtle">{unit}</span>
      </p>
    </div>
  );
}

// TCO Summary card
function TCOSummaryCard({
  tco,
  currency,
  period,
}: {
  tco: TCOBreakdown;
  currency: string;
  period: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-surface-elevated rounded-xl border border-glass-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-content-subtle">Total Cost ({period})</p>
            <p className="text-2xl font-bold font-mono text-status-success">
              {formatCurrency(tco.total, currency)}
            </p>
          </div>
          <TrendingUp className="w-6 h-6 text-status-success" />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-glass-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Chemicals</span>
            <span className="font-mono">{formatCurrency(tco.chemicals, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Filtration</span>
            <span className="font-mono">{formatCurrency(tco.filtration, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Sludge</span>
            <span className="font-mono">{formatCurrency(tco.sludge, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-content-secondary">Logistics</span>
            <span className="font-mono">{formatCurrency(tco.logistics, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileResultsView() {
  const simulationResult = useStore((state) => state.simulationResult);
  const isSimulating = useStore((state) => state.isSimulating);
  const { runSimulation } = useSimulation();
  const plantConfiguration = usePlantConfiguration();

  const currency = plantConfiguration.settings.currency || "BRL";
  const plantProfile = plantConfiguration.settings.plant_profile || "wastewater";

  // Loading state
  if (isSimulating) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
          <Zap className="w-8 h-8 text-primary-500" />
        </div>
        <h3 className="text-lg font-medium text-content-primary mb-2">
          Running Simulation...
        </h3>
        <p className="text-sm text-content-secondary">
          Calculating mass balance and KPIs
        </p>
      </div>
    );
  }

  // No results yet
  if (!simulationResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="w-16 h-16 bg-surface-highlight rounded-2xl flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-content-subtle" />
        </div>
        <h3 className="text-lg font-medium text-content-primary mb-2">
          No Results Yet
        </h3>
        <p className="text-sm text-content-secondary text-center mb-6 max-w-xs">
          Configure your equipment and run a simulation to see results
        </p>
        <button
          onClick={runSimulation}
          className="px-6 py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all"
        >
          Run Simulation
        </button>
      </div>
    );
  }

  const { streams, kpis, warnings, errors, success } = simulationResult;

  return (
    <div className="p-4 pb-24 space-y-4">
      {/* Status Header */}
      <div className={`
        flex items-center gap-3 p-4 rounded-2xl
        ${success ? "bg-status-success/10" : "bg-status-error/10"}
      `}>
        {success ? (
          <CheckCircle className="w-6 h-6 text-status-success" />
        ) : (
          <AlertCircle className="w-6 h-6 text-status-error" />
        )}
        <div>
          <h2 className={`font-semibold ${success ? "text-status-success" : "text-status-error"}`}>
            {success ? "Simulation Complete" : "Simulation Failed"}
          </h2>
          <p className="text-sm text-content-secondary">
            {success
              ? "Mass balance calculated successfully"
              : "Check configuration and try again"
            }
          </p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.slice(0, 3).map((warning, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 bg-status-warning/10 border border-status-warning/30 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
              <span className="text-sm text-status-warning">{warning}</span>
            </div>
          ))}
          {warnings.length > 3 && (
            <p className="text-xs text-content-subtle text-center">
              +{warnings.length - 3} more warnings
            </p>
          )}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/30 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
              <span className="text-sm text-status-error">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs Section */}
      {success && (
        <>
          {/* Wastewater KPIs */}
          {plantProfile === "wastewater" && kpis.polymer_dose_ppm !== undefined && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-content-subtle uppercase tracking-wider">
                Key Performance Indicators
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  label="Cake Dryness"
                  value={kpis.cake_dryness_percent?.toFixed(1) || "—"}
                  unit="% DS"
                  color="text-orange-500"
                />
                <KPICard
                  label="Capture Rate"
                  value={kpis.solids_capture_actual_percent?.toFixed(1) || "—"}
                  unit="%"
                  color="text-green-500"
                />
                <KPICard
                  label="Polymer Dose"
                  value={kpis.polymer_dose_ppm?.toFixed(1) || "—"}
                  unit="ppm"
                  color="text-purple-500"
                />
                <KPICard
                  label="Production"
                  value={kpis.cake_tDS_per_day?.toFixed(1) || "—"}
                  unit="tDS/day"
                  color="text-blue-500"
                />
              </div>
            </div>
          )}

          {/* Drinking Water KPIs */}
          {plantProfile === "drinking_water" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-content-subtle uppercase tracking-wider">
                Key Performance Indicators
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KPICard
                  label="Water Produced"
                  value={streams.feed
                    ? (streams.feed.volumetric_flow_m3_h * (plantConfiguration.settings.operating_hours_per_day || 24)).toFixed(0)
                    : "—"
                  }
                  unit="m³/day"
                  color="text-blue-500"
                  icon={<Droplets className="w-4 h-4" />}
                />
                <KPICard
                  label="Mass Balance"
                  value={kpis.mass_balance_closure_percent?.toFixed(1) || "—"}
                  unit="%"
                  color="text-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Mass Balance */}
          {plantProfile === "wastewater" && kpis.mass_balance_closure_percent !== undefined && (
            <div className="bg-surface-elevated rounded-xl p-3 border border-glass-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-content-secondary">Mass Balance Closure</span>
                <span className={`font-mono font-medium ${
                  Math.abs(kpis.mass_balance_closure_percent - 100) < 0.1
                    ? "text-status-success"
                    : "text-status-warning"
                }`}>
                  {kpis.mass_balance_closure_percent.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* TCO Section */}
          {kpis.tco_per_month && (
            <div className="space-y-3 pt-4 border-t border-glass-border">
              <h3 className="text-sm font-semibold text-content-subtle uppercase tracking-wider">
                Cost Analysis
              </h3>
              <TCOSummaryCard
                tco={kpis.tco_per_month}
                currency={currency}
                period="month"
              />
              {kpis.tco_per_1000m3 && (
                <div className="bg-surface-elevated rounded-xl p-3 border border-glass-border">
                  <p className="text-xs text-content-subtle mb-1">Unitary Cost</p>
                  <p className="font-mono font-semibold text-content-primary">
                    {formatCurrency(kpis.tco_per_1000m3.total, currency)}
                    <span className="text-sm font-normal text-content-subtle ml-1">/ 1000 m³</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stream Data Summary */}
          <div className="space-y-3 pt-4 border-t border-glass-border">
            <h3 className="text-sm font-semibold text-content-subtle uppercase tracking-wider">
              Stream Summary
            </h3>
            <div className="bg-surface-elevated rounded-xl border border-glass-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-3 py-2 text-left font-medium text-content-subtle">Stream</th>
                    <th className="px-3 py-2 text-right font-medium text-content-subtle">Flow</th>
                    <th className="px-3 py-2 text-right font-medium text-content-subtle">DS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border font-mono text-xs">
                  {streams.feed && (
                    <tr>
                      <td className="px-3 py-2 text-cyan-500 font-sans font-medium">Feed</td>
                      <td className="px-3 py-2 text-right">{streams.feed.volumetric_flow_m3_h.toFixed(1)} m³/h</td>
                      <td className="px-3 py-2 text-right">{streams.feed.dry_solids_percent.toFixed(2)}%</td>
                    </tr>
                  )}
                  {streams.conditioned && plantProfile === "wastewater" && (
                    <tr>
                      <td className="px-3 py-2 text-purple-500 font-sans font-medium">Conditioned</td>
                      <td className="px-3 py-2 text-right">{streams.conditioned.volumetric_flow_m3_h.toFixed(1)} m³/h</td>
                      <td className="px-3 py-2 text-right">{streams.conditioned.dry_solids_percent.toFixed(2)}%</td>
                    </tr>
                  )}
                  {streams.cake && plantProfile === "wastewater" && (
                    <tr>
                      <td className="px-3 py-2 text-orange-500 font-sans font-medium">Cake</td>
                      <td className="px-3 py-2 text-right">{streams.cake.volumetric_flow_m3_h.toFixed(1)} m³/h</td>
                      <td className="px-3 py-2 text-right font-semibold">{streams.cake.dry_solids_percent.toFixed(2)}%</td>
                    </tr>
                  )}
                  {streams.liquid && plantProfile === "wastewater" && (
                    <tr>
                      <td className="px-3 py-2 text-blue-500 font-sans font-medium">Liquid</td>
                      <td className="px-3 py-2 text-right">{streams.liquid.volumetric_flow_m3_h.toFixed(1)} m³/h</td>
                      <td className="px-3 py-2 text-right">{streams.liquid.dry_solids_percent.toFixed(2)}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Run Again Button */}
      <div className="pt-4">
        <button
          onClick={runSimulation}
          className="w-full py-3 bg-primary-500 text-white font-medium rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Run Simulation Again
        </button>
      </div>
    </div>
  );
}
