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
 SlidersHorizontal,
 X,
 Bookmark,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
 useJobs,
 type Job,
 type JobType,
 FIELD_LABEL,
 TYPE_LABEL,
 relativeTime,
} from "../store/jobs";
import { useAuth } from "../store/auth";
import { useApplications } from "../store/applications";
import { useProfile } from "../store/profile";
import { useLocations } from "../store/locations";
import { matchScore, jobDistanceKm, BAND_COLORS, type MatchResult } from "../lib/matcher";
import { distanceKm, formatDistance } from "../lib/distance";
import { Navigation, Home, Target } from "lucide-react";
import { MapListLayout, type MapListItem } from "../components/MapListLayout";
import { Checkbox } from "../components/Checkbox";
import { FilterPanel, type FilterState, type FacetCounts, type PostedBucket } from "../components/FilterPanel";

const POSTED_MS: Record<PostedBucket, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  any: 0,
};

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

export function JobBrowse() {
 const jobs = useJobs((s) => s.jobs);
 const user = useAuth((s) => s.currentUser);
 const profilesMap = useProfile((s) => s.byUser);
 const profile = user ? profilesMap[user.id] : undefined;

 const [search, setSearch] = useState("");
 const [bestOnly, setBestOnly] = useState(false);
 const [radiusKm, setRadiusKm] = useState<number>(9999); // default "Any"
 const [sortBy, setSortBy] = useState<"smart" | "nearest" | "newest">("smart");

 // Faceted filter state — the new FilterPanel owns this.
 const [filters, setFilters] = useState<FilterState>({
 districts: [],
 taluks: [],
 field: "all",
 types: [],
 experience: "all",
 posted: "any",
 });
 const [filtersOpen, setFiltersOpen] = useState(false); // mobile drawer
 const districts = useLocations((s) => s.districts);

 // Anchor: which of candidate's locations to use for distance.
 // hasDistinctPreferred is only true when the saved preferred is at a
 // measurably different point from the current — otherwise the two-anchor
 // toggle would be a duplicate tab on a single row of wasted space.
 const hasCurrent = profile?.currentLat != null && profile?.currentLng != null;
 const hasPreferred = profile?.preferredLat != null && profile?.preferredLng != null;
 const hasDistinctPreferred =
 hasCurrent && hasPreferred
 && (Math.abs(profile!.preferredLat! - profile!.currentLat!) > 1e-4
 || Math.abs(profile!.preferredLng! - profile!.currentLng!) > 1e-4);
 const [anchor, setAnchor] = useState<"current" | "preferred">(hasCurrent ? "current" : "preferred");

 const anchorCoords =
 anchor === "preferred"
 ? hasPreferred
 ? { lat: profile!.preferredLat!, lng: profile!.preferredLng! }
 : null
 : hasCurrent
 ? { lat: profile!.currentLat!, lng: profile!.currentLng! }
 : null;

 /**
 * Single source of truth for "does this job pass our facets". Accepts an
 * optional `skip` so the counts-per-facet computation can drop one facet
 * from the predicate when counting that facet — gives faceted-search the
 * "this option would yield N jobs if you picked it" feel.
 */
 const passes = (j: Job, skip?: keyof FilterState | "search") => {
 if (skip !== "search" && search.trim()) {
 const q = search.toLowerCase();
 const haystack = `${j.title} ${j.employerName} ${j.description} ${j.skills.join(" ")}`.toLowerCase();
 if (!haystack.includes(q)) return false;
 }
 if (skip !== "districts" && filters.districts.length && !filters.districts.includes(j.districtId ?? "")) return false;
 if (skip !== "taluks" && filters.taluks.length && !filters.taluks.includes(j.talukId ?? "")) return false;
 if (skip !== "field" && filters.field !== "all" && j.field !== filters.field) return false;
 if (skip !== "types" && filters.types.length && !filters.types.includes(j.type)) return false;
 if (skip !== "experience" && filters.experience !== "all"
 && j.experience !== filters.experience && j.experience !== "any") return false;
 if (skip !== "posted" && filters.posted !== "any") {
 const cutoff = Date.now() - POSTED_MS[filters.posted];
 if (new Date(j.postedAt).getTime() < cutoff) return false;
 }
 return true;
 };

 /** Counts per facet — compute each by excluding that facet from the predicate. */
 const counts = useMemo<FacetCounts>(() => {
 const c: FacetCounts = {
 district: {} as Record<string, number>,
 taluk: {} as Record<string, number>,
 field: { it: 0, non_it: 0 },
 type: {
 internship_training: 0, apprentice: 0, full_time: 0, part_time: 0,
 gig_delivery: 0, contract: 0, consultant: 0, freelancer: 0,
 },
 experience: { fresher: 0, experienced: 0, any: 0 },
 posted: { "24h": 0, "7d": 0, "30d": 0, any: 0 },
 };
 for (const j of jobs) {
 if (passes(j, "districts") && j.districtId) c.district[j.districtId] = (c.district[j.districtId] ?? 0) + 1;
 if (passes(j, "taluks") && j.talukId) c.taluk[j.talukId] = (c.taluk[j.talukId] ?? 0) + 1;
 if (passes(j, "field")) c.field[j.field] = (c.field[j.field] ?? 0) + 1;
 if (passes(j, "types")) c.type[j.type] = (c.type[j.type] ?? 0) + 1;
 if (passes(j, "experience")) c.experience[j.experience] = (c.experience[j.experience] ?? 0) + 1;
 if (passes(j, "posted")) {
 const age = Date.now() - new Date(j.postedAt).getTime();
 c.posted.any += 1;
 if (age <= POSTED_MS["30d"]) c.posted["30d"] += 1;
 if (age <= POSTED_MS["7d"]) c.posted["7d"] += 1;
 if (age <= POSTED_MS["24h"]) c.posted["24h"] += 1;
 }
 }
 return c;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [jobs, filters, search]);

 const filtered = useMemo(() => {
 const base = jobs.filter((j) => passes(j));
 const withMatch = base.map((j) => {
 const result = profile ? matchScore(j, profile) : null;
 const dist = anchorCoords && j.lat != null && j.lng != null
 ? distanceKm({ lat: j.lat, lng: j.lng }, anchorCoords)
 : (profile ? jobDistanceKm(j, profile) : null);
 return { job: j, result, distance: dist };
 });
 const radiusFiltered = anchorCoords && radiusKm < 9999
 ? withMatch.filter((x) => x.distance != null && x.distance <= radiusKm)
 : withMatch;
 const bestFiltered = bestOnly
 ? radiusFiltered.filter((x) => x.result && x.result.score >= 70)
 : radiusFiltered;
 const sorted = [...bestFiltered];
 if (sortBy === "nearest" && anchorCoords) {
 sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
 } else if (sortBy === "newest") {
 sorted.sort((a, b) => new Date(b.job.postedAt).getTime() - new Date(a.job.postedAt).getTime());
 } else if (profile) {
 sorted.sort((a, b) => {
 const ds = (b.result?.score ?? 0) - (a.result?.score ?? 0);
 if (ds !== 0) return ds;
 return (a.distance ?? Infinity) - (b.distance ?? Infinity);
 });
 }
 return sorted;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [jobs, filters, search, profile, bestOnly, anchorCoords, radiusKm, sortBy]);

 /** Total active facet selections — drives the chips bar + drawer badge. */
 const activeCount =
 filters.districts.length + filters.taluks.length + filters.types.length +
 (filters.field !== "all" ? 1 : 0) +
 (filters.experience !== "all" ? 1 : 0) +
 (filters.posted !== "any" ? 1 : 0);
 const clearAll = () => setFilters({ districts: [], taluks: [], field: "all", types: [], experience: "all", posted: "any" });

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

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 {/* Header — title/count on the left, anchor toggle inline on the right */}
 <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
 <div>
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Browse jobs
 </p>
 <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
 Openings across Tamil Nadu
 </h1>
 <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
 {filtered.length} {filtered.length === 1 ? "job" : "jobs"} match your filters
 </p>
 </div>
 {hasDistinctPreferred && (
 <div className="inline-flex shrink-0 items-center gap-0.5 self-start rounded-full border border-zinc-200 bg-white p-0.5 text-[11px] font-semibold dark:border-zinc-700 dark:bg-zinc-900 md:self-end">
 <button
 onClick={() => setAnchor("current")}
 className={[
 "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition",
 anchor === "current"
 ? "bg-brand-500 text-white shadow-sm"
 : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800",
 ].join(" ")}
 >
 <Home size={11} /> Near home
 </button>
 <button
 onClick={() => setAnchor("preferred")}
 className={[
 "inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition",
 anchor === "preferred"
 ? "bg-sky-500 text-white shadow-sm"
 : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800",
 ].join(" ")}
 >
 <Target size={11} /> Near preferred
 </button>
 </div>
 )}
 </header>

 {/* Top control bar — search + sort + mobile Filters button. */}
 <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
 <div className="relative">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search role, company, skill..."
 className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-900"
 />
 </div>
 <Select
 value={sortBy}
 onChange={(v) => setSortBy(v as typeof sortBy)}
 options={[
 { id: "smart", label: profile ? "Best match" : "Newest" },
 ...(anchorCoords ? [{ id: "nearest", label: "Nearest first" }] : []),
 { id: "newest", label: "Newest" },
 ]}
 />
 <button
 type="button"
 onClick={() => setFiltersOpen(true)}
 className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 lg:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
 >
 <SlidersHorizontal size={14} />
 Filters
 {activeCount > 0 && (
 <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>
 )}
 </button>
 </div>

 {/* Active filter chips bar — only when ≥1 facet selected. */}
 {activeCount > 0 && (
 <div className="mb-4 flex flex-wrap items-center gap-1.5">
 {filters.field !== "all" && (
 <Chip onClear={() => setFilters({ ...filters, field: "all" })}>
 {filters.field === "it" ? "IT" : "Non-IT"}
 </Chip>
 )}
 {filters.districts.map((id) => {
 const d = districts.find((x) => x.id === id);
 return (
 <Chip key={id} onClear={() => setFilters({ ...filters, districts: filters.districts.filter((x) => x !== id), taluks: [] })}>
 {d?.name ?? id}
 </Chip>
 );
 })}
 {filters.taluks.map((id) => (
 <Chip key={id} onClear={() => setFilters({ ...filters, taluks: filters.taluks.filter((x) => x !== id) })}>
 Taluk
 </Chip>
 ))}
 {filters.types.map((t) => (
 <Chip key={t} onClear={() => setFilters({ ...filters, types: filters.types.filter((x) => x !== t) })}>
 {TYPE_LABELS[t]}
 </Chip>
 ))}
 {filters.experience !== "all" && (
 <Chip onClear={() => setFilters({ ...filters, experience: "all" })}>
 {filters.experience === "fresher" ? "Fresher" : "Experienced"}
 </Chip>
 )}
 {filters.posted !== "any" && (
 <Chip onClear={() => setFilters({ ...filters, posted: "any" })}>
 Last {filters.posted}
 </Chip>
 )}
 <button
 type="button"
 onClick={clearAll}
 className="ml-1 text-[12px] font-semibold text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
 >
 Clear all
 </button>
 </div>
 )}

 {/* Anchor controls — kept inline above the split when an anchor exists */}
 {(profile || anchorCoords) && (
 <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-[12px] dark:border-emerald-500/30 dark:bg-emerald-500/10">
 <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
 <Sparkles size={13} />
 {anchorCoords ? `Near your ${anchor === "current" ? "home" : "preferred location"}` : "Sorted by match"}
 </span>
 {anchorCoords && (
 <div className="inline-flex items-center gap-1.5">
 <Navigation size={11} className="text-emerald-600 dark:text-emerald-400" />
 <span className="font-semibold text-zinc-700 dark:text-zinc-300">Within</span>
 <select
 value={radiusKm}
 onChange={(e) => setRadiusKm(Number(e.target.value))}
 className="rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700 focus:outline-none dark:border-emerald-500/30 dark:bg-zinc-900 dark:text-emerald-400"
 >
 {radiusOptions.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 </div>
 )}
 <div className="ml-auto">
 <Checkbox checked={bestOnly} onChange={setBestOnly} label="Best matches only" tone="emerald" size="sm" />
 </div>
 </div>
 )}

 {/* Split: filter panel (lg+) | results */}
 <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
 {/* Desktop sticky filter panel */}
 <div className="hidden lg:block">
 <div className="sticky top-24">
 <FilterPanel state={filters} counts={counts} onChange={setFilters} />
 </div>
 </div>

 <div className="min-w-0">
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
 </div>
 </div>

 {/* Mobile filter drawer */}
 {filtersOpen && (
 <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
 <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 28, stiffness: 280 }}
 className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-900"
 >
 <div className="flex h-full flex-col">
 <FilterPanel state={filters} counts={counts} onChange={setFilters} onClose={() => setFiltersOpen(false)} />
 <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
 <button
 type="button"
 onClick={clearAll}
 className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400"
 >
 Clear all
 </button>
 <button
 type="button"
 onClick={() => setFiltersOpen(false)}
 className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-brand-500/30"
 >
 Show {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </main>
 </div>
 );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
 return (
 <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-1 text-[12px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
 {children}
 <button
 type="button"
 onClick={onClear}
 className="text-brand-600 transition hover:text-brand-800 dark:text-brand-400"
 aria-label="Remove filter"
 >
 <X size={11} />
 </button>
 </span>
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

 const user = useAuth((s) => s.currentUser);
 const isSaved = useApplications((s) =>
 user ? (s.saved[user.id] ?? []).includes(job.id) : false,
 );
 const toggleSaveAsync = useApplications((s) => s.toggleSaveAsync);
 const isFresher = job.experience === "fresher" || job.experience === "any";
 const isInternship = job.type === "internship_training";

 const onToggleSave = (e: React.MouseEvent) => {
 // Card is wrapped in a Link — stop the click from navigating.
 e.preventDefault();
 e.stopPropagation();
 if (!user) return;
 void toggleSaveAsync(user.id, job.id).catch(() => { /* toast handled inside */ });
 };

 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3, delay }}
 className="relative"
 >
 <Link
 to={`/candidate/jobs/${job.id}`}
 className={[
 "group flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 dark:bg-zinc-900 dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
 isSaved
 ? "shadow-[0_6px_22px_rgba(251,113,133,0.14)] hover:shadow-[0_14px_32px_rgba(251,113,133,0.18)] dark:shadow-[0_6px_22px_rgba(251,113,133,0.10)] dark:hover:shadow-[0_14px_32px_rgba(0,0,0,0.45)]"
 : "hover:shadow-[0_14px_32px_rgba(15,23,42,0.10)] dark:hover:shadow-[0_14px_32px_rgba(0,0,0,0.45)]",
 ].join(" ")}
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

 {/* Bookmark overlay — sits above the Link so a card click keeps
 navigating to the detail page while this button owns saving. */}
 {user && (
 <button
 type="button"
 onClick={onToggleSave}
 aria-pressed={isSaved}
 aria-label={isSaved ? "Remove from saved" : "Save this job"}
 title={isSaved ? "Click to remove from your saved list" : "Save this job for later"}
 className={[
 "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90",
 isSaved
 ? "bg-rose-500 text-white shadow-sm shadow-rose-500/40 ring-1 ring-rose-500/60 hover:bg-rose-600"
 : "bg-white/95 text-zinc-500 ring-1 ring-zinc-200 backdrop-blur-sm hover:bg-white hover:text-rose-500 dark:bg-zinc-900/95 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:text-rose-400",
 ].join(" ")}
 >
 <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 2.5 : 2} />
 </button>
 )}
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
 className="rounded-lg bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 >
 {options.map((o) => (
 <option key={o.id} value={o.id}>
 {o.label}
 </option>
 ))}
 </select>
 );
}
