/**
 * Main App component - SludgeSim application with layered floating UI.
 *
 * Layout Structure:
 * - Layer 0: Canvas (full screen, interactive)
 * - Layer 1: UI Overlay (pointer-events-none container)
 *   - Top: Floating header pill
 *   - Right: Properties panel
 *   - Bottom-left: Results panel (bottom sheet)
 *   - Bottom-center: Equipment dock + Simulate button
 */
import { useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { Droplets, Save, FolderOpen, Settings, RotateCcw, HelpCircle } from "lucide-react";

import { FlowCanvas } from "./components/canvas/FlowCanvas";
import { EquipmentDock } from "./components/canvas/EquipmentDock";
import { PropertiesPanel } from "./components/panels/PropertiesPanel";
import { ResultsPanel } from "./components/panels/ResultsPanel";
import { SimulateButton } from "./components/SimulateButton";
import { ToastContainer } from "./components/ui/Toast";
import { KeyboardShortcutsModal } from "./components/ui/KeyboardShortcutsModal";
import { ValidationBanner } from "./components/ui/ValidationBanner";
import { SaveProjectModal } from "./components/modals/SaveProjectModal";
import { LoadProjectModal } from "./components/modals/LoadProjectModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { useStore, useTheme } from "./store/useStore";
import { useJarTests } from "./hooks/useJarTests";
import { useToast } from "./hooks/useToast";
import { useValidation } from "./hooks/useValidation";

// Draft persistence key
const DRAFT_STORAGE_KEY = "sludgesim-draft";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const currentProject = useStore((state) => state.currentProject);
  const plantConfiguration = useStore((state) => state.plantConfiguration);
  const setPlantConfiguration = useStore((state) => state.setPlantConfiguration);
  const resetToDefault = useStore((state) => state.resetToDefault);
  const initializeDefaultPlant = useStore((state) => state.initializeDefaultPlant);
  const selectNode = useStore((state) => state.selectNode);
  const theme = useTheme();
  const toast = useToast();

  // Apply theme class to document on mount and when theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch jar tests on mount
  const { isLoading: jarTestsLoading } = useJarTests();

  // Run validation on config changes
  useValidation();

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft && !currentProject) {
      try {
        const parsed = JSON.parse(draft);
        setPlantConfiguration(parsed);
        console.log("Loaded draft configuration from localStorage");
      } catch (e) {
        console.warn("Failed to parse draft:", e);
      }
    } else {
      initializeDefaultPlant();
    }
  }, []);

  // Save draft to localStorage when configuration changes
  useEffect(() => {
    if (!currentProject) {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(plantConfiguration));
    }
  }, [plantConfiguration, currentProject]);

  // Clear draft when a project is loaded
  useEffect(() => {
    if (currentProject) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [currentProject]);

  // Memoized handlers
  const handleOpenSave = useCallback(() => setShowSaveModal(true), []);
  const handleOpenLoad = useCallback(() => setShowLoadModal(true), []);
  const handleCloseSave = useCallback(() => setShowSaveModal(false), []);
  const handleCloseLoad = useCallback(() => setShowLoadModal(false), []);
  const handleShowShortcuts = useCallback(() => setShowShortcuts(true), []);
  const handleHideShortcuts = useCallback(() => setShowShortcuts(false), []);
  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setShowSaveModal(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        setShowLoadModal(true);
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      if (e.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else if (showSaveModal) setShowSaveModal(false);
        else if (showLoadModal) setShowLoadModal(false);
        else if (showSettings) setShowSettings(false);
        else selectNode(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, showSaveModal, showLoadModal, showSettings, selectNode]);

  const handleReset = () => {
    resetToDefault();
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    toast.info("Reset", "Plant configuration reset to defaults");
  };

  const handleSaved = () => toast.success("Saved", "Project saved successfully");
  const handleLoaded = () => toast.success("Loaded", "Project loaded successfully");

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface-canvas font-sans text-content-primary">
      {/* LAYER 0: Interactive Canvas */}
      <div className="absolute inset-0 z-0">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </div>

      {/* LAYER 1: UI Overlay (Pass-through clicks) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col p-4 md:p-6">

        {/* Top Region: Header */}
        <div className="flex justify-center">
          <header className="pointer-events-auto glass rounded-2xl px-4 py-2.5 flex items-center gap-4 shadow-float animate-slide-down">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-primary-500 rounded-xl flex items-center justify-center shadow-glow-cyan">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-content-primary leading-tight">SludgeSim</h1>
                <p className="text-2xs text-content-subtle">
                  {currentProject ? currentProject.name : "New Simulation"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-glass-border" />

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-all"
                title="Reset to defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenSave}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-all"
                title="Save project (⌘S)"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenLoad}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-all"
                title="Load project (⌘O)"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={handleShowShortcuts}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-all"
                title="Keyboard shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenSettings}
                className="p-2 text-content-secondary hover:text-content-primary hover:bg-surface-highlight rounded-lg transition-all"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>
        </div>

        {/* Middle Region: Side Panels */}
        <div className="flex-1 flex relative mt-4">
          {/* Validation Banner - top left */}
          <div className="absolute top-0 left-0 pointer-events-auto max-w-md">
            <ValidationBanner />
          </div>

          {/* Results Panel - Bottom Left */}
          <div className="absolute bottom-0 left-0 pointer-events-auto">
            <ResultsPanel />
          </div>

          {/* Properties Panel - Right Side */}
          <div className="absolute right-0 top-0 bottom-16 pointer-events-auto">
            <PropertiesPanel />
          </div>
        </div>

        {/* Bottom Region: Dock + Simulate */}
        <div className="flex justify-center items-end gap-4 pb-2">
          <div className="pointer-events-auto">
            <EquipmentDock />
          </div>
          <div className="pointer-events-auto">
            <SimulateButton />
          </div>
        </div>
      </div>

      {/* Loading indicator for jar tests */}
      {jarTestsLoading && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass px-4 py-2 rounded-full text-sm text-content-secondary animate-fade-in">
          Loading jar tests...
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Modals */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={handleHideShortcuts} />
      <SaveProjectModal isOpen={showSaveModal} onClose={handleCloseSave} onSaved={handleSaved} />
      <LoadProjectModal isOpen={showLoadModal} onClose={handleCloseLoad} onLoaded={handleLoaded} />
      <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
