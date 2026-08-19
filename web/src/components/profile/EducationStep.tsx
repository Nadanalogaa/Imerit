import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Plus, ChevronDown } from "lucide-react";
import type { Education, EducationLevel } from "../../store/profile";
import { Checkbox } from "../Checkbox";
import { degreesForLevel, specializationsForDegree } from "../../lib/degreeTaxonomy";
import { useLocations } from "../../store/locations";

interface LevelMeta {
 id: EducationLevel;
 label: string;
 hint?: string;
}

const LEVELS: LevelMeta[] = [
 { id: "10th", label: "10th Standard" },
 { id: "12th", label: "12th Standard" },
 { id: "diploma", label: "Diploma" },
 { id: "ug", label: "Undergraduate (UG)" },
 { id: "pg", label: "Postgraduate (PG)" },
 { id: "mphil", label: "M.Phil" },
 { id: "phd", label: "Ph.D" },
 { id: "other", label: "Other Courses" },
];

const yearNow = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => yearNow - i);

interface Props {
 value: Education[];
 onChange: (next: Education[]) => void;
}

export function EducationStep({ value, onChange }: Props) {
 const map = new Map(value.map((e) => [e.level, e]));

 const update = (level: EducationLevel, patch: Partial<Education>) => {
 const existing = map.get(level) ?? { level, enabled: false };
 const next: Education = { ...existing, ...patch };
 const others = value.filter((e) => e.level !== level);
 onChange([...others, next].sort(byLevelOrder));
 };

 const toggle = (level: EducationLevel) => {
 const existing = map.get(level);
 if (!existing) {
 update(level, { enabled: true });
 } else {
 update(level, { enabled: !existing.enabled });
 }
 };

 const enabledCount = value.filter((e) => e.enabled).length;

 return (
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-50 to-amber-50 px-4 py-3 dark:from-brand-500/10 dark:to-amber-500/5">
 <div className="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-200">
 <GraduationCap size={18} className="text-brand-600 dark:text-brand-400" />
 <span>Tick every level you have, then add the details.</span>
 </div>
 <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand-700 shadow-sm dark:bg-zinc-900 dark:text-brand-400">
 {enabledCount} added
 </span>
 </div>

 <div className="flex flex-col gap-2.5">
 {LEVELS.map((meta) => {
 const edu = map.get(meta.id);
 const enabled = edu?.enabled ?? false;
 return (
 <LevelCard
 key={meta.id}
 meta={meta}
 edu={edu}
 enabled={enabled}
 onToggle={() => toggle(meta.id)}
 onChange={(p) => update(meta.id, p)}
 />
 );
 })}
 </div>
 </div>
 );
}

