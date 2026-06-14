import { create } from "zustand";
import { get as load, set as save, remove, KEYS } from "../lib/storage";
import { apiEnabled, ApiError } from "../lib/api";
import { authApi, type ApiUser } from "../lib/api/auth";

export type Role = "candidate" | "employer" | "admin" | "super_admin";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  emailVerified: boolean;
  createdAt: string;
}

/** Map backend's uppercase enum back to the lowercase shape the UI uses. */
function fromApiUser(u: ApiUser): User {
  const roleMap: Record<ApiUser["role"], Role> = {
    CANDIDATE: "candidate",
    EMPLOYER: "employer",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin",
  };
  return {
    id: u.id,
    role: roleMap[u.role],
    name: u.name,
    email: u.email,
    mobile: u.mobile ?? undefined,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

interface RegisterInput {
  role: Role;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
}

interface AuthState {
  currentUser: User | null;

  /**
   * Whether `init()` has run. Pages can show a tiny "loading session" while
   * we hit /auth/me on first paint, but it's not strictly required.
   */
  initialized: boolean;

  /** Backend has the canonical session. We use this to skip localStorage. */
  isApiMode: boolean;

  /** Restore the session on app boot. No-op in localStorage mode. */
  init: () => Promise<void>;

  /* ------------------ Async API-aware flows ------------------ */

  /**
   * Server-side register OR local fallback. Returns the newly-created user.
   * In API mode the response also includes the dev OTP code (when the
   * backend's ENABLE_DEV_OTP flag is on) so the verify page can autofill.
   */
  registerAsync: (input: RegisterInput) => Promise<{ user: User; devCode?: string }>;

  /** Server-side OTP issue OR local fallback. */
  loginAsync: (email: string) => Promise<{ devCode?: string }>;

  /** Server-side OTP verify; on success, currentUser is set + persisted. */
  verifyOtpAsync: (input: { email: string; code: string; purpose: "register" | "login" }) => Promise<User>;

  logoutAsync: () => Promise<void>;

  /* ------------------ Legacy sync helpers (localStorage-only) ------------------ */

  register: (data: RegisterInput) => User;
  markVerified: (email: string) => void;
  loginByEmail: (email: string) => User | null;
  logout: () => void;
  findByEmail: (email: string) => User | null;
}

const userId = () => "u_" + Math.random().toString(36).slice(2, 10);

export const useAuth = create<AuthState>((set, get) => ({
  currentUser: load<User | null>(KEYS.currentUser, null),
  initialized: false,
  isApiMode: apiEnabled,

  init: async () => {
    if (get().initialized) return;
    if (!apiEnabled) {
      set({ initialized: true });
      return;
    }
    try {
      const { user } = await authApi.me();
      const u = fromApiUser(user);
      save(KEYS.currentUser, u);
      set({ currentUser: u, initialized: true });
    } catch (err) {
      // 401 = no session. Anything else (network, CORS) — leave local cached
      // user in place so the UI degrades gracefully; the next API call will
      // surface the real error.
      if (err instanceof ApiError && err.status === 401) {
        remove(KEYS.currentUser);
        set({ currentUser: null });
      }
      set({ initialized: true });
    }
  },

  registerAsync: async (input) => {
    if (apiEnabled) {
      const apiRole = input.role === "candidate" ? "CANDIDATE" : "EMPLOYER";
      const res = await authApi.register({
        role: apiRole,
        name: input.name,
        email: input.email,
        mobile: input.mobile,
      });
      // Backend hasn't returned the full user — synthesise a pending one for the
      // verify-page UI. It'll be replaced with the canonical record once the OTP
      // is verified.
      const pending: User = {
        id: res.userId,
        role: input.role,
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        company: input.company,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };
      return { user: pending, devCode: res.devCode };
    }
    return { user: get().register(input) };
  },

  loginAsync: async (email) => {
    if (apiEnabled) {
      const res = await authApi.login(email);
      return { devCode: res.devCode };
    }
    // localStorage mode: nothing to "request" — just check the user exists.
    const u = get().findByEmail(email);
    if (!u) throw new ApiError(404, "USER_NOT_FOUND", "No account with that email.");
    return {};
  },

  verifyOtpAsync: async ({ email, code, purpose }) => {
    if (apiEnabled) {
      const res = await authApi.verifyOtp({
        email,
        code,
        purpose: purpose === "register" ? "REGISTER" : "LOGIN",
      });
      const u = fromApiUser(res.user);
      save(KEYS.currentUser, u);
      set({ currentUser: u });
      return u;
    }
    // localStorage mode — the legacy lib/otp.ts has already validated.
    if (purpose === "login") {
      const u = get().loginByEmail(email);
      if (!u) throw new ApiError(404, "USER_NOT_FOUND", "No account with that email.");
      return u;
    }
    get().markVerified(email);
    const u = get().currentUser;
    if (!u) throw new ApiError(500, "VERIFY_FAILED", "Verification did not complete.");
    return u;
  },

  logoutAsync: async () => {
    if (apiEnabled) {
      // Best effort — even if the network call fails we still clear the local
      // cookie + state so the user isn't stuck on a 'logged in' UI.
      try { await authApi.logout(); } catch { /* swallow */ }
    }
    remove(KEYS.currentUser);
    set({ currentUser: null });
  },

  /* ---------- legacy sync helpers used by the localStorage flow ---------- */

  register: ({ role, name, email, mobile, company }) => {
    const users = load<User[]>(KEYS.users, []);
    const existing = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) return existing;

    const next: User = {
      id: userId(),
      role,
      name,
      email,
      mobile,
      company,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    save(KEYS.users, [next, ...users]);
    return next;
  },

  markVerified: (email) => {
    const users = load<User[]>(KEYS.users, []);
    const updated = users.map((u) =>
      u.email.toLowerCase() === email.toLowerCase() ? { ...u, emailVerified: true } : u
    );
    save(KEYS.users, updated);

    const user = updated.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    if (user) {
      save(KEYS.currentUser, user);
      set({ currentUser: user });
    }
  },

  loginByEmail: (email) => {
    const users = load<User[]>(KEYS.users, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    if (!user) return null;
    save(KEYS.currentUser, user);
    set({ currentUser: user });
    return user;
  },

  logout: () => {
    remove(KEYS.currentUser);
    set({ currentUser: null });
  },

  findByEmail: (email) => {
    const users = load<User[]>(KEYS.users, []);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
}));

/** All registered users (helper for admin-y views). localStorage only for now. */
export function allUsers(): User[] {
  return load<User[]>(KEYS.users, []);
}
