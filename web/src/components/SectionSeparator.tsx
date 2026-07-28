import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/**
 * Divider row used inside a MapListLayout to split "best matches" from
 * "other results". Rendered as a full-width strip; supports a leading
 * icon and a right-aligned count pill.
 *
 * Wired into MapListLayout via `fullWidth: true` on the surrounding
 * MapListItem — see MapListLayout.tsx for that plumbing.
 */
export function SectionSeparator({
 label,
 count,
 icon: Icon = Sparkles,
 tone = "brand",
}: {
 label: string;
 count?: number;
 icon?: LucideIcon;
 tone?: "brand" | "sky" | "zinc";
}) {
 const toneClass = {
 brand: {
 line: "border-brand-200 dark:border-brand-500/30",
 chip: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
 pill: "bg-brand-500 text-white",
 },
 sky: {
 line: "border-sky-200 dark:border-sky-500/30",
 chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 pill: "bg-sky-500 text-white",
 },
 zinc: {
 line: "border-zinc-200 dark:border-zinc-700",
 chip: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
 pill: "bg-zinc-500 text-white",
 },
 }[tone];

 return (
 <div className="my-2 flex items-center gap-3">
 <span
 className={[
 "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-widest",
 toneClass.chip,
 ].join(" ")}
 >
 <Icon size={12} />
 {label}
 {count != null ? (
 <span className={["ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold", toneClass.pill].join(" ")}>
 {count}
 </span>
 ) : null}
 </span>
 <span className={["h-px flex-1 border-t", toneClass.line].join(" ")} />
 </div>
 );
}
