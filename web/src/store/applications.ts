import { create } from "zustand";
import { get as load, set as save } from "../lib/storage";

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
  apply: (userId: string, jobId: string) => Application | null;
  hasApplied: (userId: string, jobId: string) => boolean;
  toggleSave: (userId: string, jobId: string) => void;
  isSaved: (userId: string, jobId: string) => boolean;
  appsFor: (userId: string) => Application[];
  savedFor: (userId: string) => string[];
}

export const useApplications = create<AppsState>((set, get) => ({
  applications: load<Application[]>(APPS_KEY, []),
  saved: load<Record<string, string[]>>(SAVED_KEY, {}),

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
    const next = cur.includes(jobId)
      ? cur.filter((id) => id !== jobId)
      : [jobId, ...cur];
    all[userId] = next;
    save(SAVED_KEY, all);
    set({ saved: all });
  },

  isSaved: (userId, jobId) => (get().saved[userId] ?? []).includes(jobId),

  appsFor: (userId) =>
    get().applications.filter((a) => a.userId === userId),

  savedFor: (userId) => get().saved[userId] ?? [],
}));
