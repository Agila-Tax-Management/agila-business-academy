// src/context/ToastContext.tsx
"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-danger" />,
  info: <Info className="w-5 h-5 text-info" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
};

const styles: Record<ToastType, { border: string; bg: string }> = {
  success: { border: "border-l-success", bg: "bg-success/10" },
  error:   { border: "border-l-danger",  bg: "bg-danger/10"  },
  info:    { border: "border-l-info",    bg: "bg-info/10"    },
  warning: { border: "border-l-warning", bg: "bg-warning/10" },
};

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((title: string, message?: string) => push("success", title, message), [push]);
  const error   = useCallback((title: string, message?: string) => push("error",   title, message), [push]);
  const info    = useCallback((title: string, message?: string) => push("info",    title, message), [push]);
  const warning = useCallback((title: string, message?: string) => push("warning", title, message), [push]);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <div className="fixed bottom-5 right-5 z-9999 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 ${styles[t.type].bg} rounded-xl shadow-lg border border-l-4 ${styles[t.type].border} p-4 animate-fade-up`}
          >
            <div className="mt-0.5 shrink-0">{icons[t.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              {t.message && <p className="text-xs text-muted mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-muted hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
