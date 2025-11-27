/**
 * Main App component - SludgeSim application layout.
 */
import { useEffect, useState, createContext, useContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactFlowProvider } from "@xyflow/react";
import { Droplets, Save, FolderOpen, Settings, RotateCcw, Keyboard, HelpCircle } from "lucide-react";

import { FlowCanvas } from "./components/canvas/FlowCanvas";
import { PropertiesPanel } from "./components/panels/PropertiesPanel";
import { ResultsPanel } from "./components/panels/ResultsPanel";
import { SimulateButton } from "./components/SimulateButton";
import { ToastContainer } from "./components/ui/Toast";
import { KeyboardShortcutsModal } from "./components/ui/KeyboardShortcutsModal";
import { useStore } from "./store/useStore";
import { useJarTests } from "./hooks/useJarTests";
import { useToast } from "./hooks/useToast";

// Toast context for global access
const ToastContext = createContext<ReturnType<typeof useToast> | null>(null);
export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToastContext must be used within ToastProvider");
  return context;
};

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
  const resetToDefault = useStore((state) => state.resetToDefault);
  const initializeDefaultPlant = useStore((state) => state.initializeDefaultPlant);
  const selectNode = useStore((state) => state.selectNode);
  const toast = useToast();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Fetch jar tests on mount
  const { isLoading: jarTestsLoading } = useJarTests();

  // Initialize default plant on mount
  useEffect(() => {
    initializeDefaultPlant();
  }, [initializeDefaultPlant]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
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
        } else {
          selectNode(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts, selectNode]);

  const handleReset = () => {
    resetToDefault();
    toast.info("Reset", "Plant configuration reset to defaults");
  };

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
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Save project"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Load project"
          >
            <FolderOpen className="w-4 h-4" />
            Load
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
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

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
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
