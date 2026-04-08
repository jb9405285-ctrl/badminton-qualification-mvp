"use client";

import type { ReactNode } from "react";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "warning" | "error";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  default: "border-slate-200 bg-white text-slate-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900"
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  function dismiss(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function toast(input: ToastInput) {
    const id = crypto.randomUUID();
    const nextToast: ToastRecord = {
      durationMs: 3200,
      tone: "default",
      ...input,
      id
    };

    setToasts((current) => [...current, nextToast]);
  }

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timers = toasts.map((item) =>
      window.setTimeout(() => {
        dismiss(item.id);
      }, item.durationMs ?? 3200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const value = useMemo<ToastContextValue>(() => ({ toast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((item) => (
            <div
              className={cn(
                "pointer-events-auto rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-sm",
                toneClasses[item.tone ?? "default"]
              )}
              key={item.id}
            >
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? <p className="mt-1 text-sm opacity-80">{item.description}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
