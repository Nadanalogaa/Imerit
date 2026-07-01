import { AnimatePresence, motion } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { useToast, type ToastTone } from "../store/toast";

const TONE: Record<ToastTone, { icon: React.ReactNode; ring: string; text: string; bg: string }> = {
  success: {
    icon: <Check size={14} strokeWidth={3} />,
    ring: "ring-emerald-500/25",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  error: {
    icon: <AlertTriangle size={14} strokeWidth={2.5} />,
    ring: "ring-rose-500/25",
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-500/10",
  },
  info: {
    icon: <Info size={14} strokeWidth={2.5} />,
    ring: "ring-sky-500/25",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-500/10",
  },
};

/**
 * Mounted once at the app root. Listens to the toast store and renders each
 * active toast as a small pill in the bottom-right, auto-dismissing after
 * the store-configured duration. Uses framer-motion for enter/exit so a
 * chain of quick successive toasts stacks and animates cleanly.
 */
export function ToastHost() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      role="region"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const tone = TONE[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={[
                "pointer-events-auto flex items-center gap-2.5 rounded-full bg-white px-3.5 py-2 shadow-lg ring-1 dark:bg-zinc-900",
                tone.bg,
                tone.ring,
              ].join(" ")}
            >
              <span className={["inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full", tone.bg, tone.text].join(" ")}>
                {tone.icon}
              </span>
              <span className={["text-[13px] font-semibold", tone.text].join(" ")}>{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={11} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
