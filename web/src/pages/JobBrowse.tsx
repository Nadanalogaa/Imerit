import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  Code2,
  Building2,
  Sparkles,
  Clock,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  useJobs,
  type Job,
  type JobField,
  type JobExperience,
  FIELD_LABEL,
  TYPE_LABEL,
  relativeTime,
} from "../store/jobs";
import { useAuth } from "../store/auth";
import { useProfile } from "../store/profile";
import { matchScore, jobDistanceKm, BAND_COLORS, type MatchResult } from "../lib/matcher";
import { distanceKm, formatDistance } from "../lib/distance";
import { Navigation, Home, Target } from "lucide-react";
import { MapListLayout, type MapListItem } from "../components/MapListLayout";

type FieldFilter = "all" | JobField;
type ExpFilter = "all" | JobExperience;

export function JobBrowse() {
  const jobs = useJobs((s) => s.jobs);
  const user = useAuth((s) => s.currentUser);
  const profilesMap = useProfile((s) => s.byUser);
  const profile = user ? profilesMap[user.id] : undefined;

  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState<FieldFilter>("all");
  const [expFilter, setExpFilter] = useState<ExpFilter>("all");
  const [bestOnly, setBestOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number>(9999); // default "Any"
  const [sortBy, setSortBy] = useState<"smart" | "nearest" | "newest">("smart");

  // Anchor: which of candidate's locations to use for distance
  const hasCurrent = profile?.currentLat != null && profile?.currentLng != null;
  const hasPreferred = profile?.preferredLat != null && profile?.preferredLng != null;
  const [anchor, setAnchor] = useState<"current" | "preferred">(hasCurrent ? "current" : "preferred");

  const anchorCoords =
    anchor === "preferred"
      ? hasPreferred
        ? { lat: profile!.preferredLat!, lng: profile!.preferredLng! }
        : null
      : hasCurrent
        ? { lat: profile!.currentLat!, lng: profile!.currentLng! }
        : null;

  const filtered = useMemo(() => {
    const base = jobs.filter((j) => {
      if (fieldFilter !== "all" && j.field !== fieldFilter) return false;
      if (expFilter !== "all" && j.experience !== expFilter && j.experience !== "any") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${j.title} ${j.employerName} ${j.description} ${j.skills.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const withMatch = base.map((j) => {
      const result = profile ? matchScore(j, profile) : null;
      const dist = anchorCoords && j.lat != null && j.lng != null
        ? distanceKm({ lat: j.lat, lng: j.lng }, anchorCoords)
        : (profile ? jobDistanceKm(j, profile) : null);
      return { job: j, result, distance: dist };
    });

    // Radius filter
    const radiusFiltered = anchorCoords && radiusKm < 9999
      ? withMatch.filter((x) => x.distance != null && x.distance <= radiusKm)
      : withMatch;

    const bestFiltered = bestOnly
      ? radiusFiltered.filter((x) => x.result && x.result.score >= 70)
      : radiusFiltered;

    // Sort
    const sorted = [...bestFiltered];
    if (sortBy === "nearest" && anchorCoords) {
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.job.postedAt).getTime() - new Date(a.job.postedAt).getTime());
    } else if (profile) {
      // smart: match score primary, distance tiebreaker
      sorted.sort((a, b) => {
        const ds = (b.result?.score ?? 0) - (a.result?.score ?? 0);
        if (ds !== 0) return ds;
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      });
    }
    return sorted;
  }, [jobs, fieldFilter, expFilter, search, profile, bestOnly, anchorCoords, radiusKm, sortBy]);

  const radiusOptions = [
    { value: 5, label: "5 km" },
    { value: 10, label: "10 km" },
    { value: 25, label: "25 km" },
    { value: 50, label: "50 km" },
    { value: 100, label: "100 km" },
    { value: 250, label: "250 km" },
    { value: 9999, label: "Any" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Browse jobs
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Openings across Tamil Nadu
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {filtered.length} {filtered.length === 1 ? "job" : "jobs"} match your filters
          </p>
        </header>

        {/* Dual-anchor tabs (only if both anchors set) */}
        {hasCurrent && hasPreferred && (
          <div className="mb-4 flex gap-2 rounded-2xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setAnchor("current")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                anchor === "current"
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              <Home size={13} /> Near home
            </button>
            <button
              onClick={() => setAnchor("preferred")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition",
                anchor === "preferred"
                  ? "bg-gradient-to-r from-sky-500 to-sky-700 text-white shadow-md shadow-sky-500/30"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              <Target size={13} /> Near preferred
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 grid gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, company, skill..."
              className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <Select
            value={fieldFilter}
            onChange={(v) => setFieldFilter(v as FieldFilter)}
            options={[
              { id: "all", label: "All fields" },
              { id: "it", label: "IT" },
              { id: "non_it", label: "Non-IT" },
            ]}
          />
          <Select
            value={expFilter}
            onChange={(v) => setExpFilter(v as ExpFilter)}
            options={[
              { id: "all", label: "Any experience" },
              { id: "fresher", label: "Fresher" },
              { id: "experienced", label: "Experienced" },
            ]}
          />
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v as typeof sortBy)}
            options={[
              { id: "smart", label: profile ? "Best match" : "Newest" },
              ...(anchorCoords ? [{ id: "nearest", label: "Nearest first" }] : []),
              { id: "newest", label: "Newest" },
            ]}
          />
        </div>

        {/* Radius + view + best-match toggle */}
        {(profile || anchorCoords) && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/5">
            <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              {anchorCoords ? (
                <span>Showing jobs near your {anchor === "current" ? "home" : "preferred location"}</span>
              ) : (
                <span>Sorted by match score</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {anchorCoords && (
                <div className="flex items-center gap-2 text-xs">
                  <Navigation size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Within</span>
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-bold text-emerald-700 focus:outline-none dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-400"
                  >
                    {radiusOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                <input type="checkbox" checked={bestOnly} onChange={(e) => setBestOnly(e.target.checked)} className="h-4 w-4 rounded accent-emerald-500" />
                Best matches only
              </label>
            </div>
          </div>
        )}

        {/* Results: list + map */}
        <MapListLayout
          markerTone="brand"
          anchor={
            anchorCoords
              ? {
                  lat: anchorCoords.lat,
                  lng: anchorCoords.lng,
                  label: anchor === "current" ? "Your home" : "Your preferred location",
                }
              : null
          }
          radiusKm={anchorCoords && radiusKm < 9999 ? radiusKm : null}
          items={filtered.map(({ job, result, distance }, i): MapListItem => ({
            id: job.id,
            lat: job.lat,
            lng: job.lng,
            listElement: (
              <JobCard
                job={job}
                matchResult={result ?? undefined}
                distance={distance}
                delay={Math.min(i, 8) * 0.03}
              />
            ),
            popupElement: <JobPopup job={job} matchResult={result ?? undefined} distance={distance} />,
          }))}
          emptyState={
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <Search size={32} className="text-zinc-400" />
              <p className="mt-3 text-sm font-semibold">No jobs match your filters</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Try widening your search or clearing some filters.
              </p>
            </div>
          }
        />
      </main>
    </div>
  );
}

function JobPopup({
  job,
  matchResult,
  distance,
}: {
  job: Job;
  matchResult?: MatchResult;
  distance?: number | null;
}) {
  return (
    <Link
      to={`/candidate/jobs/${job.id}`}
      className="block w-[240px] p-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{job.title}</h3>
          <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">{job.employerName}</p>
        </div>
        {matchResult && (
          <div className={["shrink-0 rounded-lg px-1.5 py-0.5 ring-1", BAND_COLORS[matchResult.band].bg, BAND_COLORS[matchResult.band].ring].join(" ")}>
            <span className={["text-[11px] font-bold", BAND_COLORS[matchResult.band].text].join(" ")}>{matchResult.score}%</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <MapPin size={9} /> {job.location}
        </span>
        {distance != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Navigation size={9} /> {formatDistance(distance)}
          </span>
        )}
      </div>
    </Link>
  );
}

function JobCard({ job, matchResult, distance, delay }: { job: Job; matchResult?: MatchResult; distance?: number | null; delay: number; compact?: boolean }) {
  const initials = job.employerName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const isFresher = job.experience === "fresher" || job.experience === "any";
  const isInternship = job.type === "internship";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        to={`/candidate/jobs/${job.id}`}
        className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-brand-500/40"
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-md",
              job.field === "it"
                ? "bg-gradient-to-br from-sky-500 to-sky-700 shadow-sky-500/30"
                : "bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-500/30",
            ].join(" ")}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {job.title}
            </h2>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
              {job.employerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {matchResult && (
              <div className={["flex flex-col items-center rounded-xl px-2 py-1 ring-1", BAND_COLORS[matchResult.band].bg, BAND_COLORS[matchResult.band].ring].join(" ")}>
                <span className={["text-sm font-bold leading-none", BAND_COLORS[matchResult.band].text].join(" ")}>{matchResult.score}%</span>
                <span className={["text-[8px] font-semibold uppercase tracking-wider leading-tight", BAND_COLORS[matchResult.band].text].join(" ")}>match</span>
              </div>
            )}
            {distance != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <Navigation size={9} />
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold">
          <Pill icon={<MapPin size={10} />} color="zinc">{job.location}</Pill>
          <Pill icon={job.field === "it" ? <Code2 size={10} /> : <Building2 size={10} />} color={job.field === "it" ? "sky" : "amber"}>
            {FIELD_LABEL[job.field]}
          </Pill>
          <Pill icon={<Briefcase size={10} />} color="violet">{TYPE_LABEL[job.type]}</Pill>
          {isFresher && !isInternship && <Pill icon={<Sparkles size={10} />} color="emerald">Freshers welcome</Pill>}
          {isInternship && <Pill icon={<Sparkles size={10} />} color="rose">Internship</Pill>}
        </div>

        <p className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
          {job.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 text-[11px]">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {job.salaryRange ?? "Competitive"}
          </span>
          <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <Clock size={11} /> {relativeTime(job.postedAt)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const PILL_COLORS = {
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
} as const;

function Pill({
  icon,
  color,
  children,
}: {
  icon?: React.ReactNode;
  color: keyof typeof PILL_COLORS;
  children: React.ReactNode;
}) {
  return (
    <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", PILL_COLORS[color]].join(" ")}>
      {icon}
      {children}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
