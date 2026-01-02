/**
 * Main mobile layout container.
 * Provides tab-based navigation and coordinates mobile views.
 */
import { useState, useCallback } from "react";
import { Droplets } from "lucide-react";
import { MobileBottomNav, type MobileTab } from "./MobileBottomNav";
import { ProcessFlowList } from "./ProcessFlowList";
import { MobileResultsView } from "./MobileResultsView";
import { MobileAddEquipment } from "./MobileAddEquipment";
import { MobileSettingsView } from "./MobileSettingsView";
import { MobileEquipmentEditor } from "./MobileEquipmentEditor";
import { SimulateButton } from "../SimulateButton";
import { useStore } from "../../store/useStore";

interface MobileLayoutProps {
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenSettings: () => void;
  onShowShortcuts: () => void;
  onReset: () => void;
}

export function MobileLayout({
  onOpenSave,
  onOpenLoad,
  onOpenSettings,
  onShowShortcuts,
  onReset,
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>("flow");
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const simulationResult = useStore((state) => state.simulationResult);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const selectNode = useStore((state) => state.selectNode);
  const currentProject = useStore((state) => state.currentProject);

  // Handle equipment selection - open editor
  const handleSelectEquipment = useCallback((nodeId: string) => {
    selectNode(nodeId);
    setIsEditorOpen(true);
  }, [selectNode]);

  // Handle editor close
  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  // Handle equipment added - switch to flow view
  const handleEquipmentAdded = useCallback(() => {
    setActiveTab("flow");
  }, []);

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "flow":
        return <ProcessFlowList onSelectEquipment={handleSelectEquipment} />;
      case "results":
        return <MobileResultsView />;
      case "add":
        return <MobileAddEquipment onEquipmentAdded={handleEquipmentAdded} />;
      case "settings":
        return (
          <MobileSettingsView
            onOpenSave={onOpenSave}
            onOpenLoad={onOpenLoad}
            onOpenSettings={onOpenSettings}
            onShowShortcuts={onShowShortcuts}
            onReset={onReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-canvas text-content-primary overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-glass-border bg-surface-canvas/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-primary-500 rounded-xl flex items-center justify-center shadow-glow-cyan">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-content-primary leading-tight">
              SludgeSim
            </h1>
            <p className="text-2xs text-content-subtle">
              {currentProject ? currentProject.name : "New Simulation"}
            </p>
          </div>
        </div>

        {/* Simulate button in header for quick access */}
        {activeTab === "flow" && (
          <SimulateButton compact />
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasResults={!!simulationResult?.success}
      />

      {/* Equipment Editor Bottom Sheet */}
      <MobileEquipmentEditor
        isOpen={isEditorOpen && !!selectedNodeId}
        onClose={handleCloseEditor}
      />
    </div>
  );
}
