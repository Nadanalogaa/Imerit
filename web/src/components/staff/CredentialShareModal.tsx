import { useState } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, KeyRound, Mail, ShieldCheck } from "lucide-react";

/**
 * One-time modal that surfaces a freshly-generated set of login credentials
 * (email + password) so staff can hand them off manually until the email
 * pipeline is wired. The same password is also stored on the employer row
 * for lookup later, but this modal is what makes the moment-of-creation
 * flow tolerable — it's got a big Copy button and a "mark as shared"
 * dismiss so the staff member can't accidentally close it before capturing
 * the value.
 */
export function CredentialShareModal({
  title,
  subtitle,
  email,
  password,
  onClose,
}: {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const copy = async (kind: "email" | "password" | "both", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // Older browsers / insecure origins — fall back to a manual prompt.
      window.prompt("Copy manually (Ctrl/Cmd+C):", text);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={acknowledged ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credshare-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900"
      >
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 py-6 text-white">
          <button
            type="button"
            onClick={onClose}
            disabled={!acknowledged}
            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close"
            title={acknowledged ? "Close" : "Tick the acknowledgement below first"}
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 id="credshare-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-white/85">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <p className="font-semibold">Email delivery isn't wired yet</p>
            <p className="mt-0.5 text-amber-800/85 dark:text-amber-300/80">
              Share these credentials manually (WhatsApp, phone, in person). The password stays
              visible on the Employer Master row so you can look it up later.
            </p>
          </div>

          <CredRow
            icon={<Mail size={13} />}
            label="Email"
            value={email}
            copied={copied === "email"}
            onCopy={() => copy("email", email)}
          />
          <CredRow
            icon={<KeyRound size={13} />}
            label="Password"
            value={password}
            mono
            copied={copied === "password"}
            onCopy={() => copy("password", password)}
          />

          <button
            type="button"
            onClick={() => copy("both", `Email: ${email}\nPassword: ${password}`)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            {copied === "both" ? <Check size={14} /> : <Copy size={14} />}
            {copied === "both" ? "Both copied to clipboard" : "Copy both"}
          </button>

          <label className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span className="text-[12px] text-zinc-700 dark:text-zinc-300">
              I've captured these credentials — I can share them with the employer and close this
              dialog.
            </span>
          </label>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={!acknowledged}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Check size={14} /> Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CredRow({
  icon,
  label,
  value,
  copied,
  onCopy,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-1 pl-3 dark:border-zinc-800 dark:bg-zinc-950">
        <span
          className={[
            "flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100",
            mono ? "font-mono tabular-nums" : "font-medium",
          ].join(" ")}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
