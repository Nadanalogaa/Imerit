import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  /** ms until auto-dismiss. 0 = sticky (user must close). */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, opts?: { tone?: ToastTone; duration?: number }) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (message, opts) => {
    const id = nextId++;
    const toast: Toast = {
      id,
      message,
      tone: opts?.tone ?? "success",
      duration: opts?.duration ?? 2500,
    };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (toast.duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, toast.duration);
    }
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helpers so call sites don't have to reach into the store. */
export const toast = {
  success: (message: string) => useToast.getState().push(message, { tone: "success" }),
  error: (message: string) => useToast.getState().push(message, { tone: "error", duration: 3500 }),
  info: (message: string) => useToast.getState().push(message, { tone: "info" }),
};
