import { Sparkles, Target, Compass } from "lucide-react";

interface Props {
 shortTerm: string;
 longTerm: string;
 onShortTerm: (v: string) => void;
 onLongTerm: (v: string) => void;
 shortError?: string;
 longError?: string;
}

const MAX = 220;

export function AmbitionStep({
 shortTerm,
 longTerm,
 onShortTerm,
 onLongTerm,
 shortError,
 longError,
}: Props) {
 return (
 <div className="flex flex-col gap-5">
 <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 px-4 py-3 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-fuchsia-500/5">
 <Sparkles size={18} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
 <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
 Our team uses your ambitions to match you with relevant industries and roles. Be honest and specific — short and long term.
 </p>
 </div>

 <Field
 icon={<Target size={16} />}
 iconColor="text-emerald-600 dark:text-emerald-400"
 label="Short-term ambition"
 helper="Where do you want to be in the next 1–2 years?"
 value={shortTerm}
 onChange={onShortTerm}
 placeholder="e.g. Land a junior software engineer role at a Tamil Nadu startup and ship features in production within 6 months."
 max={MAX}
 error={shortError}
 />

 <Field
 icon={<Compass size={16} />}
 iconColor="text-sky-600 dark:text-sky-400"
 label="Long-term ambition"
 helper="Where do you see yourself in 5–10 years?"
 value={longTerm}
 onChange={onLongTerm}
 placeholder="e.g. Lead an engineering team and mentor first-generation college graduates from rural Tamil Nadu into tech careers."
 max={MAX}
 error={longError}
 />
 </div>
 );
}

function Field({
 icon,
 iconColor,
 label,
 helper,
 value,
 onChange,
 placeholder,
 max,
 error,
}: {
 icon: React.ReactNode;
 iconColor: string;
 label: string;
 helper: string;
 value: string;
 onChange: (v: string) => void;
 placeholder: string;
 max: number;
 error?: string;
}) {
 return (
 <div>
 <div className="mb-1.5 flex items-center gap-2">
 <span className={iconColor}>{icon}</span>
 <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</label>
 </div>
 <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{helper}</p>
 <textarea
 value={value}
 onChange={(e) => onChange(e.target.value.slice(0, max))}
 placeholder={placeholder}
 rows={3}
 className={[
 "w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-950 dark:placeholder:text-zinc-500",
 error
 ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
 : "border-zinc-200 focus:border-brand-500 focus:ring-brand-500/20 ",
 ].join(" ")}
 />
 <div className="mt-1 flex items-center justify-between">
 {error ? (
 <span className="text-[11px] text-rose-500">{error}</span>
 ) : (
 <span className="text-[11px] text-zinc-400">Keep it short — about 2 lines.</span>
 )}
 <span
 className={[
 "text-[11px] font-medium",
 value.length > max * 0.85 ? "text-amber-500" : "text-zinc-400",
 ].join(" ")}
 >
 {value.length} / {max}
 </span>
 </div>
 </div>
 );
}
