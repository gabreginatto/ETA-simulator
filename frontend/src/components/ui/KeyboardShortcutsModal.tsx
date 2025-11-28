/**
 * Modal showing keyboard shortcuts.
 * Dark glass morphism design.
 */
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "Run simulation" },
  { keys: ["Ctrl", "S"], description: "Save project" },
  { keys: ["Ctrl", "O"], description: "Load project" },
  { keys: ["Esc"], description: "Deselect node / Close modal" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-overlay animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl shadow-float w-full max-w-md mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-content-accent" />
            <h2 className="text-lg font-semibold text-content-primary">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-content-subtle" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-content-secondary">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex}>
                      <kbd className="px-2 py-1 text-xs font-mono bg-surface-highlight border border-glass-border rounded-lg shadow-sm text-content-primary">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="mx-1 text-content-subtle">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-surface-elevated/50 rounded-b-2xl border-t border-glass-border">
          <p className="text-xs text-content-subtle text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-surface-highlight border border-glass-border rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
