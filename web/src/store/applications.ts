import { create } from "zustand";
import { get as load, set as save } from "../lib/storage";
import { apiEnabled } from "../lib/api";
import { jobsApi } from "../lib/api/jobs";

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  appliedAt: string;
  status: "submitted" | "shortlisted" | "rejected";
}

const APPS_KEY = "itr.applications";
const SAVED_KEY = "itr.savedJobs";

interface AppsState {
  applications: Application[];
  saved: Record<string, string[]>; // userId -> jobId[]

  /* ---- legacy sync methods (localStorage fallback) ---- */
  apply: (userId: string, jobId: string) => Application | null;
  hasApplied: (userId: string, jobId: string) => boolean;
  toggleSave: (userId: string, jobId: string) => void;
  isSaved: (userId: string, jobId: string) => boolean;
  appsFor: (userId: string) => Application[];
  savedFor: (userId: string) => string[];

  /* ---- async API-aware methods ---- */

  /** POST /jobs/:jobId/apply, then mirror into local cache. Returns the new application. */
  applyAsync: (userId: string, jobId: string, opts?: { matchScore?: number }) => Promise<Application | null>;
  /** Toggle saved-state via /candidate/saved-jobs, mirror locally. */
  toggleSaveAsync: (userId: string, jobId: string) => Promise<void>;
  /** GET /candidate/applications → replace local list for this user. */
  fetchMyApplications: (userId: string) => Promise<void>;
  /** GET /candidate/saved-jobs → replace local list for this user. */
  fetchMySavedJobs: (userId: string) => Promise<void>;
}

const STATUS_FROM_API: Record<string, Application["status"]> = {
  APPLIED: "submitted",
  VIEWED: "submitted",
  SHORTLISTED: "shortlisted",
  INTERVIEW: "shortlisted",
  REJECTED: "rejected",
  HIRED: "shortlisted",
  WITHDRAWN: "rejected",
};

export const useApplications = create<AppsState>((set, get) => ({
  applications: load<Application[]>(APPS_KEY, []),
  saved: load<Record<string, string[]>>(SAVED_KEY, {}),

  /* ---------- legacy sync ---------- */

  apply: (userId, jobId) => {
    const list = get().applications;
    if (list.some((a) => a.userId === userId && a.jobId === jobId)) return null;
    const next: Application = {
      id: "app_" + Math.random().toString(36).slice(2, 10),
      userId,
      jobId,
      appliedAt: new Date().toISOString(),
      status: "submitted",
    };
    const updated = [next, ...list];
    save(APPS_KEY, updated);
    set({ applications: updated });
    return next;
  },

  hasApplied: (userId, jobId) =>
    get().applications.some((a) => a.userId === userId && a.jobId === jobId),

  toggleSave: (userId, jobId) => {
    const all = { ...get().saved };
    const cur = all[userId] ?? [];
    const next = cur.includes(jobId) ? cur.filter((id) => id !== jobId) : [jobId, ...cur];
    all[userId] = next;
    save(SAVED_KEY, all);
    set({ saved: all });
  },

  isSaved: (userId, jobId) => (get().saved[userId] ?? []).includes(jobId),

  appsFor: (userId) => get().applications.filter((a) => a.userId === userId),

  savedFor: (userId) => get().saved[userId] ?? [],

  /* ---------- async API-aware ---------- */

  applyAsync: async (userId, jobId, opts = {}) => {
    if (!apiEnabled) return get().apply(userId, jobId);
    const { application } = await jobsApi.apply(jobId, { matchScore: opts.matchScore });
    const next: Application = {
      id: application.id,
      userId,
      jobId,
      appliedAt: application.appliedAt,
      status: STATUS_FROM_API[application.status] ?? "submitted",
    };
    // Replace any stale local entry for the same (userId, jobId) — keeps the
    // optimistic-then-confirmed scenarios clean.
    const list = [next, ...get().applications.filter((a) => !(a.userId === userId && a.jobId === jobId))];
    save(APPS_KEY, list);
    set({ applications: list });
    return next;
  },

  toggleSaveAsync: async (userId, jobId) => {
    const isAlreadySaved = get().isSaved(userId, jobId);
    if (!apiEnabled) {
      get().toggleSave(userId, jobId);
      return;
    }
    if (isAlreadySaved) await jobsApi.unsave(jobId);
    else await jobsApi.save(jobId);
    // Mirror to the local map either way.
    get().toggleSave(userId, jobId);
  },

  fetchMyApplications: async (userId) => {
    if (!apiEnabled) return;
    try {
      const { items } = await jobsApi.myApplications();
      const next: Application[] = items.map((a) => ({
        id: a.id,
        userId,
        jobId: a.jobId,
        appliedAt: a.appliedAt,
        status: STATUS_FROM_API[a.status] ?? "submitted",
      }));
      // Replace this user's entries only — preserves other users' local data
      // in case the same browser is shared.
      const others = get().applications.filter((a) => a.userId !== userId);
      const merged = [...next, ...others];
      save(APPS_KEY, merged);
      set({ applications: merged });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[applications.fetchMyApplications] failed", err);
    }
  },

  fetchMySavedJobs: async (userId) => {
    if (!apiEnabled) return;
    try {
      const { items } = await jobsApi.mySavedJobs();
      const all = { ...get().saved };
      all[userId] = items.map((i) => i.jobId);
      save(SAVED_KEY, all);
      set({ saved: all });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[applications.fetchMySavedJobs] failed", err);
    }
  },
}));
