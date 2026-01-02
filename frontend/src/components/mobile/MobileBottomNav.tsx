/**
 * Bottom navigation bar for mobile layout.
 * Provides tab-based navigation between Flow, Results, and Add views.
 */
import { GitBranch, BarChart3, Plus, Settings } from "lucide-react";

export type MobileTab = "flow" | "results" | "add" | "settings";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasResults?: boolean;
}

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

export function MobileBottomNav({ activeTab, onTabChange, hasResults }: MobileBottomNavProps) {
  const tabs: TabConfig[] = [
    {
      id: "flow",
      label: "Flow",
      icon: <GitBranch className="w-5 h-5" />,
    },
    {
      id: "results",
      label: "Results",
      icon: <BarChart3 className="w-5 h-5" />,
      badge: hasResults,
    },
    {
      id: "add",
      label: "Add",
      icon: <Plus className="w-5 h-5" />,
    },
    {
      id: "settings",
      label: "More",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-glass-border safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex flex-col items-center justify-center
              py-2 pt-3 pb-safe
              transition-colors duration-200
              ${activeTab === tab.id
                ? "text-primary-500"
                : "text-content-secondary hover:text-content-primary"
              }
            `}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-status-success rounded-full" />
              )}
            </div>
            <span className="text-2xs font-medium mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
