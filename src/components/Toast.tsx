"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const pushToast = useCallback((message: string, type: ToastType = "success") => {
    counterRef.current += 1;
    const id = counterRef.current;
    setToasts((previous) => [...previous, { id, message, type }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 3800);
  }, []);

  return { toasts, pushToast };
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[250] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-toast-in pointer-events-auto flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
              : "border-red-500/40 bg-red-950/90 text-red-100"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