function LevelCard({
 meta,
 edu,
 enabled,
 onToggle,
 onChange,
}: {
 meta: LevelMeta;
 edu: Education | undefined;
 enabled: boolean;
 onToggle: () => void;
 onChange: (p: Partial<Education>) => void;
}) {
 // Flipped to true once the height-expand animation completes so the
 // body can render `overflow: visible` — needed for the searchable
 // DistrictSelect popover to escape the card. See the motion.div below.
 //
 // SEED FROM `enabled`: AnimatePresence uses initial={false} so a card
 // that's already open on first render skips its enter animation —
 // which means onAnimationComplete never fires, bodyOpen stays false,
 // and the district dropdown gets clipped. Starting bodyOpen=enabled
 // matches the visible state at mount and only flips to false while a
 // fresh collapse/expand animation is actually running.
 const [bodyOpen, setBodyOpen] = useState(enabled);
 return (
 // `overflow-hidden` used to live here so the height-collapse
 // animation clipped cleanly, but it also clipped the searchable
 // DistrictSelect dropdown inside the enabled body. The height
 // animation on the inner motion.div now owns the clipping so
 // popovers in the body escape the card and render freely.
 <motion.div
 layout
 transition={{ duration: 0.25, ease: "easeOut" }}
 className={[
 "rounded-xl transition",
 enabled
 ? "bg-brand-50/60 dark:bg-brand-500/10"
 : "border border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
 ].join(" ")}
 >
 <div className="flex w-full items-center gap-3 px-4 py-3">
 <Checkbox checked={enabled} onChange={() => onToggle()} />
 <button type="button" onClick={onToggle} className="flex flex-1 items-center gap-3 text-left">
 <span
 className={[
 "flex-1 text-sm font-semibold",
 enabled ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300",
 ].join(" ")}
 >
 {meta.label}
 </span>
 {!enabled && (
 <span className="text-xs text-zinc-400 dark:text-zinc-500">
 <Plus size={14} className="inline" /> Add
 </span>
 )}
 </button>
 </div>

 <AnimatePresence initial={false}>
 {enabled && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.25, ease: "easeOut" }}
 // Clip during the height animation so the collapse looks
 // tidy; once the "open" animation completes, flip overflow
 // to visible so absolutely-positioned popovers inside (the
 // searchable DistrictSelect) can spill out of the card.
 style={{ overflow: bodyOpen ? "visible" : "hidden" }}
 onAnimationStart={() => setBodyOpen(false)}
 onAnimationComplete={() => setBodyOpen(true)}
 >
 <div className="grid gap-3 border-t border-zinc-200/70 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-700/70">
 <NumField
 label="Percentage"
 value={edu?.percentage}
 onChange={(v) => onChange({ percentage: v })}
 placeholder="e.g. 85"
 suffix="%"
 max={100}
 />
 <YearSelect
 label="Year passed"
 value={edu?.passedOutYear}
 onChange={(y) => onChange({ passedOutYear: y })}
 />
 <TextInput
 label="Institution / Board"
 value={edu?.institution ?? ""}
 onChange={(v) => onChange({ institution: v })}
 placeholder="School / college name"
 />
 <DistrictSelect
 label="District"
 value={edu?.districtId ?? ""}
 onChange={(v) => onChange({ districtId: v || undefined })}
 />
 <TextInput
 label="Pincode (optional)"
 value={edu?.pincode ?? ""}
 onChange={(v) => onChange({ pincode: v.replace(/\D/g, "").slice(0, 6) || undefined })}
 placeholder="e.g. 600001"
 />
 {/* Degree name + specialisation for post-secondary levels.
     Skipped for 10th / 12th (single-stream schooling) and
     "other" (which already has its own courseName field).
     Both are dropdowns with a curated Tamil Nadu / Indian
     education-board list; picking "Other" flips the field to a
     free-text input. Specialisation options narrow based on the
     picked degree. */}
 {(meta.id === "diploma" || meta.id === "ug" || meta.id === "pg" || meta.id === "mphil" || meta.id === "phd") && (
 <>
 <SelectWithOther
 label="Degree name"
 value={edu?.degreeName ?? ""}
 options={degreesForLevel(meta.id)}
 placeholder="Select a degree"
 onChange={(next) => {
 // Clear a stale specialisation when the new degree doesn't
 // offer it — same auto-clear pattern used by industry ↔
 // department elsewhere.
 const validSpecs = specializationsForDegree(next || undefined, meta.id);
 const patch: Partial<Education> = { degreeName: next || undefined };
 if (edu?.specialization && !validSpecs.includes(edu.specialization)) {
 patch.specialization = undefined;
 }
 onChange(patch);
 }}
 />
 <SelectWithOther
 label="Specialization / Stream"
 value={edu?.specialization ?? ""}
 options={specializationsForDegree(edu?.degreeName, meta.id)}
 placeholder={edu?.degreeName ? "Select a specialization" : "Pick a degree first"}
 onChange={(next) => onChange({ specialization: next || undefined })}
 />
 </>
 )}
 {meta.id === "phd" && (
 <div className="sm:col-span-3">
 <TextInput
 label="Thesis title"
 value={edu?.thesis ?? ""}
 onChange={(v) => onChange({ thesis: v })}
 placeholder="e.g. Multi-modal AI for low-resource languages"
 />
 </div>
 )}
 {meta.id === "other" && (
 <div className="sm:col-span-3">
 <TextInput
 label="Course name"
 value={edu?.courseName ?? ""}
 onChange={(v) => onChange({ courseName: v })}
 placeholder="e.g. PG Diploma in Data Science"
 />
 </div>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}

function NumField({
 label,
 value,
 onChange,
 placeholder,
 suffix,
 max,
}: {
 label: string;
 value?: number;
 onChange: (v: number | undefined) => void;
 placeholder?: string;
 suffix?: string;
 max?: number;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
 <div className="relative">
 <input
 type="number"
 value={value ?? ""}
 onChange={(e) => {
 const v = e.target.value === "" ? undefined : Number(e.target.value);
 if (v !== undefined && max !== undefined && v > max) return;
 onChange(v);
 }}
 placeholder={placeholder}
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 {suffix && (
 <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
 {suffix}
 </span>
 )}
 </div>
 </div>
 );
}

function YearSelect({
 label,
 value,
 onChange,
}: {
 label: string;
 value?: number;
 onChange: (y: number | undefined) => void;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
 <select
 value={value ?? ""}
 onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 >
 <option value="">Select year</option>
 {YEARS.map((y) => (
 <option key={y} value={y}>
 {y}
 </option>
 ))}
 </select>
 </div>
 );
}

function TextInput({
 label,
 value,
 onChange,
 placeholder,
}: {
 label: string;
 value: string;
 onChange: (v: string) => void;
 placeholder?: string;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
 <input
 type="text"
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 </div>
 );
}

/**
 * Native-select wrapped to match the standard input chrome — appearance-none
 * suppresses the OS arrow, lucide ChevronDown sits at the right edge.
 */
function DistrictSelect({
 label,
 value,
 onChange,
}: {
 label: string;
 value: string;
 onChange: (id: string) => void;
}) {
 const districts = useLocations((s) => s.districts);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = districts.find((d) => d.id === value);
  const filtered = useMemo(
    () => districts.filter((d) => d.name.toLowerCase().includes(query.toLowerCase().trim())),
    [districts, query],
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectDistrict = (id: string) => {
    onChange(id);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef}>
      <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3.5 text-left text-sm transition hover:border-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className={selected ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
            {selected?.name ?? "Select district"}
          </span>
          <ChevronDown size={15} className={`text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search districts…"
                autoFocus
                className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:bg-zinc-950"
              />
            </div>
            <ul
              className="max-h-56 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ overscrollBehavior: "contain" }}
            >
              <li>
                <button
                  type="button"
                  onClick={() => selectDistrict("")}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-500 hover:bg-brand-50 hover:text-brand-700 dark:text-zinc-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                >
                  Clear selection
                </button>
              </li>
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-zinc-500">No districts match "{query}"</li>
              ) : (
                filtered.map((d) => {
                  const active = value === d.id;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => selectDistrict(d.id)}
                        className={[
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition",
                          active
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                            : "text-zinc-700 hover:bg-brand-50 dark:text-zinc-300 dark:hover:bg-brand-500/10",
                        ].join(" ")}
                      >
                        <span>{d.name}</span>
                        <ChevronDown size={12} className={`opacity-0 ${active ? "opacity-100" : ""}`} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Dropdown with a curated pick-list + a free-text escape hatch. When
 * the user picks "Other" from the dropdown the component flips to a
 * plain TextInput so they can type a custom value; picking a real
 * option from the dropdown again flips back. Emits the actual value
 * (never the literal "Other").
 *
 * Reused by the Education step for Degree name + Specialization so
 * both fields feel consistent — dropdown-first, free-text-if-needed.
 */
function SelectWithOther({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  // "Other" mode is on when the value isn't empty AND isn't one of the
  // canonical options (or the user explicitly picked "Other" in the
  // dropdown and hasn't typed anything yet).
  const [otherMode, setOtherMode] = useState(
    Boolean(value && !options.includes(value) && value !== "Other"),
  );
  // If the parent value changes to a canonical option, flip back out
  // of Other mode automatically.
  useEffect(() => {
    if (value && options.includes(value)) setOtherMode(false);
  }, [value, options]);

  // In dropdown mode the selected <option> value is either the
  // matching canonical option, "Other" when we're in free-text mode,
  // or empty when nothing is set.
  const selectValue = otherMode ? "Other" : value && options.includes(value) ? value : "";

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "Other") {
            setOtherMode(true);
            // Clear any prior canonical value so the free-text input
            // opens empty — the candidate is about to type a custom one.
            if (value && options.includes(value)) onChange("");
          } else {
            setOtherMode(false);
            onChange(next);
          }
        }}
        className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
      >
        <option value="">{placeholder ?? "Select…"}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {otherMode && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your own…"
          autoFocus
          className="mt-2 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
        />
      )}
    </div>
  );
}

const LEVEL_ORDER: EducationLevel[] = ["10th", "12th", "diploma", "ug", "pg", "mphil", "phd", "other"];
const byLevelOrder = (a: Education, b: Education) =>
 LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
