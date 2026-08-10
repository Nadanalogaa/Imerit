import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  X,
  Filter,
  Flame,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, allUsers, type User } from "../store/auth";
import { useProfile, type CandidateProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { useApplications } from "../store/applications";
import { useJobs, isExpired } from "../store/jobs";
import { useLocations } from "../store/locations";
import { useSavedSearches, useShortlist } from "../store/employerPrefs";
import { MapListLayout, type MapListItem } from "../components/MapListLayout";
import { SectionSeparator } from "../components/SectionSeparator";
import { CandidateFilterPanel } from "../components/employer/CandidateFilterPanel";
import { SavedSearchStrip } from "../components/employer/SavedSearchStrip";
import { RecentlyViewedStrip } from "../components/employer/RecentlyViewedStrip";
import { ShortlistBar } from "../components/employer/ShortlistBar";
import { apiEnabled } from "../lib/api";
import { employerCandidatesApi, type EmployerCandidateRow } from "../lib/api/jobs";
import {
  activeFacetCount,
  emptyCandidateFilter,
  matchesFilter,
  skillMatchScore,
  type CandidateFilterState,
} from "../lib/employerFilters";
import { matchScore as candidateJobScore } from "../lib/matcher";

/** Frozen empty fallback for the shortlist selector — see the note on the
 *  Zustand snapshot cache in RecentlyViewedStrip. */
const EMPTY_SHORTLIST: string[] = [];

export function EmployerCandidates() {
  const employer = useAuth((s) => s.currentUser)!;
  const profilesMap = useProfile((s) => s.byUser);
  const sub = useSubscriptions((s) =>
    s.activeFor(employer.id, "employer_sme") ?? s.activeFor(employer.id, "employer_large")
  );
  const hasSub = !!sub;

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CandidateFilterState>(emptyCandidateFilter);
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile drawer

  /* -------- server-fetched rows when VITE_API_URL is set ---------- */

  const [apiRows, setApiRows] = useState<EmployerCandidateRow[] | null>(null);
  const [, setApiLoading] = useState(apiEnabled);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchDebounced, setSearchDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    if (!apiEnabled) {
      setApiLoading(false);
      return;
    }
    let alive = true;
    setApiLoading(true);
    employerCandidatesApi
      .search({
        field: !filters.field ? undefined : filters.field === "it" ? "IT" : "NON_IT",
        type: !filters.candidateType
          ? undefined
          : filters.candidateType === "fresher"
            ? "FRESHER"
            : "EXPERIENCED",
        search: searchDebounced || undefined,
        page: 1,
        pageSize: 60,
      })
      .then((res) => {
        if (alive) {
          setApiRows(res.items);
          setApiError(null);
        }
      })
      .catch((err) => {
        if (alive) setApiError(err instanceof Error ? err.message : "Failed to load candidates");
      })
      .finally(() => alive && setApiLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounced, filters.field, filters.candidateType]);

  /* --------------------- source pool ---------------------- */

  const items = useMemo(() => {
    if (apiEnabled && apiRows) {
      // `as CandidateProfile` (not `satisfies`) — the API row is a strict
      // subset of the full profile shape, but downstream code reads
      // optional fields like `experiences`; keeping the literal type would
      // narrow the union and blow up on those accesses at build time.
      return apiRows.map((r): { user: User; profile: CandidateProfile } => ({
        user: {
          id: r.user.id,
          role: "candidate",
          name: r.user.name,
          email: r.user.email,
          mobile: r.user.mobile ?? undefined,
          emailVerified: true,
          createdAt: r.user.createdAt,
        },
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
        },
      }));
    }
    const users = allUsers().filter((u) => u.role === "candidate");
    return users
      .map((u) => ({ user: u, profile: profilesMap[u.id] }))
      .filter((x): x is { user: User; profile: CandidateProfile } => !!x.profile && !!x.profile.selectedTemplateId);
  }, [apiRows, profilesMap]);

  /* ---------------- context: active jobs, districts, activity ---------------- */

  const districts = useLocations((s) => s.districts);
  const allJobs = useJobs((s) => s.jobs);
  const activeJobs = useMemo(
    () => allJobs.filter((j) => j.employerId === employer.id && !isExpired(j)),
    [allJobs, employer.id],
  );
  const nearJob = useMemo(
    () => (filters.nearJobId ? activeJobs.find((j) => j.id === filters.nearJobId) ?? null : null),
    [filters.nearJobId, activeJobs],
  );

  /** Applications submitted in the last 7 days per candidate — powers the
   *  "Active this week" pill on cards. Select the raw list and derive the
   *  aggregate via useMemo so the Zustand snapshot stays stable across
   *  renders (a fresh object on every render trips the getSnapshot cache
   *  and blows up with an infinite update loop). */
  const applications = useApplications((s) => s.applications);
  const weeklyApps = useMemo(() => {
    const now = Date.now();
    const out: Record<string, number> = {};
    for (const a of applications) {
      const t = new Date(a.appliedAt).getTime();
      if (isNaN(t)) continue;
      if (now - t > 7 * 24 * 60 * 60 * 1000) continue;
      out[a.userId] = (out[a.userId] ?? 0) + 1;
    }
    return out;
  }, [applications]);

  /* ---------------- rank + partition ----------------
   * "Matches first, then everyone else" pattern.
   *
   * Facets split into two flavours:
   *   - HARD (field, candidateType, years, education) — user is narrowing;
   *     non-matches are hidden entirely, same as before.
   *   - SOFT (search text, skills, districts, near-job) — user is expressing
   *     preferences; matches float to the top and everything else in the
   *     hard-filtered pool falls below a divider.
   *
   * When no soft signals are active, everyone lives in `others` and no
   * divider appears — behaves like a plain sorted list.
   */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const hardPass = (profile: CandidateProfile): boolean => {
      if (filters.field && profile.field !== filters.field) return false;
      if (filters.candidateType && profile.type !== filters.candidateType) return false;
      if (filters.yearsMin != null || filters.yearsMax != null) {
        const y = profile.yearsOfExperience ?? -1;
        if (filters.yearsMin != null && y < filters.yearsMin) return false;
        if (filters.yearsMax != null && y > filters.yearsMax) return false;
      }
      if (filters.educationLevels.length > 0) {
        const has = (profile.education ?? []).some((e) => e.enabled && filters.educationLevels.includes(e.level));
        if (!has) return false;
      }
      return true;
    };

    // Best-fit against the employer's own active jobs — uses the SAME
    // 100-point breakdown the candidate side uses (matcher.ts), so a
    // candidate showing "82% match" here is scored identically to the way
    // the candidate would see this employer's job. `max` over jobs answers
    // "is this candidate great for at least ONE of my openings?" — more
    // useful than an average when the employer has diverse listings.
    const bestJobFit = (profile: CandidateProfile): number => {
      if (activeJobs.length === 0) return 0;
      let best = 0;
      for (const j of activeJobs) {
        const s = candidateJobScore(j, profile).score;
        if (s > best) best = s;
      }
      return best;
    };

    const softScore = (user: User, profile: CandidateProfile): number => {
      let score = 0;
      if (q) {
        const hay = [
          user.name,
          profile.preferredLocation ?? "",
          profile.itSpecialization ?? "",
          ...(profile.itLanguages ?? []),
          ...(profile.nonItDepartments ?? []),
          ...(profile.topSkills ?? []),
          ...(profile.experiences ?? []).map((e) => `${e.company} ${e.role}`),
        ].join(" ").toLowerCase();
        if (hay.includes(q)) score += 3;
      }
      if (filters.skills.length > 0) {
        score += skillMatchScore(profile, filters) * 5;
      }
      if (filters.districtIds.length > 0) {
        const inPreferred = (profile.preferredDistricts ?? []).some((id) => filters.districtIds.includes(id));
        const inCurrent = profile.currentDistrictId != null && filters.districtIds.includes(profile.currentDistrictId);
        if (inPreferred || inCurrent) score += 2;
      }
      if (filters.nearJobId && filters.maxDistanceKm != null && nearJob) {
        if (matchesFilter(profile, { ...filters, districtIds: [], skills: [] }, { districts, nearJob })) {
          score += 2;
        }
      }
      // Implicit signal from active jobs — same match algorithm both sides
      // will see. Weighted so it dominates when no explicit filter is set
      // (matcher score is 0–100 → scaled to 0–5 here) but leaves room for
      // explicit filters to break ties when both are present.
      if (activeJobs.length > 0) {
        score += (bestJobFit(profile) / 100) * 5;
      }
      return score;
    };

    const hasSignal =
      !!q ||
      filters.skills.length > 0 ||
      filters.districtIds.length > 0 ||
      !!filters.nearJobId ||
      activeJobs.length > 0;

    const pool = items.filter(({ profile }) => hardPass(profile));

    const scored = pool.map((it) => ({ ...it, score: softScore(it.user, it.profile) }));

    const sortFallback = (a: typeof scored[number], b: typeof scored[number]) => {
      switch (filters.sort) {
        case "recent":
          return (b.profile.updatedAt ?? "").localeCompare(a.profile.updatedAt ?? "");
        case "alphabetical":
          return a.user.name.toLowerCase().localeCompare(b.user.name.toLowerCase());
        default:
          return (b.profile.updatedAt ?? "").localeCompare(a.profile.updatedAt ?? "");
      }
    };

    if (!hasSignal) {
      const sorted = [...scored].sort(sortFallback);
      return { matched: [] as typeof scored, others: sorted, hasSignal: false };
    }

    // Cap the featured strip so it stays a "shortlist to look at first"
    // rather than dominating the viewport. Full pool is still rendered
    // in the "All candidates" section beneath.
    const FEATURED_CAP = 5;
    const withScore = [...scored].sort(
      (a, b) => (b.score !== a.score ? b.score - a.score : sortFallback(a, b)),
    );

    /* ---------------- skill gate for Best Matches ----------------
     *
     * Location / field / experience aren't enough on their own to feature
     * a candidate — the employer needs someone who can actually do the
     * job. We gate Best Matches on skill overlap.
     *
     * Gate context (in priority order):
     *   1. Explicit `filters.skills` — if the employer typed required
     *      skills, candidate must hit ≥1 of them.
     *   2. Active-jobs implicit — if any of the employer's active jobs
     *      lists required skills, candidate must hit ≥1 skill across all
     *      such jobs (via matcher.ts breakdown).
     *   3. Neither → gate is inert (no skill context to enforce), the
     *      existing scoring wins.
     */
    const activeJobsWithSkills = activeJobs.filter((j) => (j.skills?.length ?? 0) > 0);

    const passesSkillGate = (profile: CandidateProfile): boolean => {
      if (filters.skills.length > 0) {
        return skillMatchScore(profile, filters) > 0;
      }
      if (activeJobsWithSkills.length > 0) {
        for (const j of activeJobsWithSkills) {
          if (candidateJobScore(j, profile).breakdown.skills.matched.length > 0) {
            return true;
          }
        }
        return false;
      }
      return true;
    };

    const skillGateActive =
      filters.skills.length > 0 || activeJobsWithSkills.length > 0;

    const positive = withScore.filter((x) => x.score > 0 && passesSkillGate(x.profile));
    const featured = positive.length > 0
      ? positive.slice(0, FEATURED_CAP)
      : skillGateActive
        ? [] // Gate active but no candidate hit any required skill — no best matches, only All Candidates
        : withScore.slice(0, Math.min(FEATURED_CAP, withScore.length));

    return { matched: featured, others: withScore, hasSignal: true };
  }, [items, filters, districts, nearJob, search, activeJobs]);

  // `others` is now the full sorted pool (matches are a subset of it), so
  // it doubles as the total-in-view count.
  const filteredCount = filtered.others.length;

  /* ---------------- save search ---------------- */

  const addSavedSearch = useSavedSearches((s) => s.add);
  const handleSaveSearch = () => {
    const defaultName = suggestSearchName(filters, districts);
    const name = window.prompt("Name this search", defaultName);
    if (!name?.trim()) return;
    const notify = window.confirm(
      "Notify you in the bell when new candidates match this search?",
    );
    const currentMatchIds = items
      .filter((c) => matchesFilter(c.profile, filters, { districts, nearJob }))
      .map((c) => c.user.id);
    addSavedSearch({
      employerId: employer.id,
      name: name.trim(),
      filters,
      notify,
      initialCandidateIds: currentMatchIds,
    });
  };

  /* ---------------- shortlist ---------------- */

  // See RecentlyViewedStrip for why we go through the raw map + useMemo
  // instead of a `.forEmployer(id)`-style selector that would synthesise a
  // fresh array each render.
  const shortlistByEmployer = useShortlist((s) => s.byEmployer);
  const shortlistIds = useMemo(
    () => shortlistByEmployer[employer.id] ?? EMPTY_SHORTLIST,
    [shortlistByEmployer, employer.id],
  );
  const toggleShortlist = useShortlist((s) => s.toggle);

  /* ---------------- render ---------------- */

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-6 md:py-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Search candidates
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {filteredCount} candidate{filteredCount === 1 ? "" : "s"} in view
            {filtered.hasSignal && filtered.matched.length > 0 ? (
              <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-1 align-middle text-[13px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {filtered.matched.length} match
              </span>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {filters.sort === "skill_match" && filters.skills.length > 0
              ? `Sorted by skill-match against ${filters.skills.length} required skill${filters.skills.length === 1 ? "" : "s"}.`
              : hasSub
                ? "Click any card to view their full CV. Right-click to shortlist."
                : "Subscribe to Unlock Full Candidate Profiles and their Contact Details"}
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
                  Subscribe to Unlock Full Candidate Profiles and their Contact Details
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

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <div className="sticky top-4">
              <CandidateFilterPanel
                state={filters}
                onChange={setFilters}
                candidates={items}
                activeJobs={activeJobs}
                onSave={handleSaveSearch}
              />
            </div>
          </div>

          <div>
            <RecentlyViewedStrip />
            <SavedSearchStrip onApply={setFilters} />

            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, skill, company, specialization..."
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    aria-label="Clear"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition lg:hidden",
                  activeFacetCount(filters) > 0
                    ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                ].join(" ")}
              >
                <Filter size={13} />
                Filters
                {activeFacetCount(filters) > 0 && (
                  <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">
                    {activeFacetCount(filters)}
                  </span>
                )}
              </button>
            </div>

            <ActiveFacetChips filters={filters} onChange={setFilters} />

            {filteredCount === 0 ? (
              <EmptyState />
            ) : (
              <MapListLayout
                markerTone="sky"
                listColumns={1}
                items={(() => {
                  const rowFor = (
                    { user, profile }: { user: User; profile: CandidateProfile },
                    i: number,
                  ): MapListItem => {
                    const lat = profile.preferredLat ?? profile.currentLat;
                    const lng = profile.preferredLng ?? profile.currentLng;
                    // Prefer the unified 100-point match against the
                    // employer's own active jobs (best-fit) so the number
                    // shown to the employer is the same score the candidate
                    // would see on the candidate side. Falls back to the
                    // legacy 0-1 skill fraction only when the employer has
                    // no active jobs yet AND has typed a skills filter.
                    const score = activeJobs.length > 0
                      ? Math.max(...activeJobs.map((j) => candidateJobScore(j, profile).score)) / 100
                      : filters.skills.length > 0
                        ? skillMatchScore(profile, filters)
                        : null;
                    const shortlisted = shortlistIds.includes(user.id);
                    return {
                      id: user.id,
                      lat,
                      lng,
                      listElement: (
                        <CandidateCard
                          user={user}
                          profile={profile}
                          hasSub={hasSub}
                          delay={Math.min(i, 8) * 0.03}
                          matchScore={score}
                          weeklyApps={weeklyApps[user.id] ?? 0}
                          shortlisted={shortlisted}
                          onToggleShortlist={() => toggleShortlist(employer.id, user.id)}
                        />
                      ),
                      popupElement: <CandidatePopup user={user} profile={profile} hasSub={hasSub} />,
                    };
                  };

                  const rows: MapListItem[] = [];
                  const showFeatured = filtered.hasSignal && filtered.matched.length > 0;
                  const total = filtered.others.length;

                  if (showFeatured) {
                    // Featured strip — the top-N matches with a lead-in
                    // chip so employers see the ranking at a glance.
                    rows.push({
                      id: "__separator_best__",
                      fullWidth: true,
                      listElement: (
                        <SectionSeparator
                          label="Best matches"
                          count={filtered.matched.length}
                          tone="brand"
                        />
                      ),
                    });
                    filtered.matched.forEach((it, i) =>
                      rows.push({ ...rowFor(it, i), id: `best_${it.user.id}` }),
                    );
                    // "All candidates" section — the full list (matches are a
                    // subset, they appear again here so the employer can scroll
                    // one continuous catalogue).
                    rows.push({
                      id: "__separator_all__",
                      fullWidth: true,
                      listElement: (
                        <SectionSeparator
                          label="All candidates"
                          count={total}
                          tone="zinc"
                        />
                      ),
                    });
                    filtered.others.forEach((it, i) => rows.push(rowFor(it, i)));
                  } else {
                    // No signal at all — just show the plain full list, no
                    // divider needed.
                    filtered.others.forEach((it, i) => rows.push(rowFor(it, i)));
                  }
                  return rows;
                })()}
                emptyState={<EmptyState />}
              />
            )}
          </div>
        </div>
      </main>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 flex bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            className="ml-auto h-full w-full max-w-sm bg-zinc-50 shadow-2xl dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-full p-3">
              <CandidateFilterPanel
                state={filters}
                onChange={setFilters}
                candidates={items}
                activeJobs={activeJobs}
                onSave={handleSaveSearch}
                onClose={() => setDrawerOpen(false)}
              />
            </div>
          </motion.div>
        </div>
      )}

      <ShortlistBar />
    </div>
  );
}

