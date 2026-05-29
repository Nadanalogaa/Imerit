import { useId } from "react";
import { motion } from "framer-motion";

interface Option<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface Props<T extends string> {
  value: T | undefined;
  options: Option<T>[];
  onChange: (id: T) => void;
  large?: boolean;
}

export function SegmentedToggle<T extends string>({ value, options, onChange, large }: Props<T>) {
  // Unique per instance. Framer Motion treats every element sharing a
  // `layoutId` as the SAME morphing element — without this, multiple toggles
  // on one screen fight over a single highlight pill and all but one lose it.
  const layoutId = useId();
  return (
    <div
      className={[
        "relative grid w-full gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900",
        large ? "" : "p-1",
      ].join(" ")}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              "relative z-10 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition",
              large ? "py-3 px-4 text-base" : "py-2 px-3",
              active ? "text-white" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            {active && (
              <motion.span
                layoutId={`seg-active-bg-${layoutId}`}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-md shadow-brand-500/30"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
