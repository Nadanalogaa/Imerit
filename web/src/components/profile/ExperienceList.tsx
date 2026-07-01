import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, Link2, Briefcase } from "lucide-react";
import type { Experience, ExperienceProject } from "../../store/profile";
import { Checkbox } from "../Checkbox";
import { ChipInput } from "./ChipInput";

interface Props {
 value: Experience[];
 onChange: (next: Experience[]) => void;
}

export function ExperienceList({ value, onChange }: Props) {
 const [openProjects, setOpenProjects] = useState<Record<number, boolean>>({});

 const add = () => {
 onChange([...value, { company: "", role: "", fromDate: "", toDate: null, projects: [] }]);
 };

 const update = (i: number, patch: Partial<Experience>) => {
 onChange(value.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
 };

 const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
 const toggleProjects = (i: number) => setOpenProjects((o) => ({ ...o, [i]: !o[i] }));

 return (
 <div className="flex flex-col gap-3">
 <AnimatePresence>
 {value.map((exp, i) => (
 <motion.div
 key={i}
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="rounded-2xl bg-white p-4 dark:bg-zinc-900"
 >
 <div className="mb-3 flex items-center justify-between">
 <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Experience {i + 1}
 </span>
 <button
 type="button"
 onClick={() => remove(i)}
 className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-zinc-700 dark:hover:bg-rose-500/10"
 >
 <Trash2 size={11} /> Remove
 </button>
 </div>

 <div className="grid gap-3 sm:grid-cols-2">
 <Field
 label="Company"
 value={exp.company}
 onChange={(v) => update(i, { company: v })}
 placeholder="e.g. Zoho"
 />
 <Field
 label="Role"
 value={exp.role}
 onChange={(v) => update(i, { role: v })}
 placeholder="e.g. Software Engineer"
 />
 <Field
 label="From"
 type="month"
 value={exp.fromDate}
 onChange={(v) => update(i, { fromDate: v })}
 />
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 To
 </label>
 <div className="flex items-center gap-2">
 <input
 type="month"
 value={exp.toDate ?? ""}
 disabled={exp.toDate === null}
 onChange={(e) => update(i, { toDate: e.target.value })}
 className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
 />
 <Checkbox
 checked={exp.toDate === null}
 onChange={(checked) => update(i, { toDate: checked ? null : "" })}
 label="Present"
 size="sm"
 />
 </div>
 </div>
 </div>

 {/* Projects accordion — optional showcase per company */}
 <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50">
 <button
 type="button"
 onClick={() => toggleProjects(i)}
 className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
 >
 <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 <Briefcase size={13} />
 Projects at this company
 <span className="text-[11px] font-normal text-zinc-500">
 ({exp.projects?.length ?? 0} · optional)
 </span>
 </span>
 {openProjects[i] ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
 </button>
 <AnimatePresence initial={false}>
 {openProjects[i] && (
 <motion.div
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: "auto", opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="overflow-hidden"
 >
 <div className="px-3.5 pb-3.5 pt-1">
 <ProjectList
 value={exp.projects ?? []}
 onChange={(p) => update(i, { projects: p })}
 />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>

 <button
 type="button"
 onClick={add}
 className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
 >
 <Plus size={16} /> Add a company
 </button>
 </div>
 );
}

function Field({
 label,
 value,
 onChange,
 placeholder,
 type = "text",
}: {
 label: string;
 value: string;
 onChange: (v: string) => void;
 placeholder?: string;
 type?: string;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">{label}</label>
 <input
 type={type}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 placeholder={placeholder}
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 </div>
 );
}

function ProjectList({
 value,
 onChange,
}: {
 value: ExperienceProject[];
 onChange: (next: ExperienceProject[]) => void;
}) {
 const add = () => onChange([...value, { name: "", description: "", skills: [], showcaseUrl: "" }]);
 const update = (i: number, patch: Partial<ExperienceProject>) =>
 onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
 const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

 if (value.length === 0) {
 return (
 <button
 type="button"
 onClick={add}
 className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
 >
 <Plus size={12} /> Add a project
 </button>
 );
 }

 return (
 <div className="flex flex-col gap-3">
 {value.map((proj, i) => (
 <div key={i} className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
 <div className="mb-2 flex items-center justify-between">
 <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Project {i + 1}</span>
 <button
 type="button"
 onClick={() => remove(i)}
 className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
 >
 <Trash2 size={11} /> Remove
 </button>
 </div>
 <div className="grid gap-3 sm:grid-cols-2">
 <Field
 label="Project name"
 value={proj.name}
 onChange={(v) => update(i, { name: v })}
 placeholder="e.g. Realtime telemetry dashboard"
 />
 <div>
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 Showcase link <span className="font-normal text-zinc-500">(optional)</span>
 </label>
 <div className="relative">
 <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 type="url"
 value={proj.showcaseUrl ?? ""}
 onChange={(e) => update(i, { showcaseUrl: e.target.value })}
 placeholder="https://github.com/... or case study URL"
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 </div>
 </div>
 <div className="sm:col-span-2">
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 Brief description <span className="font-normal text-zinc-500">(optional)</span>
 </label>
 <textarea
 value={proj.description ?? ""}
 onChange={(e) => update(i, { description: e.target.value })}
 rows={2}
 placeholder="What problem it solved, your role, impact…"
 className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 </div>
 <div className="sm:col-span-2">
 <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 Skills used <span className="font-normal text-zinc-500">(optional)</span>
 </label>
 <ChipInput
 value={proj.skills ?? []}
 onChange={(v) => update(i, { skills: v })}
 max={10}
 placeholder="Type a skill and press Enter"
 />
 </div>
 </div>
 </div>
 ))}
 <button
 type="button"
 onClick={add}
 className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
 >
 <Plus size={12} /> Add another project
 </button>
 </div>
 );
}
