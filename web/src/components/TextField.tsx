interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "email" | "numeric" | "tel";
  autoFocus?: boolean;
  hint?: string;
  error?: string;
  maxLength?: number;
  /** Renders the field read-only + visually muted. Used for immutable
   *  keys like an employer's email in the edit form. */
  disabled?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoFocus,
  hint,
  error,
  maxLength,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "h-11 rounded-lg border bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-zinc-300 focus:border-brand-500 focus:ring-brand-500/15 dark:border-zinc-700",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      />
      {hint && !error && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  );
}
