import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  isLast?: boolean;
}

export function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  isLast = false,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
      </div>

      {children}

      <div className="mt-8 flex items-center justify-between gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <span />
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
        >
          {nextLabel}
          {!isLast && <ArrowRight size={16} />}
        </motion.button>
      </div>
    </motion.div>
  );
}
