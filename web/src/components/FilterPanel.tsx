import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MapPin, Briefcase, Code2, Clock, GraduationCap, X } from "lucide-react";
import { useLocations } from "../store/locations";
import type { JobField, JobExperience, JobType } from "../store/jobs";
import { Checkbox } from "./Checkbox";

export type PostedBucket = "any" | "24h" | "7d" | "30d";

export interface FacetCounts {
  district: Record<string, number>;
  taluk: Record<string, number>;
  field: Record<JobField, number>;
  type: Record<JobType, number>;
  experience: Record<JobExperience, number>;
  posted: Record<PostedBucket, number>;
}

export interface FilterState {
  districts: string[];
  taluks: string[];
  field: JobField | "all";
  types: JobType[];
  experience: JobExperience | "all";
  posted: PostedBucket;
}

interface Props {
  state: FilterState;
  counts: FacetCounts;
  onChange: (next: FilterState) => void;
  onClose?: () => void; // mobile drawer close
}

const TYPE_LABELS: Record<JobType, string> = {
  internship_training: "Internship / Training",
  apprentice: "Apprentice",
  full_time: "Full-time",
  part_time: "Part-time",
  gig_delivery: "Gig (Delivery)",
  contract: "Contract",
  consultant: "Consultant",
  freelancer: "Freelancer",
};

const POSTED_LABELS: Record<PostedBucket, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  any: "Anytime",
};

const TYPE_ORDER: JobType[] = [
  "full_time",
  "part_time",
  "internship_training",
  "apprentice",
  "contract",
  "consultant",
  "freelancer",
  "gig_delivery",
];
const POSTED_ORDER: PostedBucket[] = ["24h", "7d", "30d", "any"];

