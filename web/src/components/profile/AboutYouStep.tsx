import { motion, AnimatePresence } from "framer-motion";
import {
 GraduationCap,
 Briefcase,
 Code2,
 HandCoins,
 Sparkles,
 Link2,
 Plus,
 Trash2,
} from "lucide-react";
import { SegmentedToggle } from "./SegmentedToggle";
import { ChipInput } from "./ChipInput";
import { ExperienceList } from "./ExperienceList";
import type {
 CandidateType,
 Field as FieldKind,
 Experience,
 ProfileLink,
} from "../../store/profile";

const IT_SPECIALIZATIONS = [
 "Artificial Intelligence",
 "Cyber Security",
 "Networking",
 "Telecom",
 "Web Development",
 "Embedded Systems",
 "Semiconductor",
 "Mobile Development",
 "Cloud / DevOps",
 "Data Science",
];

const NON_IT_DEPARTMENTS = [
 "HR",
 "Finance",
 "Sales",
 "Marketing",
 "Purchase",
 "Supply Chain Management",
 "BPO",
 "Voice Process",
 "Non-Voice Process",
 "Operations",
 "Customer Service",
 "Administration",
];

interface Props {
 type?: CandidateType;
 onType: (t: CandidateType) => void;

 // fresher
 internOrJob?: "intern" | "job";
 onInternOrJob: (v: "intern" | "job") => void;
 field?: FieldKind;
 onField: (v: FieldKind) => void;
 itSpecialization?: string;
 onItSpec: (v: string | undefined) => void;
 itLanguages: string[];
 onItLanguages: (v: string[]) => void;
 nonItDepartments: string[];
 onNonItDepartments: (v: string[]) => void;

 // experienced
 yearsOfExperience?: number;
 onYears: (v: number | undefined) => void;
 topSkills: string[];
 onTopSkills: (v: string[]) => void;
 experiences: Experience[];
 onExperiences: (v: Experience[]) => void;

 // showcase links (optional, used by both fresher + experienced)
 links: ProfileLink[];
 onLinks: (v: ProfileLink[]) => void;

 errors: Record<string, string>;
}

export function AboutYouStep(p: Props) {
 return (
 <div className="flex flex-col gap-6">
 <SegmentedToggle<CandidateType>
 large
 value={p.type}
 onChange={p.onType}
 options={[
 { id: "fresher", label: "I'm a Fresher", icon: <GraduationCap size={18} /> },
 { id: "experienced", label: "I'm Experienced", icon: <Briefcase size={18} /> },
 ]}
 />

 <AnimatePresence mode="wait">
 {p.type === "fresher" && (
 <motion.div
 key="fresher"
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -14 }}
 transition={{ duration: 0.25, ease: "easeOut" }}
 className="flex flex-col gap-6"
 >
 <Group label="What are you looking for?" icon={<HandCoins size={16} className="text-emerald-600 dark:text-emerald-400" />}>
 <SegmentedToggle<"intern" | "job">
 value={p.internOrJob}
 onChange={p.onInternOrJob}
 options={[
 { id: "intern", label: "Internship / Training" },
 { id: "job", label: "Direct Job" },
 ]}
 />
 </Group>

 <Group label="Which field interests you?" icon={<Sparkles size={16} className="text-violet-600 dark:text-violet-400" />}>
 <SegmentedToggle<FieldKind>
 value={p.field}
 onChange={p.onField}
 options={[
 { id: "it", label: "IT", icon: <Code2 size={14} /> },
 { id: "non_it", label: "Non-IT", icon: <Briefcase size={14} /> },
 ]}
 />
 </Group>

 <AnimatePresence mode="wait">
 {p.field === "it" && (
 <motion.div
 key="it"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.22 }}
 className="flex flex-col gap-5"
 >
 <Group label="Pick your IT specialization" icon={<Code2 size={16} className="text-sky-600 dark:text-sky-400" />}>
 <ChipInput
 value={p.itSpecialization ? [p.itSpecialization] : []}
 onChange={(arr) => p.onItSpec(arr[arr.length - 1])}
 max={1}
 placeholder="Pick one or type your own"
 suggestions={IT_SPECIALIZATIONS}
 hint="Choose the area you want to grow in."
 />
 {p.errors.itSpecialization && (
 <ErrorBanner message={p.errors.itSpecialization} />
 )}
 </Group>

 <Group label="Languages / tools you're skilled in" icon={<Code2 size={16} className="text-sky-600 dark:text-sky-400" />}>
 <ChipInput
 value={p.itLanguages}
 onChange={p.onItLanguages}
 max={5}
 placeholder="e.g. Python, React, SQL"
 hint="Add up to 5 languages or tools you can use in interviews."
 />
 {p.errors.itLanguages && <ErrorBanner message={p.errors.itLanguages} />}
 </Group>
 </motion.div>
 )}

 {p.field === "non_it" && (
 <motion.div
 key="non-it"
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.22 }}
 >
 <Group label="Top 3 departments you'd like to work in" icon={<Briefcase size={16} className="text-amber-600 dark:text-amber-400" />}>
 <ChipInput
 value={p.nonItDepartments}
 onChange={p.onNonItDepartments}
 max={3}
 placeholder="Pick from suggestions or type your own"
 suggestions={NON_IT_DEPARTMENTS}
 hint="Pick the top 3 in order of priority."
 />
 {p.errors.nonItDepartments && (
 <ErrorBanner message={p.errors.nonItDepartments} />
 )}
 </Group>
 </motion.div>
 )}
 </AnimatePresence>

 <Group label="Links & profiles" icon={<Link2 size={16} className="text-sky-600 dark:text-sky-400" />}>
 <LinksSection value={p.links} onChange={p.onLinks} />
 </Group>
 </motion.div>
 )}

 {p.type === "experienced" && (
 <motion.div
 key="experienced"
 initial={{ opacity: 0, y: 14 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -14 }}
 transition={{ duration: 0.25, ease: "easeOut" }}
 className="flex flex-col gap-6"
 >
 <Group label="Years of experience" icon={<Briefcase size={16} className="text-brand-600 dark:text-brand-400" />}>
 <div className="flex items-center gap-2">
 <input
 type="number"
 min={0}
 max={50}
 value={p.yearsOfExperience ?? ""}
 onChange={(e) => p.onYears(e.target.value === "" ? undefined : Number(e.target.value))}
 placeholder="e.g. 4"
 className="h-11 w-32 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 <span className="text-sm text-zinc-500 dark:text-zinc-400">years</span>
 </div>
 {p.errors.years && <ErrorBanner message={p.errors.years} />}
 </Group>

 <Group label="Your top 5 skills" icon={<Sparkles size={16} className="text-violet-600 dark:text-violet-400" />}>
 <ChipInput
 value={p.topSkills}
 onChange={p.onTopSkills}
 max={5}
 placeholder="e.g. Backend, Node.js, AWS"
 hint="Add the 5 skills that best describe your current expertise."
 />
 {p.errors.topSkills && <ErrorBanner message={p.errors.topSkills} />}
 </Group>

 <Group label="Companies & work periods" icon={<Briefcase size={16} className="text-sky-600 dark:text-sky-400" />}>
 <ExperienceList value={p.experiences} onChange={p.onExperiences} />
 {p.errors.experiences && <ErrorBanner message={p.errors.experiences} />}
 </Group>

 <Group label="Links & profiles" icon={<Link2 size={16} className="text-sky-600 dark:text-sky-400" />}>
 <LinksSection value={p.links} onChange={p.onLinks} />
 </Group>
 </motion.div>
 )}
 </AnimatePresence>

 {!p.type && (
 <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
 Pick Fresher or Experienced above to continue.
 </div>
 )}

 {p.errors.type && <ErrorBanner message={p.errors.type} />}
 </div>
 );
}

