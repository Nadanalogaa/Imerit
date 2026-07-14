import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";
import type { CandidateFilterState } from "../lib/employerFilters";

// ============================================================================
// Saved searches — named CandidateFilterState blobs the employer can re-apply
// with one click, plus an optional "notify me on new matches" toggle used by
// the notification bell.
// ============================================================================

/**
 * A named + persisted candidate-search filter. `knownCandidateIds` is the
 * snapshot of match IDs from the last reconciliation; the notification bell
 * diffs the current match set against this to surface only NEW hits.
 */
export interface SavedCandidateSearch {
  id: string;
  employerId: string;
  name: string;
  filters: CandidateFilterState;
  notify: boolean;
  knownCandidateIds: string[];
  createdAt: string;
}

interface SavedSearchesState {
  all: SavedCandidateSearch[];
  forEmployer: (employerId: string) => SavedCandidateSearch[];
  add: (input: {
    employerId: string;
    name: string;
    filters: CandidateFilterState;
    notify?: boolean;
    initialCandidateIds?: string[];
  }) => SavedCandidateSearch;
  toggleNotify: (id: string) => void;
  remove: (id: string) => void;
  /**
   * Mark the current match set as "seen" — called after the notification
   * bell has rendered a search's fresh matches once, so the next fire only
   * shows NEW hits.
   */
  reconcile: (id: string, knownCandidateIds: string[]) => void;
}

export const useSavedSearches = create<SavedSearchesState>((set, get) => ({
  all: load<SavedCandidateSearch[]>(KEYS.employerSavedSearches, []),

  forEmployer: (employerId) => get().all.filter((s) => s.employerId === employerId),

  add: ({ employerId, name, filters, notify = false, initialCandidateIds = [] }) => {
    const search: SavedCandidateSearch = {
      id: `sav_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      employerId,
      name,
      filters,
      notify,
      // Seed the "known" set with the currently-matching IDs so the bell
      // doesn't fire for every existing candidate the moment the search is
      // saved.
      knownCandidateIds: initialCandidateIds,
      createdAt: new Date().toISOString(),
    };
    const next = [search, ...get().all];
    save(KEYS.employerSavedSearches, next);
    set({ all: next });
    return search;
  },

  toggleNotify: (id) => {
    const next = get().all.map((s) => (s.id === id ? { ...s, notify: !s.notify } : s));
    save(KEYS.employerSavedSearches, next);
    set({ all: next });
  },

  remove: (id) => {
    const next = get().all.filter((s) => s.id !== id);
    save(KEYS.employerSavedSearches, next);
    set({ all: next });
  },

  reconcile: (id, knownCandidateIds) => {
    const next = get().all.map((s) => (s.id === id ? { ...s, knownCandidateIds } : s));
    save(KEYS.employerSavedSearches, next);
    set({ all: next });
  },
}));

// ============================================================================
// Shortlist — per-employer set of candidate IDs, persisted so re-opening
// the app keeps the shortlist intact for follow-up.
// ============================================================================

interface ShortlistState {
  byEmployer: Record<string, string[]>;
  forEmployer: (employerId: string) => string[];
  contains: (employerId: string, candidateId: string) => boolean;
  toggle: (employerId: string, candidateId: string) => void;
  clear: (employerId: string) => void;
}

export const useShortlist = create<ShortlistState>((set, get) => ({
  byEmployer: load<Record<string, string[]>>(KEYS.employerShortlist, {}),

  forEmployer: (employerId) => get().byEmployer[employerId] ?? [],

  contains: (employerId, candidateId) => (get().byEmployer[employerId] ?? []).includes(candidateId),

  toggle: (employerId, candidateId) => {
    const cur = get().byEmployer[employerId] ?? [];
    const next = cur.includes(candidateId)
      ? cur.filter((id) => id !== candidateId)
      : [...cur, candidateId];
    const merged = { ...get().byEmployer, [employerId]: next };
    save(KEYS.employerShortlist, merged);
    set({ byEmployer: merged });
  },

  clear: (employerId) => {
    const merged = { ...get().byEmployer, [employerId]: [] };
    save(KEYS.employerShortlist, merged);
    set({ byEmployer: merged });
  },
}));

// ============================================================================
// Recently viewed candidates — per-employer list, capped at 10 entries,
// dedup + move-to-front. Persisted so an employer's browsing history
// survives a page reload.
// ============================================================================

const RECENT_CAP = 10;

interface RecentCandidatesState {
  byEmployer: Record<string, string[]>;
  forEmployer: (employerId: string) => string[];
  /** Move `candidateId` to the front (dedup + trim to RECENT_CAP). */
  push: (employerId: string, candidateId: string) => void;
  clear: (employerId: string) => void;
}

export const useRecentCandidates = create<RecentCandidatesState>((set, get) => ({
  byEmployer: load<Record<string, string[]>>(KEYS.employerRecentCandidates, {}),

  forEmployer: (employerId) => get().byEmployer[employerId] ?? [],

  push: (employerId, candidateId) => {
    const cur = get().byEmployer[employerId] ?? [];
    const next = [candidateId, ...cur.filter((id) => id !== candidateId)].slice(0, RECENT_CAP);
    const merged = { ...get().byEmployer, [employerId]: next };
    save(KEYS.employerRecentCandidates, merged);
    set({ byEmployer: merged });
  },

  clear: (employerId) => {
    const merged = { ...get().byEmployer, [employerId]: [] };
    save(KEYS.employerRecentCandidates, merged);
    set({ byEmployer: merged });
  },
}));
