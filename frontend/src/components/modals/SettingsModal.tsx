/**
 * Settings Modal - allows configuring polymer price, currency, operating hours,
 * and TCO (Total Cost of Ownership) parameters.
 * Dark glass morphism design.
 */
import { useState, useEffect } from "react";
import { X, Settings, Download, ChevronDown, ChevronRight, Info, Sun, Moon } from "lucide-react";
import { useStore, useTheme } from "../../store/useStore";
import { Tooltip } from "../ui/Tooltip";
import type { PlantSettings } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

// Collapsible section component
function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-glass-border rounded-xl overflow-hidden bg-surface-elevated">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-surface-highlight/50 hover:bg-surface-highlight transition-colors"
      >
        <span className="text-sm font-medium text-content-primary">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-content-subtle" />
        ) : (
          <ChevronRight className="w-4 h-4 text-content-subtle" />
        )}
      </button>
      {isOpen && <div className="p-3 space-y-3 border-t border-glass-border">{children}</div>}
    </div>
  );
}

// Number input with label, unit, and optional tooltip
function NumberInput({
  label,
  value,
  onChange,
  unit,
  prefix,
  placeholder,
  step = "0.01",
  min = "0",
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  prefix?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  tooltip?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-content-subtle uppercase tracking-wider mb-1">
        <span>{label}</span>
        {tooltip && (
          <Tooltip content={tooltip} position="top">
            <Info className="w-3.5 h-3.5 text-content-subtle cursor-help" />
          </Tooltip>
        )}
      </label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-content-subtle text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          min={min}
          className="flex-1 px-2 py-1.5 text-sm bg-surface-canvas border border-glass-border rounded-lg text-content-primary placeholder-content-subtle focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          placeholder={placeholder}
        />
        {unit && <span className="text-content-subtle text-sm">{unit}</span>}
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const setPlantConfiguration = useStore((state) => state.setPlantConfiguration);
  const simulationResult = useStore((state) => state.simulationResult);
  const currentProject = useStore((state) => state.currentProject);
  const theme = useTheme();
  const setTheme = useStore((state) => state.setTheme);

  // Basic settings
  const [polymerPrice, setPolymerPrice] = useState<string>("");
  const [electricityPrice, setElectricityPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("BRL");
  const [operatingHours, setOperatingHours] = useState<string>("24");

  // Coagulant settings
  const [coagulantPrice, setCoagulantPrice] = useState<string>("");
  const [coagulantDose, setCoagulantDose] = useState<string>("");

  // Filtration settings
  const [filterRuntime, setFilterRuntime] = useState<string>("");
  const [filterFlow, setFilterFlow] = useState<string>("");
  const [filtersInParallel, setFiltersInParallel] = useState<string>("");
  const [backwashVolume, setBackwashVolume] = useState<string>("");
  const [backwashTime, setBackwashTime] = useState<string>("");
  const [waterCost, setWaterCost] = useState<string>("");
  const [productPrice, setProductPrice] = useState<string>("");

  // Sludge settings
  const [disposalCost, setDisposalCost] = useState<string>("");

  // Logistics settings
  const [storageCost, setStorageCost] = useState<string>("");
  const [handlingCost, setHandlingCost] = useState<string>("");

  // Collapsible sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    chemicals: false,
    filtration: false,
    sludge: false,
    logistics: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const settings = plantConfiguration.settings;
      // Basic
      setPolymerPrice(settings.polymer_price_per_kg?.toString() || "5");
      setElectricityPrice(settings.electricity_price_per_kwh?.toString() || "");
      setCurrency(settings.currency || "BRL");
      setOperatingHours(settings.operating_hours_per_day?.toString() || "24");
      // Coagulant
      setCoagulantPrice(settings.coagulant_price_per_kg?.toString() || "");
      setCoagulantDose(settings.coagulant_dose_mg_L?.toString() || "");
      // Filtration
      setFilterRuntime(settings.filter_runtime_hours_to_clog?.toString() || "");
      setFilterFlow(settings.filter_flow_m3_h?.toString() || "");
      setFiltersInParallel(settings.filters_in_parallel?.toString() || "");
      setBackwashVolume(settings.backwash_volume_m3?.toString() || "");
      setBackwashTime(settings.backwash_time_hours?.toString() || "");
      setWaterCost(settings.water_cost_per_m3?.toString() || "2");
      setProductPrice(settings.product_price_per_m3?.toString() || "");
      // Sludge
      setDisposalCost(settings.disposal_cost_per_ton_wet?.toString() || "100");
      // Logistics
      setStorageCost(settings.storage_cost_per_kg?.toString() || "0.5");
      setHandlingCost(settings.handling_cost_per_kg?.toString() || "0.2");
    }
  }, [isOpen, plantConfiguration.settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    const newSettings: PlantSettings = {
      // Basic
      polymer_price_per_kg: polymerPrice ? parseFloat(polymerPrice) : undefined,
      electricity_price_per_kwh: electricityPrice ? parseFloat(electricityPrice) : undefined,
      currency,
      operating_hours_per_day: parseFloat(operatingHours) || 24,
      // Coagulant
      coagulant_price_per_kg: coagulantPrice ? parseFloat(coagulantPrice) : undefined,
      coagulant_dose_mg_L: coagulantDose ? parseFloat(coagulantDose) : undefined,
      // Filtration
      filter_runtime_hours_to_clog: filterRuntime ? parseFloat(filterRuntime) : undefined,
      filter_flow_m3_h: filterFlow ? parseFloat(filterFlow) : undefined,
      filters_in_parallel: filtersInParallel ? parseInt(filtersInParallel) : undefined,
      backwash_volume_m3: backwashVolume ? parseFloat(backwashVolume) : undefined,
      backwash_time_hours: backwashTime ? parseFloat(backwashTime) : undefined,
      water_cost_per_m3: waterCost ? parseFloat(waterCost) : undefined,
      product_price_per_m3: productPrice ? parseFloat(productPrice) : undefined,
      // Sludge
      disposal_cost_per_ton_wet: disposalCost ? parseFloat(disposalCost) : undefined,
      // Logistics
      storage_cost_per_kg: storageCost ? parseFloat(storageCost) : undefined,
      handling_cost_per_kg: handlingCost ? parseFloat(handlingCost) : undefined,
    };

    setPlantConfiguration({
      ...plantConfiguration,
      settings: newSettings,
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

      // TCO data
      if (kpis.tco_per_1000m3) {
        const tco = kpis.tco_per_1000m3;
        rows.push(`TCO_Unitary,total_per_1000m3,${tco.total.toFixed(2)},${currency}/1000m³`);
        rows.push(`TCO_Unitary,chemicals_per_1000m3,${tco.chemicals.toFixed(2)},${currency}/1000m³`);
        rows.push(`TCO_Unitary,filtration_per_1000m3,${tco.filtration.toFixed(2)},${currency}/1000m³`);
        rows.push(`TCO_Unitary,sludge_per_1000m3,${tco.sludge.toFixed(2)},${currency}/1000m³`);
        rows.push(`TCO_Unitary,logistics_per_1000m3,${tco.logistics.toFixed(2)},${currency}/1000m³`);
      }
      if (kpis.tco_per_month) {
        const tco = kpis.tco_per_month;
        rows.push(`TCO_Monthly,total,${tco.total.toFixed(2)},${currency}/month`);
        rows.push(`TCO_Monthly,chemicals,${tco.chemicals.toFixed(2)},${currency}/month`);
        rows.push(`TCO_Monthly,filtration,${tco.filtration.toFixed(2)},${currency}/month`);
        rows.push(`TCO_Monthly,sludge,${tco.sludge.toFixed(2)},${currency}/month`);
        rows.push(`TCO_Monthly,logistics,${tco.logistics.toFixed(2)},${currency}/month`);
      }
      if (kpis.tco_per_year) {
        rows.push(`TCO_Annual,total,${kpis.tco_per_year.total.toFixed(2)},${currency}/year`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl shadow-float w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-content-accent" />
            <h2 className="text-lg font-semibold text-content-primary">Settings & TCO Parameters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-content-subtle hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 border border-glass-border rounded-xl bg-surface-elevated">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-content-accent" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-medium text-content-primary">Theme</span>
            </div>
            <div className="flex items-center gap-1 p-0.5 bg-surface-canvas rounded-lg">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  theme === "light"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-content-subtle hover:text-content-secondary"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  theme === "dark"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-content-subtle hover:text-content-secondary"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dark
              </button>
            </div>
          </div>

          {/* Basic Settings */}
          <CollapsibleSection
            title="Basic Settings"
            isOpen={openSections.basic}
            onToggle={() => toggleSection("basic")}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-content-subtle uppercase tracking-wider mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-surface-canvas border border-glass-border rounded-lg text-content-primary focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <NumberInput
                label="Operating Hours"
                value={operatingHours}
                onChange={setOperatingHours}
                unit="h/day"
                step="1"
                min="1"
              />
              <NumberInput
                label="Electricity Price"
                value={electricityPrice}
                onChange={setElectricityPrice}
                prefix={currencySymbol}
                unit="/kWh"
                placeholder="0.12"
              />
            </div>
          </CollapsibleSection>

          {/* Chemicals (Polymer + Coagulant) */}
          <CollapsibleSection
            title="Chemicals"
            isOpen={openSections.chemicals}
            onToggle={() => toggleSection("chemicals")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Polymer Price"
                value={polymerPrice}
                onChange={setPolymerPrice}
                prefix={currencySymbol}
                unit="/kg"
                placeholder="5.00"
              />
              <NumberInput
                label="Coagulant Price"
                value={coagulantPrice}
                onChange={setCoagulantPrice}
                prefix={currencySymbol}
                unit="/kg"
                placeholder="2.00"
              />
              <NumberInput
                label="Coagulant Dose"
                value={coagulantDose}
                onChange={setCoagulantDose}
                unit="mg/L"
                placeholder="0"
              />
            </div>
          </CollapsibleSection>

          {/* Filtration */}
          <CollapsibleSection
            title="Filtration"
            isOpen={openSections.filtration}
            onToggle={() => toggleSection("filtration")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Runtime to Clog"
                value={filterRuntime}
                onChange={setFilterRuntime}
                unit="hours"
                placeholder="24"
                tooltip="Hours until filter clogs and requires backwash. Defines wash frequency."
              />
              <NumberInput
                label="Filter Flow"
                value={filterFlow}
                onChange={setFilterFlow}
                unit="m³/h"
                placeholder="50"
                tooltip="Flow rate per filter unit in m³/h."
              />
              <NumberInput
                label="Filters in Parallel"
                value={filtersInParallel}
                onChange={setFiltersInParallel}
                step="1"
                placeholder="4"
                tooltip="Number of filter units operating simultaneously. Total capacity = flow × parallel."
              />
              <NumberInput
                label="Backwash Volume"
                value={backwashVolume}
                onChange={setBackwashVolume}
                unit="m³"
                placeholder="10"
                tooltip="Volume of water used per backwash cycle. Used to estimate water loss per wash."
              />
              <NumberInput
                label="Backwash Time"
                value={backwashTime}
                onChange={setBackwashTime}
                unit="hours"
                placeholder="0.5"
                tooltip="Duration of each backwash cycle. Used to calculate downtime and opportunity cost."
              />
              <NumberInput
                label="Water Cost"
                value={waterCost}
                onChange={setWaterCost}
                prefix={currencySymbol}
                unit="/m³"
                placeholder="2.00"
                tooltip="Cost of water used during backwash."
              />
              <NumberInput
                label="Product Price"
                value={productPrice}
                onChange={setProductPrice}
                prefix={currencySymbol}
                unit="/m³"
                placeholder="5.00"
                tooltip="Revenue per m³ of treated water. Used to calculate opportunity cost during backwash."
              />
            </div>
          </CollapsibleSection>

          {/* Sludge Disposal */}
          <CollapsibleSection
            title="Sludge Disposal"
            isOpen={openSections.sludge}
            onToggle={() => toggleSection("sludge")}
          >
            <NumberInput
              label="Disposal Cost"
              value={disposalCost}
              onChange={setDisposalCost}
              prefix={currencySymbol}
              unit="/ton wet"
              placeholder="100"
              tooltip="Cost per metric ton of wet cake disposed. Applied to wet cake mass per 1,000 m³."
            />
          </CollapsibleSection>

          {/* Logistics */}
          <CollapsibleSection
            title="Logistics (Chemical Handling)"
            isOpen={openSections.logistics}
            onToggle={() => toggleSection("logistics")}
          >
            <div className="grid grid-cols-2 gap-3">
              <NumberInput
                label="Storage Cost"
                value={storageCost}
                onChange={setStorageCost}
                prefix={currencySymbol}
                unit="/kg"
                placeholder="0.50"
                tooltip="Storage cost per kg of chemicals (polymer + coagulant)."
              />
              <NumberInput
                label="Handling Cost"
                value={handlingCost}
                onChange={setHandlingCost}
                prefix={currencySymbol}
                unit="/kg"
                placeholder="0.20"
                tooltip="Handling/labor cost per kg of chemicals received."
              />
            </div>
          </CollapsibleSection>

          {/* Export Section */}
          <div className="pt-3 border-t border-glass-border">
            <h3 className="text-xs font-semibold text-content-subtle uppercase tracking-wider mb-3">Export Data</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportResults("json")}
                  disabled={!simulationResult}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-glass-border rounded-lg text-content-secondary hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Results (JSON)
                </button>
                <button
                  onClick={() => handleExportResults("csv")}
                  disabled={!simulationResult}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-glass-border rounded-lg text-content-secondary hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Results (CSV)
                </button>
              </div>
              <button
                onClick={handleExportProject}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-glass-border rounded-lg text-content-secondary hover:bg-surface-highlight transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Project (JSON)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-glass-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-highlight rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-primary-500 hover:bg-primary-400 rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
