import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
 Search,
 MapPin,
 Code2,
 Building2,
 Sparkles,
 Lock,
 Briefcase,
 ChevronRight,
 ShieldAlert,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, allUsers, type User } from "../store/auth";
import { useProfile, type CandidateProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { MapListLayout, type MapListItem } from "../components/MapListLayout";
import { apiEnabled } from "../lib/api";
import { employerCandidatesApi, type EmployerCandidateRow } from "../lib/api/jobs";

type FieldFilter = "all" | "it" | "non_it";
type TypeFilter = "all" | "fresher" | "experienced";

export function EmployerCandidates() {
 const employer = useAuth((s) => s.currentUser)!;
 const profilesMap = useProfile((s) => s.byUser);
 const sub = useSubscriptions((s) =>
 s.activeFor(employer.id, "employer_sme") ?? s.activeFor(employer.id, "employer_large")
 );
 const hasSub = !!sub;

 const [search, setSearch] = useState("");
 const [fieldFilter, setFieldFilter] = useState<FieldFilter>("all");
 const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

 /** Server-fetched rows when VITE_API_URL is set; null until first response. */
 const [apiRows, setApiRows] = useState<EmployerCandidateRow[] | null>(null);
 const [, setApiLoading] = useState(apiEnabled);
 const [apiError, setApiError] = useState<string | null>(null);

 // Fetch (with the active filters) whenever the query changes. Debounce the
 // text search so we don't fire a request per keystroke.
 const [searchDebounced, setSearchDebounced] = useState("");
 useEffect(() => {
 const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
 return () => clearTimeout(t);
 }, [search]);

 useEffect(() => {
 if (!apiEnabled) { setApiLoading(false); return; }
 let alive = true;
 setApiLoading(true);
 employerCandidatesApi.search({
 field: fieldFilter === "all" ? undefined : fieldFilter === "it" ? "IT" : "NON_IT",
 type: typeFilter === "all" ? undefined : typeFilter === "fresher" ? "FRESHER" : "EXPERIENCED",
 search: searchDebounced || undefined,
 page: 1,
 pageSize: 60,
 })
 .then((res) => { if (alive) { setApiRows(res.items); setApiError(null); } })
 .catch((err) => { if (alive) setApiError(err instanceof Error ? err.message : "Failed to load candidates"); })
 .finally(() => alive && setApiLoading(false));
 return () => { alive = false; };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [searchDebounced, fieldFilter, typeFilter]);

 const items = useMemo(() => {
 if (apiEnabled && apiRows) {
 // Convert API rows into the {user, profile} shape the rest of this
 // file expects, so the map markers + cards keep their existing code.
 return apiRows.map((r) => ({
 user: {
 id: r.user.id, role: "candidate" as const, name: r.user.name, email: r.user.email,
 mobile: r.user.mobile ?? undefined, emailVerified: true, createdAt: r.user.createdAt,
 } satisfies User,
 profile: {
 userId: r.user.id,
 photoDataUrl: r.photoUrl ?? undefined,
 field: r.field === "IT" ? "it" : r.field === "NON_IT" ? "non_it" : undefined,
 type: r.type === "FRESHER" ? "fresher" : r.type === "EXPERIENCED" ? "experienced" : undefined,
 itSpecialization: r.itSpecialization ?? undefined,
 itLanguages: r.itLanguages ?? undefined,
 nonItDepartments: r.nonItDepartments ?? undefined,
 topSkills: r.topSkills ?? undefined,
 yearsOfExperience: r.yearsOfExperience ?? undefined,
 preferredLocation: r.preferredLocation ?? undefined,
 preferredLat: r.preferredLat ?? undefined,
 preferredLng: r.preferredLng ?? undefined,
 currentLat: r.currentLat ?? undefined,
 currentLng: r.currentLng ?? undefined,
 selectedTemplateId: (r.selectedTemplateId?.toLowerCase() ?? undefined) as CandidateProfile["selectedTemplateId"],
 education: [],
 updatedAt: r.updatedAt,
 } satisfies CandidateProfile,
 }));
 }
 // localStorage fallback
 const users = allUsers().filter((u) => u.role === "candidate");
 return users
 .map((u) => ({ user: u, profile: profilesMap[u.id] }))
 .filter((x): x is { user: User; profile: CandidateProfile } => !!x.profile && !!x.profile.selectedTemplateId);
 }, [apiRows, profilesMap]);

 const locations = useMemo(
 () => Array.from(new Set(items.map((x) => x.profile?.preferredLocation).filter(Boolean) as string[])).sort(),
 [items]
 );
 const [locationFilter, setLocationFilter] = useState<string>("all");

 const filtered = items.filter(({ user, profile }) => {
 if (!profile) return false;
 if (fieldFilter !== "all" && profile.field !== fieldFilter) return false;
 if (typeFilter !== "all" && profile.type !== typeFilter) return false;
 if (locationFilter !== "all" && profile.preferredLocation !== locationFilter) return false;
 if (search.trim()) {
 const q = search.toLowerCase();
 const skills = [
 ...(profile.itLanguages ?? []),
 ...(profile.nonItDepartments ?? []),
 ...(profile.topSkills ?? []),
 ].join(" ");
 const haystack = `${user.name} ${profile.itSpecialization ?? ""} ${skills}`.toLowerCase();
 if (!haystack.includes(q)) return false;
 }
 return true;
 });

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <header className="mb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
 Search candidates
 </p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
 {filtered.length} candidate{filtered.length === 1 ? "" : "s"} match your filters
 </h1>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 All candidates with completed profiles. {hasSub ? "Tap any card to view their full CV." : "Subscribe to unlock full CVs."}
 </p>
 {apiError && (
 <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {apiError}
 </p>
 )}
 </header>

 {!hasSub && (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-5 flex items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5"
 >
 <div className="flex items-start gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
 <ShieldAlert size={18} />
 </div>
 <div>
 <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
 You're browsing without an active subscription
 </p>
 <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
 You can preview cards. Subscribe to view full profiles + contact details.
 </p>
 </div>
 </div>
 <Link
 to="/employer/subscribe"
 className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg"
 >
 See plans
 </Link>
 </motion.div>
 )}

 {/* Filters */}
 <div className="mb-5 grid gap-3 rounded-3xl bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 md:grid-cols-[1fr_auto_auto_auto]">
 <div className="relative">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, skill, specialization..."
 className="w-full rounded-lg bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 />
 </div>
 <Select value={fieldFilter} onChange={(v) => setFieldFilter(v as FieldFilter)} options={[{ id: "all", label: "All fields" }, { id: "it", label: "IT" }, { id: "non_it", label: "Non-IT" }]} />
 <Select value={typeFilter} onChange={(v) => setTypeFilter(v as TypeFilter)} options={[{ id: "all", label: "Any type" }, { id: "fresher", label: "Fresher" }, { id: "experienced", label: "Experienced" }]} />
 <Select value={locationFilter} onChange={setLocationFilter} options={[{ id: "all", label: "All locations" }, ...locations.map((l) => ({ id: l, label: l }))]} />
 </div>

 <MapListLayout
 markerTone="sky"
 items={filtered.map(({ user, profile }, i): MapListItem => {
 const lat = profile!.preferredLat ?? profile!.currentLat;
 const lng = profile!.preferredLng ?? profile!.currentLng;
 return {
 id: user.id,
 lat,
 lng,
 listElement: (
 <CandidateCard
 user={user}
 profile={profile!}
 hasSub={hasSub}
 delay={Math.min(i, 8) * 0.03}
 />
 ),
 popupElement: <CandidatePopup user={user} profile={profile!} hasSub={hasSub} />,
 };
 })}
 emptyState={
 <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
 <Search size={32} className="text-zinc-400" />
 <p className="mt-3 text-sm font-semibold">No candidates match your filters</p>
 <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
 Try widening your search, or wait for more profiles to be created.
 </p>
 </div>
 }
 />
 </main>
 </div>
 );
}

function CandidatePopup({
 user,
 profile,
 hasSub,
}: {
 user: User;
 profile: CandidateProfile;
 hasSub: boolean;
}) {
 const initials = user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
 const role = profile.type === "experienced"
 ? `${profile.yearsOfExperience ?? "—"} yrs experience`
 : profile.field === "it"
 ? `Aspiring ${profile.itSpecialization ?? "IT"}`
 : profile.field === "non_it"
 ? `Aspiring ${profile.nonItDepartments?.[0] ?? "Non-IT"}`
 : "Candidate";

 return (
 <Link
 to={`/employer/candidates/${user.id}`}
 className="block w-[240px] p-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
 >
 <div className="flex items-start gap-2">
 {profile.photoDataUrl ? (
 <img src={profile.photoDataUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
 ) : (
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-xs font-bold text-white">
 {initials || "—"}
 </div>
 )}
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
 {hasSub ? user.name : "•••••• ••••••"}
 </h3>
 <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">{role}</p>
 </div>
 </div>
 <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-semibold">
 {profile.preferredLocation && (
 <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
 <MapPin size={9} /> {profile.preferredLocation}
 </span>
 )}
 {profile.field === "it" && (
 <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
 <Code2 size={9} /> IT
 </span>
 )}
 {profile.field === "non_it" && (
 <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
 <Building2 size={9} /> Non-IT
 </span>
 )}
 </div>
 {!hasSub && (
 <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
 <Lock size={9} /> Subscribe to view
 </p>
 )}
 </Link>
 );
}

function CandidateCard({
 user,
 profile,
 hasSub,
 delay,
}: {
 user: User;
 profile: CandidateProfile;
 hasSub: boolean;
 delay: number;
}) {
 const initials = user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
 const skills = profile.type === "experienced"
 ? profile.topSkills ?? []
 : profile.field === "it"
 ? profile.itLanguages ?? []
 : profile.nonItDepartments ?? [];
 const role = profile.type === "experienced"
 ? `${profile.yearsOfExperience ?? "—"} years experience`
 : profile.field === "it"
 ? `Aspiring ${profile.itSpecialization ?? "IT"}`
 : profile.field === "non_it"
 ? `Aspiring ${profile.nonItDepartments?.[0] ?? "Non-IT"}`
 : "Candidate";

 return (
 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}>
 <Link
 to={`/employer/candidates/${user.id}`}
 className="group relative flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/10 dark:bg-zinc-900 dark:hover:border-sky-500/40"
 >
 <div className="flex items-start gap-3">
 {profile.photoDataUrl ? (
 <img src={profile.photoDataUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-800" />
 ) : (
 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-base font-bold text-white shadow-md shadow-sky-500/30">
 {initials || "—"}
 </div>
 )}
 <div className="min-w-0 flex-1">
 <h2 className="truncate text-base font-semibold tracking-tight">{hasSub ? user.name : "•••••• ••••••"}</h2>
 <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{role}</p>
 </div>
 <ChevronRight size={18} className="shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
 </div>

 <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold">
 {profile.preferredLocation && (
 <Pill icon={<MapPin size={10} />} color="zinc">{profile.preferredLocation}</Pill>
 )}
 {profile.field === "it" && <Pill icon={<Code2 size={10} />} color="sky">IT</Pill>}
 {profile.field === "non_it" && <Pill icon={<Building2 size={10} />} color="amber">Non-IT</Pill>}
 {profile.type === "fresher" && <Pill icon={<Sparkles size={10} />} color="emerald">Fresher</Pill>}
 {profile.type === "experienced" && (
 <Pill icon={<Briefcase size={10} />} color="violet">Experienced</Pill>
 )}
 </div>

 {skills.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-1">
 {skills.slice(0, 5).map((s) => (
 <span key={s} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
 {s}
 </span>
 ))}
 </div>
 )}

 {!hasSub && (
 <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
 <Lock size={12} /> Full profile locked — subscribe to view
 </div>
 )}
 </Link>
 </motion.div>
 );
}

const PILL_COLORS = {
 zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
 sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
 emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
 violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
} as const;

function Pill({ icon, color, children }: { icon?: React.ReactNode; color: keyof typeof PILL_COLORS; children: React.ReactNode }) {
 return (
 <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5", PILL_COLORS[color]].join(" ")}>
 {icon}
 {children}
 </span>
 );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
 return (
 <select
 value={value}
 onChange={(e) => onChange(e.target.value)}
 className="rounded-lg bg-white px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 >
 {options.map((o) => (
 <option key={o.id} value={o.id}>{o.label}</option>
 ))}
 </select>
 );
}
