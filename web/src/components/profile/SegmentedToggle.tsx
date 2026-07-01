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

/**
 * iOS / macOS-style segmented control. Soft zinc track, white selected pill
 * with a subtle shadow and brand-tinted text — reads as "selected" without
 * the loud full-bleed orange fill that the previous version used.
 */
export function SegmentedToggle<T extends string>({ value, options, onChange, large }: Props<T>) {
  // Unique per instance. Framer Motion treats every element sharing a
  // `layoutId` as the SAME morphing element — without this, multiple toggles
  // on one screen fight over a single highlight pill and all but one lose it.
  const layoutId = useId();
  return (
    <div
      className="relative grid w-full gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/70"
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
              "relative z-10 flex items-center justify-center gap-2 rounded-md font-medium transition",
              large ? "py-2.5 px-4 text-[14px]" : "py-2 px-3 text-[13px]",
              active
                ? "text-brand-700 dark:text-brand-300"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            ].join(" ")}
          >
            {active && (
              <motion.span
                layoutId={`seg-active-bg-${layoutId}`}
                className="absolute inset-0 rounded-md bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:bg-zinc-900"
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
