"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { X, CheckCircle2, AlertTriangle, Info, Bell, ExternalLink } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "warning" | "info" | "error";
  actionLabel?: string;
  actionHref?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICON_MAP = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: AlertTriangle,
};

const COLOR_MAP = {
  success: "text-success",
  warning: "text-warning-dark dark:text-warning",
  info: "text-info",
  error: "text-danger",
};

const BG_MAP = {
  success: "bg-success-bg/80 dark:bg-success-bg-dark/80 border-success/20",
  warning: "bg-warning-bg/80 dark:bg-warning-bg-dark/80 border-warning/20",
  info: "bg-info-bg/80 dark:bg-info-bg-dark/80 border-info/20",
  error: "bg-danger-bg/80 dark:bg-danger-bg-dark/80 border-danger/20",
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICON_MAP[t.variant];
  const color = COLOR_MAP[t.variant];
  const bg = BG_MAP[t.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(t.id), t.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-dropdown bg-surface dark:bg-surface-dark backdrop-blur-md animate-slide-up ${bg}`}
      role="alert"
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-fg dark:text-fg-dark">{t.title}</p>
        {t.description && (
          <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{t.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}