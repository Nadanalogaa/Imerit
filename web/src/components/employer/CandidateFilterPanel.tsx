import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Code2,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowDownWideNarrow,
  Bookmark,
} from "lucide-react";
import { useLocations } from "../../store/locations";
import type { CandidateProfile, EducationLevel } from "../../store/profile";
import type { Job } from "../../store/jobs";
import {
  activeFacetCount,
  emptyCandidateFilter,
  isDefaultFilter,
  matchesFilter,
  type CandidateFilterState,
  type CandidateSort,
} from "../../lib/employerFilters";

const EDUCATION_LABELS: Record<EducationLevel, string> = {
  "10th": "10th",
  "12th": "12th",
  diploma: "Diploma",
  ug: "UG",
  pg: "PG",
  mphil: "M.Phil",
  phd: "PhD",
  other: "Other",
};

const EDUCATION_ORDER: EducationLevel[] = [
  "10th", "12th", "diploma", "ug", "pg", "mphil", "phd", "other",
];

const SORT_OPTIONS: { id: CandidateSort; label: string; icon: React.ReactNode }[] = [
  { id: "skill_match", label: "Match %", icon: <Sparkles size={12} /> },
  { id: "recent", label: "Recent", icon: <ArrowDownWideNarrow size={12} /> },
  { id: "alphabetical", label: "A–Z", icon: <span className="text-[10px] font-bold">A→Z</span> },
];

interface Props {
  state: CandidateFilterState;
  onChange: (next: CandidateFilterState) => void;
  candidates: { user: { id: string }; profile: CandidateProfile }[];
  activeJobs: Job[];
  onSave?: () => void;
  onClose?: () => void;
}

/**
 * Employer-side candidate filter panel. Mirrors the mobile
 * `CandidateFilterSheet` — same facets, same interaction language — but
 * rendered as a persistent sidebar (web) instead of a bottom sheet
 * (mobile). Each section is a collapsible accordion so employers can hide
 * the ones they aren't touching.
 */