function Group({
 label,
 icon,
 children,
}: {
 label: string;
 icon: React.ReactNode;
 children: React.ReactNode;
}) {
 return (
 <div>
 <div className="mb-2 flex items-center gap-2">
 {icon}
 <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</label>
 </div>
 {children}
 </div>
 );
}

function ErrorBanner({ message }: { message: string }) {
 return (
 <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {message}
 </p>
 );
}

const LINK_PRESETS = ["LinkedIn", "Portfolio", "GitHub", "Behance", "Dribbble", "Twitter / X", "Other"];

function LinksSection({ value, onChange }: { value: ProfileLink[]; onChange: (v: ProfileLink[]) => void }) {
 const rows = value.length ? value : [{ label: "LinkedIn", url: "" }];
 const update = (i: number, patch: Partial<ProfileLink>) => {
 const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
 onChange(next.filter((r) => r.url.trim() || r === next[i]));
 };
 const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i).filter((r) => r.url.trim()));
 const add = () => onChange([...rows, { label: "Other", url: "" }]);
 const canAddMore = rows.length < 10;

 return (
 <div className="flex flex-col gap-2">
 <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
 Optional — add up to 10 links employers can click. LinkedIn, portfolio, GitHub, anything.
 </p>
 {rows.map((row, i) => (
 <div key={i} className="flex flex-col gap-2 sm:flex-row">
 <div className="sm:w-44">
 <select
 value={LINK_PRESETS.includes(row.label) ? row.label : "Other"}
 onChange={(e) => update(i, { label: e.target.value === "Other" ? row.label || "Other" : e.target.value })}
 className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 >
 {LINK_PRESETS.map((l) => (
 <option key={l} value={l}>{l}</option>
 ))}
 </select>
 </div>
 <input
 type="url"
 value={row.url}
 onChange={(e) => update(i, { url: e.target.value })}
 placeholder="https://..."
 className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
 />
 <button
 type="button"
 onClick={() => remove(i)}
 className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
 aria-label="Remove link"
 >
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 {canAddMore && (
 <button
 type="button"
 onClick={add}
 className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
 >
 <Plus size={12} /> Add another link
 </button>
 )}
 </div>
 );
}