/* ---------------------------- active facet chips --------------------------- */

function ActiveFacetChips({
  filters,
  onChange,
}: {
  filters: CandidateFilterState;
  onChange: (next: CandidateFilterState) => void;
}) {
  const districts = useLocations((s) => s.districts);
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.nearJobId) {
    chips.push({
      key: "near",
      label: `Within ${filters.maxDistanceKm ?? 25} km`,
      onRemove: () => onChange({ ...filters, nearJobId: undefined, maxDistanceKm: undefined }),
    });
  }
  for (const id of filters.districtIds) {
    chips.push({
      key: `d_${id}`,
      label: districts.find((d) => d.id === id)?.name ?? id,
      onRemove: () => onChange({ ...filters, districtIds: filters.districtIds.filter((x) => x !== id) }),
    });
  }
  if (filters.field) {
    chips.push({
      key: "field",
      label: filters.field === "it" ? "IT" : "Non-IT",
      onRemove: () => onChange({ ...filters, field: undefined }),
    });
  }
  if (filters.candidateType) {
    chips.push({
      key: "type",
      label: filters.candidateType === "fresher" ? "Fresher" : "Experienced",
      onRemove: () => onChange({ ...filters, candidateType: undefined }),
    });
  }
  if (filters.yearsMin != null || filters.yearsMax != null) {
    chips.push({
      key: "years",
      label: `${filters.yearsMin ?? 0}–${filters.yearsMax ?? "∞"} yrs`,
      onRemove: () => onChange({ ...filters, yearsMin: undefined, yearsMax: undefined }),
    });
  }
  for (const lvl of filters.educationLevels) {
    chips.push({
      key: `e_${lvl}`,
      label: lvl.toUpperCase(),
      onRemove: () => onChange({ ...filters, educationLevels: filters.educationLevels.filter((x) => x !== lvl) }),
    });
  }
  for (const s of filters.skills) {
    chips.push({
      key: `s_${s}`,
      label: s,
      onRemove: () => onChange({ ...filters, skills: filters.skills.filter((x) => x !== s) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-100 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
        >
          {c.label}
          <X size={11} />
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ cards + popup ------------------------------ */

function CandidateCard({
  user,
  profile,
  hasSub,
  delay,
  matchScore,
  weeklyApps,
  shortlisted,
  onToggleShortlist,
}: {
  user: User;
  profile: CandidateProfile;
  hasSub: boolean;
  delay: number;
  matchScore: number | null;
  weeklyApps: number;
  shortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  const navigate = useNavigate();
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const skills =
    profile.type === "experienced"
      ? profile.topSkills ?? []
      : profile.field === "it"
        ? profile.itLanguages ?? []
        : profile.nonItDepartments ?? [];
  const role =
    profile.type === "experienced"
      ? `${profile.yearsOfExperience ?? "—"} years experience`
      : profile.field === "it"
        ? `Aspiring ${profile.itSpecialization ?? "IT"}`
        : profile.field === "non_it"
          ? `Aspiring ${profile.nonItDepartments?.[0] ?? "Non-IT"}`
          : "Candidate";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onContextMenu={(e) => {
        // Right-click toggles shortlist without opening the browser menu.
        // On touch devices this is unreachable — the explicit bookmark
        // button in the top-right of each card is the fallback.
        e.preventDefault();
        onToggleShortlist();
      }}
    >
      <Link
        to={`/employer/candidates/${user.id}`}
        className={[
          "group relative flex h-full flex-col rounded-3xl p-5 transition hover:-translate-y-1 hover:shadow-xl",
          shortlisted
            ? "border-2 border-violet-500 bg-violet-50/50 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 dark:bg-violet-500/5"
            : "bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] hover:border-sky-300 hover:shadow-sky-500/10 dark:bg-zinc-900 dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:hover:border-sky-500/40",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleShortlist();
          }}
          className={[
            "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full transition",
            shortlisted
              ? "bg-violet-500 text-white shadow-md shadow-violet-500/40 hover:bg-violet-600"
              : "border border-zinc-200 bg-white text-zinc-400 hover:border-violet-300 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-500/40",
          ].join(" ")}
          aria-label={shortlisted ? `Remove ${user.name} from shortlist` : `Add ${user.name} to shortlist`}
          title={shortlisted ? "Shortlisted — click to remove" : "Add to shortlist (right-click also works)"}
        >
          {shortlisted ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>

        <div className="flex items-start gap-3 pr-10">
          {profile.photoDataUrl ? (
            <img
              src={profile.photoDataUrl}
              alt=""
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-800"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-base font-bold text-white shadow-md shadow-sky-500/30">
              {initials || "—"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="truncate text-base font-semibold tracking-tight">
                {hasSub ? user.name : "•••••• ••••••"}
              </h2>
              {matchScore != null && <MatchBadge score={matchScore} />}
            </div>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">{role}</p>
          </div>
          <ChevronRight
            size={18}
            className="mt-1 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold">
          {profile.preferredLocation && (
            <Pill icon={<MapPin size={10} />} color="zinc">
              <span className="inline-block max-w-[8rem] truncate align-middle" title={profile.preferredLocation}>
                {profile.preferredLocation}
              </span>
            </Pill>
          )}
          {profile.field === "it" && (
            <Pill icon={<Code2 size={10} />} color="sky">
              IT
            </Pill>
          )}
          {profile.field === "non_it" && (
            <Pill icon={<Building2 size={10} />} color="amber">
              Non-IT
            </Pill>
          )}
          {profile.type === "fresher" && (
            <Pill icon={<Sparkles size={10} />} color="emerald">
              Fresher
            </Pill>
          )}
          {profile.type === "experienced" && (
            <Pill icon={<Briefcase size={10} />} color="violet">
              {profile.yearsOfExperience ? `${profile.yearsOfExperience} yrs` : "Experienced"}
            </Pill>
          )}
          {weeklyApps >= 3 ? (
            <Pill icon={<Flame size={10} />} color="rose">
              Active · {weeklyApps} this week
            </Pill>
          ) : weeklyApps > 0 ? (
            <Pill icon={<TrendingUp size={10} />} color="emerald">
              Applied recently
            </Pill>
          ) : null}
        </div>

        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {skills.slice(0, 5).map((s) => (
              <span
                key={s}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {!hasSub && (
          <button
            type="button"
            onClick={(e) => {
              // The whole card is wrapped in a <Link> to the candidate
              // detail page — stop that navigation from firing and route
              // the employer straight to the plans page instead.
              e.preventDefault();
              e.stopPropagation();
              navigate("/employer/subscribe");
            }}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:border-amber-500/60 dark:hover:bg-amber-500/20"
          >
            <span className="inline-flex items-center gap-2">
              <Lock size={12} /> Full profile locked — subscribe to view
            </span>
            <ChevronRight size={12} className="shrink-0" />
          </button>
        )}

        {shortlisted && (
          <p className="mt-2 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
            Shortlisted — click the bookmark to remove
          </p>
        )}
      </Link>
    </motion.div>
  );
}

function CandidatePopup({ user, profile, hasSub }: { user: User; profile: CandidateProfile; hasSub: boolean }) {
  const navigate = useNavigate();
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const role =
    profile.type === "experienced"
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
      {!hasSub && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate("/employer/subscribe");
          }}
          className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
        >
          <Lock size={9} /> Subscribe to view
        </button>
      )}
    </Link>
  );
}

/* --------------------------------- helpers -------------------------------- */

function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 80
      ? "from-emerald-500 to-emerald-600 shadow-emerald-500/30"
      : pct >= 50
        ? "from-amber-500 to-orange-500 shadow-orange-500/30"
        : "from-zinc-400 to-zinc-500 shadow-zinc-500/20";
  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full bg-gradient-to-r px-2 py-0.5 text-[10px] font-bold text-white shadow-sm tabular-nums",
        tone,
      ].join(" ")}
      title={`${pct}% skill match`}
    >
      {pct}%
    </span>
  );
}

const PILL_COLORS = {
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <Search size={32} className="text-zinc-400" />
      <p className="mt-3 text-sm font-semibold">No suitable candidates found for your selected filters.</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Try widening your search, or wait until we find relevant profiles for you.
      </p>
    </div>
  );
}

/**
 * Best-effort default name for a new saved search — makes the naming
 * prompt one-tap for the common case instead of forcing the employer to
 * type a description from scratch.
 */
function suggestSearchName(
  f: CandidateFilterState,
  districts: { id: string; name: string }[],
): string {
  const bits: string[] = [];
  if (f.districtIds.length === 1) bits.push(districts.find((d) => d.id === f.districtIds[0])?.name ?? "");
  else if (f.districtIds.length > 1) bits.push(`${f.districtIds.length} districts`);
  if (f.field) bits.push(f.field === "it" ? "IT" : "Non-IT");
  if (f.skills.length > 0) bits.push(f.skills.slice(0, 2).join(" + "));
  if (f.candidateType === "fresher") bits.push("freshers");
  else if (f.candidateType === "experienced") {
    if (f.yearsMin != null) bits.push(`${f.yearsMin}+ yrs`);
    else bits.push("experienced");
  }
  return bits.filter(Boolean).join(" · ") || "My search";
}
