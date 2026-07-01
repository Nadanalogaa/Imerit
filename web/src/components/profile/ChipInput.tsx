import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus } from "lucide-react";

interface Props {
 value: string[];
 onChange: (next: string[]) => void;
 placeholder?: string;
 suggestions?: string[];
 max?: number;
 hint?: string;
}

export function ChipInput({ value, onChange, placeholder, suggestions = [], max, hint }: Props) {
 const [draft, setDraft] = useState("");

 const add = (raw: string) => {
 const v = raw.trim();
 if (!v) return;
 if (value.includes(v)) return;
 if (max && value.length >= max) return;
 onChange([...value, v]);
 setDraft("");
 };

 const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

 const remainingSuggestions = suggestions.filter((s) => !value.includes(s));
 const atMax = max != null && value.length >= max;

 return (
 <div className="flex flex-col gap-2.5">
 <div
 className={[
 "flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-2 transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:bg-zinc-950",
 "border-zinc-200 ",
 ].join(" ")}
 >
 <AnimatePresence>
 {value.map((v, i) => (
 <motion.span
 key={`${v}-${i}`}
 layout
 initial={{ opacity: 0, scale: 0.85 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.85 }}
 transition={{ duration: 0.15 }}
 className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-1 pl-3 pr-1 text-xs font-semibold text-white shadow-sm"
 >
 {v}
 <button
 type="button"
 onClick={() => remove(i)}
 className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
 >
 <X size={12} strokeWidth={3} />
 </button>
 </motion.span>
 ))}
 </AnimatePresence>

 <input
 value={draft}
 onChange={(e) => setDraft(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === ",") {
 e.preventDefault();
 add(draft);
 } else if (e.key === "Backspace" && !draft && value.length > 0) {
 remove(value.length - 1);
 }
 }}
 disabled={atMax}
 placeholder={atMax ? `Max ${max} reached` : placeholder ?? "Type and press Enter"}
 className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 dark:placeholder:text-zinc-500"
 />

 {draft.trim() && !atMax && (
 <button
 type="button"
 onClick={() => add(draft)}
 className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 border border-zinc-200 dark:border-zinc-800"
 >
 <Plus size={12} strokeWidth={3} /> Add
 </button>
 )}
 </div>

 {hint && (
 <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
 {hint} {max != null && <span className="ml-1 font-medium">({value.length}/{max})</span>}
 </p>
 )}

 {remainingSuggestions.length > 0 && !atMax && (
 <div className="flex flex-wrap gap-1.5">
 {remainingSuggestions.map((s) => (
 <button
 key={s}
 type="button"
 onClick={() => add(s)}
 className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
 >
 + {s}
 </button>
 ))}
 </div>
 )}
 </div>
 );
}
