// Thin wrapper around localStorage / sessionStorage so we can swap to a
// real backend later without touching components.

type Storage = "local" | "session";

const store = (s: Storage) => (s === "local" ? localStorage : sessionStorage);

export const get = <T>(key: string, fallback: T, s: Storage = "local"): T => {
  const raw = store(s).getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const set = <T>(key: string, value: T, s: Storage = "local"): void => {
  store(s).setItem(key, JSON.stringify(value));
};

export const remove = (key: string, s: Storage = "local"): void => {
  store(s).removeItem(key);
};

export const KEYS = {
  theme: "itr.theme",
  currentUser: "itr.currentUser",
  users: "itr.users",
  candidateProfiles: "itr.candidateProfiles",
  jobs: "itr.jobs",
  subscriptions: "itr.subscriptions",
  // Employer-side prefs (2026-07): saved candidate searches, shortlist,
  // recently viewed. Keyed by employer id inside the value blob so
  // multiple employers sharing a browser stay isolated.
  employerSavedSearches: "itr.employer.savedSearches",
  employerShortlist: "itr.employer.shortlist",
  employerRecentCandidates: "itr.employer.recentCandidates",
  otp: (email: string) => `itr.otp.${email}`,
} as const;
