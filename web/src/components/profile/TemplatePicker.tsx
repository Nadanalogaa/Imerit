import { motion } from "framer-motion";
import { Check, Eye } from "lucide-react";
import { RenderTemplate } from "../templates";
import { TEMPLATE_META } from "../templates/types";
import type { TemplateProps } from "../templates/types";
import type { TemplateId } from "../../store/profile";

interface Props extends TemplateProps {
 selected?: TemplateId;
 onSelect: (id: TemplateId) => void;
}

export function TemplatePicker({ user, profile, selected, onSelect }: Props) {
 return (
 <div className="flex flex-col gap-6">
 <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 px-4 py-3 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-pink-500/5">
 <Eye size={18} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
 <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
 Pick a profile design. The preview below uses your real details — switch templates anytime to compare.
 </p>
 </div>

 {/* Gallery */}
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
 {TEMPLATE_META.map((m) => {
 const isSelected = selected === m.id;
 return (
 <motion.button
 key={m.id}
 type="button"
 onClick={() => onSelect(m.id)}
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.97 }}
 className={[
 "group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition dark:bg-zinc-900",
 isSelected
 ? "border-brand-500 shadow-lg shadow-brand-500/30"
 : "border-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700",
 ].join(" ")}
 >
 {/* Mini preview */}
 <div className="relative h-32 overflow-hidden border-b border-zinc-200 bg-zinc-50 dark:bg-zinc-950">
 <div
 className="origin-top-left"
 style={{ width: 800, transform: "scale(0.16)" }}
 aria-hidden
 >
 <RenderTemplate id={m.id} user={user} profile={profile} />
 </div>
 {isSelected && (
 <motion.div
 initial={{ opacity: 0, scale: 0.7 }}
 animate={{ opacity: 1, scale: 1 }}
 className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/40"
 >
 <Check size={14} strokeWidth={3} />
 </motion.div>
 )}
 </div>

 <div className="px-3 py-2.5">
 <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{m.label}</p>
 <p className="mt-0.5 text-[10.5px] leading-snug text-zinc-500 dark:text-zinc-400">{m.desc}</p>
 </div>
 </motion.button>
 );
 })}
 </div>

 {/* Live preview */}
 {selected ? (
 <div className="flex flex-col gap-2.5">
 <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 <Eye size={14} /> Live preview
 </div>
 <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-200/40 dark:shadow-black/40">
 <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
 <RenderTemplate id={selected} user={user} profile={profile} />
 </motion.div>
 </div>
 <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
 One-page format. Admin and Employer exports auto-fit to a single PDF page.
 </p>
 </div>
 ) : (
 <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
 Pick a template above to see your live profile preview.
 </div>
 )}
 </div>
 );
}
