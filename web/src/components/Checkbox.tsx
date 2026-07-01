import { Check } from "lucide-react";

type Tone = "brand" | "emerald" | "amber" | "violet" | "sky";

const TONES: Record<Tone, { box: string; ring: string }> = {
  brand:   { box: "bg-brand-500 border-brand-500",     ring: "focus-visible:ring-brand-500/30" },
  emerald: { box: "bg-emerald-500 border-emerald-500", ring: "focus-visible:ring-emerald-500/30" },
  amber:   { box: "bg-amber-500 border-amber-500",     ring: "focus-visible:ring-amber-500/30" },
  violet:  { box: "bg-violet-500 border-violet-500",   ring: "focus-visible:ring-violet-500/30" },
  sky:     { box: "bg-sky-500 border-sky-500",         ring: "focus-visible:ring-sky-500/30" },
};

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  /** Brand fill color when checked. Defaults to "brand". */
  tone?: Tone;
  /** Display the box without inline label spacing — for inline use in tables/forms. */
  inline?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
}

/**
 * Custom checkbox with a hidden native input for accessibility and a
 * styled visual box on top. One source of truth for checkbox chrome —
 * any new tickable surface should use this rather than rolling its own
 * `accent-*` class.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  tone = "brand",
  inline = false,
  disabled = false,
  size = "md",
}: Props) {
  const t = TONES[tone];
  const dimensions = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  const iconSize = size === "sm" ? 11 : 13;

  return (
    <label
      className={[
        "group inline-flex items-center gap-2 select-none",
        inline ? "" : "cursor-pointer",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={[
          "relative flex shrink-0 items-center justify-center rounded-[5px] border transition",
          dimensions,
          checked
            ? `${t.box} text-white`
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2",
          t.ring,
          !disabled && !checked ? "group-hover:border-zinc-400 dark:group-hover:border-zinc-500" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        {checked && <Check size={iconSize} strokeWidth={3} />}
      </span>
      {label !== undefined && (
        <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      )}
    </label>
  );
}
