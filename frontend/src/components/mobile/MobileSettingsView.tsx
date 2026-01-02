/**
 * Mobile settings view.
 * Provides access to project management, settings, and app options.
 */
import {
  Save,
  FolderOpen,
  Settings,
  RotateCcw,
  HelpCircle,
  Sun,
  Moon,
  Droplets,
  ChevronRight,
} from "lucide-react";
import { useStore, useTheme } from "../../store/useStore";

interface MobileSettingsViewProps {
  onOpenSave: () => void;
  onOpenLoad: () => void;
  onOpenSettings: () => void;
  onShowShortcuts: () => void;
  onReset: () => void;
}

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
}

function SettingsItem({
  icon,
  label,
  description,
  onClick,
  trailing,
  destructive,
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 p-4
        hover:bg-surface-highlight active:bg-surface-highlight
        transition-colors text-left
        ${destructive ? "text-status-error" : ""}
      `}
    >
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center
        ${destructive ? "bg-status-error/10" : "bg-surface-highlight"}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${destructive ? "text-status-error" : "text-content-primary"}`}>
          {label}
        </p>
        {description && (
          <p className="text-sm text-content-secondary">{description}</p>
        )}
      </div>
      {trailing || <ChevronRight className="w-5 h-5 text-content-subtle" />}
    </button>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-content-subtle uppercase tracking-wider px-4 mb-2">
        {title}
      </h3>
      <div className="bg-surface-elevated rounded-2xl border border-glass-border overflow-hidden divide-y divide-glass-border">
        {children}
      </div>
    </div>
  );
}

export function MobileSettingsView({
  onOpenSave,
  onOpenLoad,
  onOpenSettings,
  onShowShortcuts,
  onReset,
}: MobileSettingsViewProps) {
  const currentProject = useStore((state) => state.currentProject);
  const theme = useTheme();
  const setTheme = useStore((state) => state.setTheme);
  const plantProfile = useStore(
    (state) => state.plantConfiguration.settings.plant_profile || "wastewater"
  );

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-content-primary">
          Settings
        </h2>
        <p className="text-sm text-content-secondary">
          {currentProject ? currentProject.name : "New Simulation"}
        </p>
      </div>

      {/* Current Profile Badge */}
      <div className="mb-6 p-4 bg-primary-500/10 rounded-2xl border border-primary-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <p className="font-medium text-content-primary">
              {plantProfile === "wastewater" ? "Wastewater Treatment" : "Drinking Water Treatment"}
            </p>
            <p className="text-sm text-content-secondary">
              Current plant profile
            </p>
          </div>
        </div>
      </div>

      {/* Project Section */}
      <SettingsSection title="Project">
        <SettingsItem
          icon={<Save className="w-5 h-5 text-content-secondary" />}
          label="Save Project"
          description="Save current configuration"
          onClick={onOpenSave}
        />
        <SettingsItem
          icon={<FolderOpen className="w-5 h-5 text-content-secondary" />}
          label="Load Project"
          description="Open a saved project"
          onClick={onOpenLoad}
        />
      </SettingsSection>

      {/* Configuration Section */}
      <SettingsSection title="Configuration">
        <SettingsItem
          icon={<Settings className="w-5 h-5 text-content-secondary" />}
          label="Plant Settings"
          description="Cost inputs, operating hours"
          onClick={onOpenSettings}
        />
        <SettingsItem
          icon={theme === "dark"
            ? <Moon className="w-5 h-5 text-content-secondary" />
            : <Sun className="w-5 h-5 text-content-secondary" />
          }
          label="Appearance"
          description={theme === "dark" ? "Dark mode" : "Light mode"}
          onClick={toggleTheme}
          trailing={
            <div className={`
              w-12 h-7 rounded-full relative transition-colors
              ${theme === "dark" ? "bg-primary-500" : "bg-surface-highlight"}
            `}>
              <div className={`
                absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform
                ${theme === "dark" ? "left-6" : "left-1"}
              `} />
            </div>
          }
        />
      </SettingsSection>

      {/* Help Section */}
      <SettingsSection title="Help">
        <SettingsItem
          icon={<HelpCircle className="w-5 h-5 text-content-secondary" />}
          label="Keyboard Shortcuts"
          description="View available shortcuts"
          onClick={onShowShortcuts}
        />
      </SettingsSection>

      {/* Danger Zone */}
      <SettingsSection title="Reset">
        <SettingsItem
          icon={<RotateCcw className="w-5 h-5" />}
          label="Reset to Defaults"
          description="Clear all equipment and start fresh"
          onClick={onReset}
          destructive
        />
      </SettingsSection>

      {/* App Info */}
      <div className="text-center text-xs text-content-subtle mt-8">
        <p>SludgeSim</p>
        <p>Sludge Dewatering Simulation Platform</p>
      </div>
    </div>
  );
}
