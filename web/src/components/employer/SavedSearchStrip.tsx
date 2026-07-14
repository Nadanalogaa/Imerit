import { useMemo } from "react";
import { Bell, BellOff, Bookmark, X } from "lucide-react";
import { useAuth } from "../../store/auth";
import { useSavedSearches, type SavedCandidateSearch } from "../../store/employerPrefs";
import type { CandidateFilterState } from "../../lib/employerFilters";

/** Shared empty fallback — see RecentlyViewedStrip for the rationale. */
const EMPTY_SEARCHES: SavedCandidateSearch[] = [];

/**
 * Horizontal strip of the employer's saved candidate searches. Rendered
 * above the candidate list so 1-click re-apply is always in reach. Bell
 * icon toggles new-match notifications; the × removes the search.
 */
export function SavedSearchStrip({
  onApply,
}: {
  onApply: (filters: CandidateFilterState) => void;
}) {
  const employer = useAuth((s) => s.currentUser);
  // Select the raw array; filter/memoise per employer downstream. Wrapping
  // `.filter()` inside the selector itself would return a fresh array each
  // render and trip Zustand's snapshot-cache invariant.
  const allSearches = useSavedSearches((s) => s.all);
  const searches = useMemo(
    () => (employer ? allSearches.filter((s) => s.employerId === employer.id) : EMPTY_SEARCHES),
    [allSearches, employer?.id],
  );
  const toggleNotify = useSavedSearches((s) => s.toggleNotify);
  const remove = useSavedSearches((s) => s.remove);

  if (!employer || searches.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Bookmark size={11} className="text-brand-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          Saved searches
        </span>
        <span className="rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-brand-700 dark:text-brand-300">
          {searches.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {searches.map((s) => (
          <div
            key={s.id}
            className="group inline-flex items-center gap-1 rounded-full border border-brand-200 bg-gradient-to-r from-orange-50 to-amber-50 pl-2.5 pr-1 py-1 text-[11.5px] font-semibold text-brand-800 shadow-sm transition hover:border-brand-400 dark:border-brand-500/30 dark:from-brand-500/10 dark:to-orange-500/10 dark:text-brand-300"
          >
            <button
              type="button"
              onClick={() => onApply(s.filters)}
              className="max-w-[220px] truncate transition hover:opacity-70"
              title={`Apply "${s.name}"`}
            >
              <Bookmark size={10} className="mr-1 inline text-brand-500" />
              {s.name}
            </button>
            <button
              type="button"
              onClick={() => toggleNotify(s.id)}
              className={[
                "inline-flex h-5 w-5 items-center justify-center rounded-full transition",
                s.notify
                  ? "text-brand-600 hover:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-500/20"
                  : "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800",
              ].join(" ")}
              title={s.notify ? "Notifications on — new matches will show in the bell" : "Notifications off"}
            >
              {s.notify ? <Bell size={10} /> : <BellOff size={10} />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${s.name}"?`)) remove(s.id);
              }}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-100 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
              aria-label={`Delete ${s.name}`}
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
