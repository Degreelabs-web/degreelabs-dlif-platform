"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type ToastKind = "success" | "error";
type Toast = { id: number; message: string; kind: ToastKind };
type ToastContextValue = { notify: (message: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[200] flex max-w-sm flex-col gap-2 sm:left-auto sm:right-5">
        {toasts.map((toast) => {
          const isError = toast.kind === "error";
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 text-sm shadow-xl ${
                isError
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-emerald-200 bg-white text-slate-800"
              }`}
            >
              {isError ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
              <p className="flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-black/5 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}
