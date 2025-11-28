/**
 * Settings Modal - allows configuring polymer price, currency, and operating hours.
 */
import { useState, useEffect } from "react";
import { X, Settings, Download } from "lucide-react";
import { useStore } from "../../store/useStore";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const setPlantConfiguration = useStore((state) => state.setPlantConfiguration);
  const simulationResult = useStore((state) => state.simulationResult);
  const currentProject = useStore((state) => state.currentProject);

  const [polymerPrice, setPolymerPrice] = useState<string>("");
  const [electricityPrice, setElectricityPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [operatingHours, setOperatingHours] = useState<string>("24");

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const settings = plantConfiguration.settings;
      setPolymerPrice(settings.polymer_price_per_kg?.toString() || "5");
      setElectricityPrice(settings.electricity_price_per_kwh?.toString() || "");
      setCurrency(settings.currency || "USD");
      setOperatingHours(settings.operating_hours_per_day?.toString() || "24");
    }
  }, [isOpen, plantConfiguration.settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    setPlantConfiguration({
      ...plantConfiguration,
      settings: {
        polymer_price_per_kg: parseFloat(polymerPrice) || undefined,
        electricity_price_per_kwh: electricityPrice ? parseFloat(electricityPrice) : undefined,
        currency,
        operating_hours_per_day: parseFloat(operatingHours) || 24,
      },
    });
    onClose();
  };

  const handleExportResults = (format: "json" | "csv") => {
    if (!simulationResult) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(simulationResult, null, 2);
      filename = "simulation-results.json";
      mimeType = "application/json";
    } else {
      // CSV format - flatten the results
      const rows: string[] = [];
      rows.push("Section,Metric,Value,Unit");

      // Streams
      Object.entries(simulationResult.streams).forEach(([streamName, stream]) => {
        rows.push(`Stream,${streamName}_flow_m3_h,${stream.volumetric_flow_m3_h.toFixed(2)},m³/h`);
        rows.push(`Stream,${streamName}_ds_percent,${stream.dry_solids_percent.toFixed(2)},%`);
        rows.push(`Stream,${streamName}_solids_kg_h,${stream.dry_solids_mass_flow_kg_h.toFixed(2)},kg/h`);
        rows.push(`Stream,${streamName}_polymer_ppm,${stream.polymer_dose_ppm.toFixed(2)},ppm`);
      });

      // KPIs
      const kpis = simulationResult.kpis;
      rows.push(`KPI,polymer_dose_ppm,${kpis.polymer_dose_ppm.toFixed(2)},ppm`);
      rows.push(`KPI,polymer_kg_per_tDS,${kpis.polymer_kg_per_tDS.toFixed(3)},kg/tDS`);
      rows.push(`KPI,polymer_kg_per_day,${kpis.polymer_kg_per_day.toFixed(2)},kg/day`);
      rows.push(`KPI,cake_dryness_percent,${kpis.cake_dryness_percent.toFixed(2)},%`);
      rows.push(`KPI,cake_wet_tons_per_day,${kpis.cake_wet_tons_per_day.toFixed(2)},t/day`);
      rows.push(`KPI,liquid_flow_m3_h,${kpis.liquid_flow_m3_h.toFixed(2)},m³/h`);
      rows.push(`KPI,liquid_tss_estimate_mg_L,${kpis.liquid_tss_estimate_mg_L.toFixed(0)},mg/L`);
      rows.push(`KPI,mass_balance_closure_percent,${kpis.mass_balance_closure_percent.toFixed(2)},%`);
      if (kpis.polymer_cost_per_month) {
        rows.push(`KPI,polymer_cost_per_month,${kpis.polymer_cost_per_month.toFixed(2)},${currency}`);
      }

      content = rows.join("\n");
      filename = "simulation-results.csv";
      mimeType = "text/csv";
    }

    downloadFile(content, filename, mimeType);
  };

  const handleExportProject = () => {
    const projectData = {
      name: currentProject?.name || "Untitled Project",
      description: currentProject?.description,
      plant_configuration: plantConfiguration,
      exported_at: new Date().toISOString(),
    };

    downloadFile(
      JSON.stringify(projectData, null, 2),
      `${projectData.name.replace(/[^a-z0-9]/gi, "_")}.json`,
      "application/json"
    );
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "$";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Polymer Price
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{currencySymbol}</span>
              <input
                type="number"
                value={polymerPrice}
                onChange={(e) => setPolymerPrice(e.target.value)}
                step="0.1"
                min="0"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5.00"
              />
              <span className="text-slate-500">per kg</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Electricity Price
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{currencySymbol}</span>
              <input
                type="number"
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(e.target.value)}
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.12"
              />
              <span className="text-slate-500">per kWh</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Operating Hours per Day
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                step="1"
                min="1"
                max="24"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-slate-500">hours/day</span>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Export Data</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => handleExportResults("json")}
                disabled={!simulationResult}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Results (JSON)
              </button>
              <button
                onClick={() => handleExportResults("csv")}
                disabled={!simulationResult}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Results (CSV)
              </button>
            </div>
            <button
              onClick={handleExportProject}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Project (JSON)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