export function CandidateFilterPanel({
  state,
  onChange,
  candidates,
  activeJobs,
  onSave,
  onClose,
}: Props) {
  const districts = useLocations((s) => s.districts);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: true,
    near: activeJobs.length > 0,
    district: true,
    field: true,
    type: true,
    years: false,
    education: false,
    skills: true,
  });
  const toggleSection = (key: string) =>
    setOpenSections((o) => ({ ...o, [key]: !o[key] }));

  /** Districts that at least one visible candidate lives in or would work in. */
  const availableDistrictIds = useMemo(() => {
    const s = new Set<string>();
    for (const { profile } of candidates) {
      for (const id of profile.preferredDistricts ?? []) s.add(id);
      if (profile.currentDistrictId) s.add(profile.currentDistrictId);
    }
    return Array.from(s).sort();
  }, [candidates]);

  const matchCount = useMemo(() => {
    const nearJob = state.nearJobId ? activeJobs.find((j) => j.id === state.nearJobId) ?? null : null;
    return candidates.filter((c) => matchesFilter(c.profile, state, { districts, nearJob })).length;
  }, [candidates, state, districts, activeJobs]);

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 text-white">
            <Target size={14} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filters</h2>
            <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{matchCount} candidates match</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDefaultFilter(state) && (
            <button
              type="button"
              onClick={() => onChange(emptyCandidateFilter)}
              className="text-[11px] font-semibold text-rose-600 hover:underline dark:text-rose-400"
            >
              Reset
            </button>
          )}
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
        </div>
      </header>

      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
        <Facet
          icon={<ArrowDownWideNarrow size={14} className="text-sky-500" />}
          title="Sort by"
          open={openSections.sort}
          onToggle={() => toggleSection("sort")}
        >
          <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-950">
            {SORT_OPTIONS.map((opt) => {
              const selected = state.sort === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...state, sort: opt.id })}
                  className={[
                    "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition",
                    selected
                      ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                      : "text-zinc-600 hover:bg-white dark:text-zinc-400 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Facet>

        {activeJobs.length > 0 && (
          <Facet
            icon={<MapPin size={14} className="text-emerald-500" />}
            title="Near my job"
            open={openSections.near}
            onToggle={() => toggleSection("near")}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {activeJobs.map((job) => {
                  const selected = state.nearJobId === job.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...state,
                          nearJobId: selected ? undefined : job.id,
                          // Sensible default radius on first pick.
                          maxDistanceKm: selected ? undefined : state.maxDistanceKm ?? 25,
                        })
                      }
                      className={[
                        "inline-flex max-w-[220px] items-center gap-1 truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                        selected
                          ? "border-emerald-500 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
                      ].join(" ")}
                    >
                      <Briefcase size={10} />
                      <span className="truncate">{job.title}</span>
                    </button>
                  );
                })}
              </div>
              {state.nearJobId && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 dark:border-emerald-500/25 dark:bg-emerald-500/10">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    <span>Within {state.maxDistanceKm ?? 25} km</span>
                    <button
                      type="button"
                      onClick={() => onChange({ ...state, nearJobId: undefined, maxDistanceKm: undefined })}
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Clear
                    </button>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={state.maxDistanceKm ?? 25}
                    onChange={(e) => onChange({ ...state, maxDistanceKm: Number(e.target.value) })}
                    className="mt-2 w-full accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </Facet>
        )}

        <Facet
          icon={<MapPin size={14} className="text-rose-500" />}
          title="Preferred district"
          open={openSections.district}
          onToggle={() => toggleSection("district")}
        >
          {availableDistrictIds.length === 0 ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              No candidates have set a preferred district yet.
            </p>
          ) : (
            <div className="flex max-h-52 flex-wrap gap-1.5 overflow-y-auto pr-1">
              {availableDistrictIds.map((id) => {
                const d = districts.find((x) => x.id === id);
                if (!d) return null;
                const selected = state.districtIds.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...state,
                        districtIds: selected
                          ? state.districtIds.filter((x) => x !== id)
                          : [...state.districtIds, id],
                      })
                    }
                    className={[
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                      selected
                        ? "border-rose-500 bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/30"
                        : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
                    ].join(" ")}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          )}
        </Facet>

        <Facet
          icon={<Code2 size={14} className="text-sky-500" />}
          title="Field"
          open={openSections.field}
          onToggle={() => toggleSection("field")}
        >
          <div className="flex gap-1.5">
            {(["it", "non_it"] as const).map((f) => {
              const selected = state.field === f;
              const label = f === "it" ? "IT" : "Non-IT";
              const tone =
                f === "it"
                  ? "border-sky-500 bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sky-500/30"
                  : "border-amber-500 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/30";
              const idle =
                f === "it"
                  ? "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChange({ ...state, field: selected ? undefined : f })}
                  className={[
                    "flex-1 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
                    selected ? `${tone} shadow-sm` : idle,
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Facet>

        <Facet
          icon={<Briefcase size={14} className="text-violet-500" />}
          title="Candidate type"
          open={openSections.type}
          onToggle={() => toggleSection("type")}
        >
          <div className="flex gap-1.5">
            {(["fresher", "experienced"] as const).map((t) => {
              const selected = state.candidateType === t;
              const label = t === "fresher" ? "Fresher" : "Experienced";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...state, candidateType: selected ? undefined : t })}
                  className={[
                    "flex-1 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition",
                    selected
                      ? "border-violet-500 bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-sm shadow-violet-500/30"
                      : "border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Facet>

        {state.candidateType === "experienced" && (
          <Facet
            icon={<Briefcase size={14} className="text-violet-500" />}
            title="Years of experience"
            open={openSections.years || true}
            onToggle={() => toggleSection("years")}
          >
            <div className="grid grid-cols-2 gap-2">
              <NumField
                label="Min"
                value={state.yearsMin}
                onChange={(v) => onChange({ ...state, yearsMin: v })}
              />
              <NumField
                label="Max"
                value={state.yearsMax}
                onChange={(v) => onChange({ ...state, yearsMax: v })}
              />
            </div>
          </Facet>
        )}

        <Facet
          icon={<GraduationCap size={14} className="text-orange-500" />}
          title="Education level"
          open={openSections.education}
          onToggle={() => toggleSection("education")}
        >
          <div className="flex flex-wrap gap-1.5">
            {EDUCATION_ORDER.map((lvl) => {
              const selected = state.educationLevels.includes(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...state,
                      educationLevels: selected
                        ? state.educationLevels.filter((x) => x !== lvl)
                        : [...state.educationLevels, lvl],
                    })
                  }
                  className={[
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                    selected
                      ? "border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm shadow-orange-500/30"
                      : "border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-300",
                  ].join(" ")}
                >
                  {EDUCATION_LABELS[lvl]}
                </button>
              );
            })}
          </div>
        </Facet>

        <Facet
          icon={<Sparkles size={14} className="text-indigo-500" />}
          title="Skills required"
          open={openSections.skills}
          onToggle={() => toggleSection("skills")}
        >
          <SkillsInput
            skills={state.skills}
            onChange={(skills) => onChange({ ...state, skills })}
          />
          <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
            Candidates must have ALL of these. Case-insensitive fuzzy match.
          </p>
        </Facet>
      </div>

      {onSave && !isDefaultFilter(state) && (
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-500 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-500/10"
          >
            <Bookmark size={13} />
            Save this search ({activeFacetCount(state)} facet{activeFacetCount(state) === 1 ? "" : "s"})
          </button>
        </div>
      )}
    </aside>
  );
}

/* ------------------------------- primitives ------------------------------ */

function Facet({
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
    <div className="border-b border-zinc-100 py-2 last:border-b-0 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp size={14} className="text-zinc-400" />
        ) : (
          <ChevronDown size={14} className="text-zinc-400" />
        )}
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

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <input
        type="number"
        min={0}
        max={40}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        placeholder="—"
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </label>
  );
}

function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) return;
    onChange([...skills, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
        {skills.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/30"
          >
            {s}
            <button
              type="button"
              onClick={() => onChange(skills.filter((x) => x !== s))}
              className="hover:opacity-75"
              aria-label={`Remove ${s}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={skills.length === 0 ? "Type a skill + Enter" : "Add another…"}
          className="min-w-[110px] flex-1 bg-transparent text-[12px] placeholder:text-zinc-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
