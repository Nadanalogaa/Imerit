import { create } from "zustand";
import { get as load, set as save, remove, KEYS } from "../lib/storage";
import { apiEnabled, ApiError } from "../lib/api";
import { authApi, type ApiUser } from "../lib/api/auth";

export type Role = "candidate" | "employer" | "admin" | "super_admin" | "staff";

/** Higher-privilege roles transparently satisfy any lower-privilege gate. */
const ROLE_GRANTS: Record<Role, readonly Role[]> = {
  candidate: ["candidate"],
  employer: ["employer"],
  admin: ["admin"],
  super_admin: ["super_admin", "admin"],
  // Staff is a distinct internal lane — they can act on the employer master
  // and post jobs on behalf of employers, but they don't inherit
  // employer/admin privileges. Kept siloed so a compromised staff account
  // can never read an employer's applications or reach admin surfaces.
  staff: ["staff"],
};

export const HOME_PATH: Record<Role, string> = {
  candidate: "/candidate/dashboard",
  employer: "/employer/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super-admin/dashboard",
  staff: "/staff/dashboard",
};

export const LOGIN_PATH: Record<Role, string> = {
  candidate: "/candidate/login",
  employer: "/employer/login",
  admin: "/admin",
  super_admin: "/super-admin",
  staff: "/staff/login",
};

export function hasRole(actual: Role, required: Role): boolean {
  return ROLE_GRANTS[actual].includes(required);
}

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  emailVerified: boolean;
  createdAt: string;

  /**
   * Only set on employer users that were created BY staff via the Employer
   * Master flow. Holds the plaintext password we generated so staff can
   * look it up + share it manually until real email is wired.
   *
   * SECURITY: this is a stopgap. Once the email pipeline lands we'll:
   * (1) email the credential on create, (2) drop this field from the
   * shape, (3) migrate away by nulling it on the backend. Self-registered
   * employers never carry a value here.
   */
  sharedPassword?: string;

  /** Optional — records which staff user provisioned this employer. */
  createdByStaffId?: string;

  /** Soft-deactivate flag — set from super-admin's staff manager. */
  deactivated?: boolean;
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

  /* --------------- Staff + Employer Master (localStorage-only) --------------- */

  /**
   * Password-based login used by staff and by employers whose accounts
   * were provisioned by staff. Returns the matched user or null.
   *
   * Staff always authenticate this way (no OTP for the internal role).
   * Employers can *also* authenticate this way when their creds came
   * from staff — otherwise they use the normal OTP flow.
   */
  passwordLogin: (email: string, password: string) => User | null;

  /**
   * Super-admin creates a staff account. Password is generated + surfaced
   * once in the CredentialShareModal so the super-admin can hand it over.
   */
  createStaff: (input: { name: string; email: string; mobile?: string }) => { user: User; password: string };

  /**
   * Staff creates a new employer in the Employer Master. Password is
   * generated automatically and stored on the employer row so staff can
   * copy it later from the master view.
   */
  createEmployerByStaff: (input: {
    staffId: string;
    name: string;
    email: string;
    mobile?: string;
    company?: string;
  }) => { user: User; password: string };

  /**
   * Overwrite any shared-password user's credential (staff OR employer)
   * with a freshly-generated one. Returns the new plaintext password so
   * the caller can hand it off via CredentialShareModal.
   *
   * The role check is intentionally loose — an id belonging to a user
   * without a `sharedPassword` still gets one on reset, which is the
   * right behavior for cases where a self-registered employer wants to
   * be given a shared credential.
   */
  resetSharedPassword: (userId: string) => string;

  /**
   * Set an explicit password on any user — used by the super-admin's
   * "Change password" flow so they can pick a memorable string instead
   * of accepting the generated one. Same session-sync behavior as
   * `resetSharedPassword`.
   *
   * The caller is responsible for validating the password (length,
   * complexity) — the store just persists whatever it's given.
   */
  setSharedPassword: (userId: string, password: string) => void;

  /** @deprecated Prefer `resetSharedPassword`. Kept as a thin alias so
   *  existing staff-facing employer flows don't need to churn. */
  resetEmployerPassword: (employerId: string) => string;

  /** Patch limited fields on an existing employer (staff-owned edit). */
  updateEmployer: (
    employerId: string,
    patch: Partial<Pick<User, "name" | "mobile" | "company">>,
  ) => void;

  /** Toggle the `deactivated` flag — used by the super-admin staff manager. */
  setDeactivated: (userId: string, deactivated: boolean) => void;
}

const userId = () => "u_" + Math.random().toString(36).slice(2, 10);

/**
 * Generate a memorable-ish password for staff-provisioned employer + staff
 * accounts. 10 chars, mixes upper/lower/digits — enough entropy for a
 * pre-launch stopgap, easy enough to type over the phone.
 */