export function FilterPanel({ state, counts, onChange, onClose }: Props) {
  const districts = useLocations((s) => s.districts);
  const taluksOf = useLocations((s) => s.taluksOf);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    location: true,
    field: true,
    type: true,
    experience: true,
    posted: false,
  });
  const toggleSection = (key: string) => setOpenSections((o) => ({ ...o, [key]: !o[key] }));

  const toggleDistrict = (id: string) => {
    const next = state.districts.includes(id)
      ? state.districts.filter((d) => d !== id)
      : [...state.districts, id];
    // When a district is unticked, drop any of its taluks too.
    const validTaluks = next.length === 0
      ? []
      : state.taluks.filter((t) => next.some((d) => taluksOf(d).find((tk) => tk.id === t)));
    onChange({ ...state, districts: next, taluks: validTaluks });
  };

  const toggleTaluk = (id: string) => {
    onChange({
      ...state,
      taluks: state.taluks.includes(id)
        ? state.taluks.filter((t) => t !== id)
        : [...state.taluks, id],
    });
  };

  const toggleType = (id: JobType) => {
    onChange({
      ...state,
      types: state.types.includes(id) ? state.types.filter((t) => t !== id) : [...state.types, id],
    });
  };

  // Districts sorted by count desc so the most populated rise to the top.
  const sortedDistricts = useMemo(() => {
    return [...districts].sort((a, b) => (counts.district[b.id] ?? 0) - (counts.district[a.id] ?? 0));
  }, [districts, counts.district]);

  // Taluk pool: only taluks of the selected districts. If nothing's picked
  // we hide the section entirely so the panel doesn't drown in 200+ rows.
  const taluksInPlay = useMemo(() => {
    if (state.districts.length === 0) return [];
    return state.districts.flatMap((d) =>
      taluksOf(d).map((t) => ({ ...t, districtName: districts.find((dx) => dx.id === d)?.name ?? "" })),
    );
  }, [state.districts, districts, taluksOf]);

  return (
    <aside className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Filters</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Close filters"
          >
            <X size={15} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <FacetGroup
          icon={<MapPin size={14} className="text-rose-500" />}
          title="District"
          open={openSections.location}
          onToggle={() => toggleSection("location")}
        >
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {sortedDistricts.map((d) => {
              const n = counts.district[d.id] ?? 0;
              const checked = state.districts.includes(d.id);
              return (
                <FacetRow
                  key={d.id}
                  label={d.name}
                  count={n}
                  checked={checked}
                  onChange={() => toggleDistrict(d.id)}
                  disabled={n === 0 && !checked}
                />
              );
            })}
          </div>
        </FacetGroup>

        {/* Taluks — only when at least one district is selected */}
        {taluksInPlay.length > 0 && (
          <FacetGroup
            icon={<MapPin size={14} className="text-rose-400" />}
            title={`Taluk in ${state.districts.length === 1 ? districts.find((d) => d.id === state.districts[0])?.name : `${state.districts.length} districts`}`}
            open
            onToggle={() => {}}
          >
            <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
              {taluksInPlay.map((t) => {
                const n = counts.taluk[t.id] ?? 0;
                const checked = state.taluks.includes(t.id);
                return (
                  <FacetRow
                    key={t.id}
                    label={t.name}
                    count={n}
                    checked={checked}
                    onChange={() => toggleTaluk(t.id)}
                    disabled={n === 0 && !checked}
                  />
                );
              })}
            </div>
          </FacetGroup>
        )}

        <FacetGroup
          icon={<Code2 size={14} className="text-sky-500" />}
          title="Field"
          open={openSections.field}
          onToggle={() => toggleSection("field")}
        >
          <div className="space-y-1">
            <RadioRow
              label="All fields"
              count={(counts.field.it ?? 0) + (counts.field.non_it ?? 0)}
              checked={state.field === "all"}
              onChange={() => onChange({ ...state, field: "all" })}
            />
            <RadioRow
              label="IT"
              count={counts.field.it ?? 0}
              checked={state.field === "it"}
              onChange={() => onChange({ ...state, field: "it" })}
            />
            <RadioRow
              label="Non-IT"
              count={counts.field.non_it ?? 0}
              checked={state.field === "non_it"}
              onChange={() => onChange({ ...state, field: "non_it" })}
            />
          </div>
        </FacetGroup>

        <FacetGroup
          icon={<Briefcase size={14} className="text-violet-500" />}
          title="Job type"
          open={openSections.type}
          onToggle={() => toggleSection("type")}
        >
          <div className="space-y-1">
            {TYPE_ORDER.map((t) => {
              const n = counts.type[t] ?? 0;
              const checked = state.types.includes(t);
              return (
                <FacetRow
                  key={t}
                  label={TYPE_LABELS[t]}
                  count={n}
                  checked={checked}
                  onChange={() => toggleType(t)}
                  disabled={n === 0 && !checked}
                />
              );
            })}
          </div>
        </FacetGroup>

        <FacetGroup
          icon={<GraduationCap size={14} className="text-emerald-500" />}
          title="Experience"
          open={openSections.experience}
          onToggle={() => toggleSection("experience")}
        >
          <div className="space-y-1">
            <RadioRow
              label="Any"
              count={(counts.experience.fresher ?? 0) + (counts.experience.experienced ?? 0) + (counts.experience.any ?? 0)}
              checked={state.experience === "all"}
              onChange={() => onChange({ ...state, experience: "all" })}
            />
            <RadioRow
              label="Fresher"
              count={counts.experience.fresher ?? 0}
              checked={state.experience === "fresher"}
              onChange={() => onChange({ ...state, experience: "fresher" })}
            />
            <RadioRow
              label="Experienced"
              count={counts.experience.experienced ?? 0}
              checked={state.experience === "experienced"}
              onChange={() => onChange({ ...state, experience: "experienced" })}
            />
          </div>
        </FacetGroup>

        <FacetGroup
          icon={<Clock size={14} className="text-amber-500" />}
          title="Posted"
          open={openSections.posted}
          onToggle={() => toggleSection("posted")}
        >
          <div className="space-y-1">
            {POSTED_ORDER.map((p) => (
              <RadioRow
                key={p}
                label={POSTED_LABELS[p]}
                count={counts.posted[p] ?? 0}
                checked={state.posted === p}
                onChange={() => onChange({ ...state, posted: p })}
              />
            ))}
          </div>
        </FacetGroup>
      </div>
    </aside>
  );
}

function FacetGroup({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-b-0 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {icon}
          {title}
        </span>
        {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FacetRow({
  label,
  count,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={[
        "flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
      ].join(" ")}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <Checkbox checked={checked} onChange={() => !disabled && onChange()} size="sm" disabled={disabled} />
        <span className="truncate text-[13px] text-zinc-700 dark:text-zinc-300">{label}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
        {count}
      </span>
    </label>
  );
}

function RadioRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      onClick={onChange}
      className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <span className="inline-flex items-center gap-2">
        <span
          className={[
            "relative flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition",
            checked ? "border-brand-500" : "border-zinc-300 dark:border-zinc-600",
          ].join(" ")}
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
        </span>
        <span className="text-[13px] text-zinc-700 dark:text-zinc-300">{label}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
        {count}
      </span>
    </label>
  );
}
