/**
 * Main App component - SludgeSim application layout.
 * Supports both desktop and mobile layouts.
 */
import { useEffect, useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { Droplets, Save, FolderOpen, Settings, RotateCcw, Keyboard, HelpCircle } from "lucide-react";

import { FlowCanvas } from "./components/canvas/FlowCanvas";
import { PropertiesPanel } from "./components/panels/PropertiesPanel";
import { ResultsPanel } from "./components/panels/ResultsPanel";
import { SimulateButton } from "./components/SimulateButton";
import { ToastContainer } from "./components/ui/Toast";
import { KeyboardShortcutsModal } from "./components/ui/KeyboardShortcutsModal";
import { ValidationBanner } from "./components/ui/ValidationBanner";
import { SaveProjectModal } from "./components/modals/SaveProjectModal";
import { LoadProjectModal } from "./components/modals/LoadProjectModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { MobileLayout } from "./components/mobile/MobileLayout";
import { useStore } from "./store/useStore";
import { useJarTests } from "./hooks/useJarTests";
import { useToast } from "./hooks/useToast";
import { useValidation } from "./hooks/useValidation";
import { useIsMobile } from "./hooks/useIsMobile";

// Draft persistence key
const DRAFT_STORAGE_KEY = "sludgesim-draft";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
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
  const toast = useToast();
  const isMobile = useIsMobile();

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

  // Save draft to localStorage when configuration changes (and no project loaded)
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
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        setShowSaveModal(true);
      }

      // Ctrl/Cmd + O - Open/Load
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        setShowLoadModal(true);
      }

      // ? - Show keyboard shortcuts
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Escape - Close modal or deselect node
      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (showSaveModal) {
          setShowSaveModal(false);
        } else if (showLoadModal) {
          setShowLoadModal(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else {
          selectNode(null);
        }
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

  const handleSaved = () => {
    toast.success("Saved", "Project saved successfully");
  };

  const handleLoaded = () => {
    toast.success("Loaded", "Project loaded successfully");
  };

  // Render mobile layout for small screens
  if (isMobile) {
    return (
      <>
        <MobileLayout
          onOpenSave={handleOpenSave}
          onOpenLoad={handleOpenLoad}
          onOpenSettings={handleOpenSettings}
          onShowShortcuts={handleShowShortcuts}
          onReset={handleReset}
        />

        {/* Loading indicator for jar tests */}
        {jarTestsLoading && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white px-4 py-2 rounded-full text-sm text-slate-600 shadow-md">
            Loading jar tests...
          </div>
        )}

        {/* Toast notifications */}
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

        {/* Modals - shared between mobile and desktop */}
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={handleHideShortcuts} />
        <SaveProjectModal isOpen={showSaveModal} onClose={handleCloseSave} onSaved={handleSaved} />
        <LoadProjectModal isOpen={showLoadModal} onClose={handleCloseLoad} onLoaded={handleLoaded} />
        <SettingsModal isOpen={showSettings} onClose={handleCloseSettings} />
      </>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">SludgeSim</h1>
              <p className="text-xs text-slate-500">
                {currentProject ? currentProject.name : "New Simulation"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleOpenSave}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Save project (Ctrl+S)"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleOpenLoad}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Load project (Ctrl+O)"
          >
            <FolderOpen className="w-4 h-4" />
            Load
          </button>
          <button
            onClick={handleShowShortcuts}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenSettings}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Validation Banner */}
          <div className="px-4 pt-2">
            <ValidationBanner />
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <FlowCanvas />
            </ReactFlowProvider>

            {/* Simulate Button - floating */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <SimulateButton />
            </div>
          </div>

          {/* Results Panel */}
          <ResultsPanel />
        </div>

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>

      {/* Loading indicator for jar tests */}
      {jarTestsLoading && (
        <div className="fixed bottom-4 left-4 bg-white px-3 py-2 rounded-md shadow-md text-sm text-slate-600">
          Loading jar tests...
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="fixed bottom-4 left-4 flex items-center gap-1 text-xs text-slate-400">
        <Keyboard className="w-3 h-3" />
        <span>Ctrl+Enter to simulate</span>
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={handleHideShortcuts}
      />
      <SaveProjectModal
        isOpen={showSaveModal}
        onClose={handleCloseSave}
        onSaved={handleSaved}
      />
      <LoadProjectModal
        isOpen={showLoadModal}
        onClose={handleCloseLoad}
        onLoaded={handleLoaded}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />
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