function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion with 1/0
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  // Guarantee at least one of each class so the password meets the "mixed"
  // bar most people expect at a glance.
  const chars = [pick(upper), pick(lower), pick(digits)];
  while (chars.length < 10) chars.push(pick(all));
  // Fisher-Yates shuffle so the required class chars aren't always front-loaded.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

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

  /* ------------- Staff + Employer Master (localStorage-only) ------------- */

  passwordLogin: (email, password) => {
    const users = load<User[]>(KEYS.users, []);
    const match = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.sharedPassword &&
        u.sharedPassword === password,
    );
    if (!match) return null;
    if (match.deactivated) return null;
    // Auto-verify — the shared credential path bypasses OTP entirely.
    const verified: User = { ...match, emailVerified: true };
    const updated = users.map((u) => (u.id === match.id ? verified : u));
    save(KEYS.users, updated);
    save(KEYS.currentUser, verified);
    set({ currentUser: verified });
    return verified;
  },

  createStaff: ({ name, email, mobile }) => {
    const users = load<User[]>(KEYS.users, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      // Idempotent: if the email is already taken, hand back the same row
      // with a freshly-generated password so the super-admin can still
      // share creds. Prevents accidental orphaned dupes.
      const password = generatePassword();
      const next: User = { ...existing, role: "staff", sharedPassword: password, deactivated: false };
      save(KEYS.users, users.map((u) => (u.id === existing.id ? next : u)));
      return { user: next, password };
    }
    const password = generatePassword();
    const next: User = {
      id: userId(),
      role: "staff",
      name,
      email,
      mobile,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      sharedPassword: password,
    };
    save(KEYS.users, [next, ...users]);
    return { user: next, password };
  },

  createEmployerByStaff: ({ staffId, name, email, mobile, company }) => {
    const users = load<User[]>(KEYS.users, []);
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      // Duplicate email guard — surfaces up to the caller so it can show
      // a proper error instead of silently overwriting an existing row.
      throw new ApiError(409, "EMAIL_TAKEN", `An account already exists for ${email}.`);
    }
    const password = generatePassword();
    const next: User = {
      id: userId(),
      role: "employer",
      name,
      email,
      mobile,
      company,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      sharedPassword: password,
      createdByStaffId: staffId,
    };
    save(KEYS.users, [next, ...users]);
    return { user: next, password };
  },

  resetSharedPassword: (userId) => {
    const users = load<User[]>(KEYS.users, []);
    const target = users.find((u) => u.id === userId);
    if (!target) throw new ApiError(404, "NOT_FOUND", "Account not found.");
    const password = generatePassword();
    const next: User = { ...target, sharedPassword: password };
    save(KEYS.users, users.map((u) => (u.id === userId ? next : u)));
    // Keep the current session in sync if the reset was on the signed-in user.
    if (get().currentUser?.id === userId) {
      save(KEYS.currentUser, next);
      set({ currentUser: next });
    }
    return password;
  },

  setSharedPassword: (userId, password) => {
    const users = load<User[]>(KEYS.users, []);
    const target = users.find((u) => u.id === userId);
    if (!target) throw new ApiError(404, "NOT_FOUND", "Account not found.");
    const next: User = { ...target, sharedPassword: password };
    save(KEYS.users, users.map((u) => (u.id === userId ? next : u)));
    if (get().currentUser?.id === userId) {
      save(KEYS.currentUser, next);
      set({ currentUser: next });
    }
  },

  // Backwards-compat alias — see interface comment.
  resetEmployerPassword: (employerId) => get().resetSharedPassword(employerId),

  updateEmployer: (employerId, patch) => {
    const users = load<User[]>(KEYS.users, []);
    const target = users.find((u) => u.id === employerId);
    if (!target) return;
    const next: User = { ...target, ...patch };
    save(KEYS.users, users.map((u) => (u.id === employerId ? next : u)));
    if (get().currentUser?.id === employerId) {
      save(KEYS.currentUser, next);
      set({ currentUser: next });
    }
  },

  setDeactivated: (id, deactivated) => {
    const users = load<User[]>(KEYS.users, []);
    const updated = users.map((u) => (u.id === id ? { ...u, deactivated } : u));
    save(KEYS.users, updated);
    // If they've been kicked while signed in, drop the session so their
    // next page load bounces to /staff/login (or wherever their role
    // maps to).
    if (deactivated && get().currentUser?.id === id) {
      remove(KEYS.currentUser);
      set({ currentUser: null });
    }
  },
}));

/** All registered users (helper for admin-y views). localStorage only for now. */
export function allUsers(): User[] {
  return load<User[]>(KEYS.users, []);
}
