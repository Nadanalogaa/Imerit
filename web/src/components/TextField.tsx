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
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoFocus={autoFocus}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "rounded-2xl border bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-950 dark:placeholder:text-zinc-500",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-zinc-200 focus:border-brand-500 focus:ring-brand-500/20 dark:border-zinc-800",
        ].join(" ")}
      />
      {hint && !error && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  );
}
