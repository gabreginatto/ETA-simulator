/**
 * Simple toast notification component.
 * Dark glass morphism design.
 */
import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: {
    bg: "bg-status-success/10",
    border: "border-status-success/30",
    icon: "text-status-success",
    title: "text-status-success",
    message: "text-status-success/80",
  },
  error: {
    bg: "bg-status-error/10",
    border: "border-status-error/30",
    icon: "text-status-error",
    title: "text-status-error",
    message: "text-status-error/80",
  },
  warning: {
    bg: "bg-status-warning/10",
    border: "border-status-warning/30",
    icon: "text-status-warning",
    title: "text-status-warning",
    message: "text-status-warning/80",
  },
  info: {
    bg: "bg-status-info/10",
    border: "border-status-info/30",
    icon: "text-status-info",
    title: "text-status-info",
    message: "text-status-info/80",
  },
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = icons[type];
  const color = colors[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 200);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 200);
  };

  return (
    <div
      className={`
        glass ${color.bg} ${color.border}
        border rounded-xl shadow-float p-4 max-w-sm w-full
        transform transition-all duration-200
        ${isExiting ? "opacity-0 translate-x-full" : "opacity-100 translate-x-0"}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${color.title}`}>{title}</p>
          {message && (
            <p className={`text-sm mt-1 ${color.message}`}>{message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`${color.icon} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Toast container for managing multiple toasts
interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemove}
        />
      ))}
    </div>
  );
}
