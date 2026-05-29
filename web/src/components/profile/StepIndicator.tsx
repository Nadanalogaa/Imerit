import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  current: number;
}

export function StepIndicator({ steps, current }: Props) {
  const pct = steps.length <= 1 ? 100 : (current / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Desktop: numbered circles + connecting bar */}
      <div className="relative hidden items-start justify-between md:flex">
        <div className="absolute left-5 right-5 top-5 h-0.5 -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800" />
        <motion.div
          className="absolute left-5 top-5 h-0.5 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-brand-600"
          initial={false}
          animate={{ width: `calc(${pct}% - ${pct === 100 ? "20px" : "0px"})` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        {steps.map((s, i) => (
          <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: i <= current ? "#f97316" : "#e4e4e7",
                color: i <= current ? "#ffffff" : "#71717a",
                scale: i === current ? 1.08 : 1,
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold shadow-sm dark:bg-zinc-800"
              style={i <= current ? { boxShadow: "0 8px 22px -6px rgba(249,115,22,0.55)" } : {}}
            >
              {i < current ? <Check size={16} strokeWidth={3} /> : i + 1}
            </motion.div>
            <span
              className={[
                "text-xs font-medium tracking-tight transition",
                i === current
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400",
              ].join(" ")}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: linear progress + current label */}
      <div className="md:hidden">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-brand-600 dark:text-brand-400">
            Step {current + 1} of {steps.length}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {steps[current]?.label}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <motion.div
            initial={false}
            animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
          />
        </div>
      </div>
    </div>
  );
}
