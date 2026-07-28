import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Small custom-modal confirm — replaces `window.confirm` for destructive
 * actions where we want a proper warning UI (danger badge, item list,
 * typed keyword confirmation, etc). Keep it dumb; container owns the
 * open/close state.
 *
 * `requireTyped` gates the primary button until the user types the exact
 * string — use it for the truly-scary ones (permanent delete, empty trash).
 */
export function ConfirmDialog({
 open,
 title,
 message,
 detail,
 confirmLabel = "Confirm",
 cancelLabel = "Cancel",
 tone = "danger",
 requireTyped,
 items,
 busy = false,
 onConfirm,
 onClose,
}: {
 open: boolean;
 title: string;
 message: React.ReactNode;
 detail?: React.ReactNode;
 confirmLabel?: string;
 cancelLabel?: string;
 tone?: "danger" | "warning" | "neutral";
 requireTyped?: string;
 items?: string[];
 busy?: boolean;
 onConfirm: () => void | Promise<void>;
 onClose: () => void;
}) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [typed, setTyped] = useState("");

 useEffect(() => {
 if (open) setTyped("");
 }, [open, setTyped]);

 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 };
 window.addEventListener("keydown", onKey);
 setTimeout(() => inputRef.current?.focus(), 50);
 return () => window.removeEventListener("keydown", onKey);
 }, [open, onClose]);

 if (!open) return null;

 const disabled = busy || (requireTyped ? typed.trim() !== requireTyped : false);

 const toneClasses = {
 danger: {
 iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
 button: "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600",
 accent: "text-rose-600 dark:text-rose-400",
 },
 warning: {
 iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
 button: "bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600",
 accent: "text-amber-600 dark:text-amber-400",
 },
 neutral: {
 iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
 button: "bg-sky-600 hover:bg-sky-700 focus-visible:outline-sky-600",
 accent: "text-sky-600 dark:text-sky-400",
 },
 }[tone];

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
 <div className="flex items-start gap-4">
 <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-full", toneClasses.iconBg].join(" ")}>
 <AlertTriangle size={22} />
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between">
 <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
 {title}
 </h2>
 <button
 type="button"
 onClick={onClose}
 className="ml-2 -mr-1 -mt-1 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
 aria-label="Close"
 >
 <X size={18} />
 </button>
 </div>
 <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message}</div>
 {detail ? (
 <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{detail}</div>
 ) : null}
 {items && items.length ? (
 <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs dark:border-zinc-700 dark:bg-zinc-950/60">
 {items.slice(0, 30).map((it) => (
 <div key={it} className="truncate text-zinc-700 dark:text-zinc-300">
 • {it}
 </div>
 ))}
 {items.length > 30 ? (
 <div className={["mt-1 text-[11px] italic", toneClasses.accent].join(" ")}>
 + {items.length - 30} more…
 </div>
 ) : null}
 </div>
 ) : null}
 {requireTyped ? (
 <div className="mt-3">
 <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
 Type <code className={["rounded bg-zinc-100 px-1.5 py-0.5 text-[11.5px] font-bold dark:bg-zinc-800", toneClasses.accent].join(" ")}>{requireTyped}</code> to confirm
 </label>
 <input
 ref={inputRef}
 value={typed}
 onChange={(e) => setTyped(e.target.value)}
 className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
 />
 </div>
 ) : null}
 </div>
 </div>

 <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
 <button
 type="button"
 onClick={onClose}
 disabled={busy}
 className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
 >
 {cancelLabel}
 </button>
 <button
 type="button"
 onClick={onConfirm}
 disabled={disabled}
 className={[
 "rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
 toneClasses.button,
 ].join(" ")}
 >
 {busy ? "Working…" : confirmLabel}
 </button>
 </div>
 </div>
 </div>
 );
}

