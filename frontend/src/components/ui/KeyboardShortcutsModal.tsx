/**
 * Modal showing keyboard shortcuts.
 */
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "Run simulation" },
  { keys: ["Ctrl", "S"], description: "Save project (coming soon)" },
  { keys: ["Ctrl", "O"], description: "Open project (coming soon)" },
  { keys: ["Esc"], description: "Deselect node / Close panel" },
  { keys: ["?"], description: "Show this help" },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
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
                <span className="text-sm text-slate-600">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex}>
                      <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-300 rounded shadow-sm">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="mx-1 text-slate-400">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 rounded-b-lg border-t border-gray-200">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1 py-0.5 text-xs font-mono bg-slate-200 rounded">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
