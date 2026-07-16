/**
 * Typed wrappers around the /auth/* endpoints. Each function maps directly
 * to one backend route; keep them thin so the routes file stays the source
 * of truth.
 */

import { api } from "../api";

/** Roles the public API accepts at register-time. Backend uses uppercase. */
export type ApiPublicRole = "CANDIDATE" | "EMPLOYER";
export type ApiRole = ApiPublicRole | "ADMIN" | "SUPER_ADMIN" | "STAFF";

export type ApiOtpPurpose = "REGISTER" | "LOGIN";

/** Shape returned by /auth/me + /auth/otp/verify. */
export interface ApiUser {
  id: string;
  role: ApiRole;
  email: string;
  emailVerified: boolean;
  mobile: string | null;
  mobileVerified: boolean;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
}

export interface RegisterInput {
  role: ApiPublicRole;
  name: string;
  email: string;
  mobile?: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  /** Echoed only when the backend's ENABLE_DEV_OTP flag is on. */
  devCode?: string;
}

export interface LoginResponse {
  message: string;
  devCode?: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  purpose: ApiOtpPurpose;
}

export interface VerifyOtpResponse {
  user: ApiUser;
  message: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    api<RegisterResponse>("/auth/register", { method: "POST", json: input }),

  /** Requests a fresh OTP for an existing user (LOGIN purpose). */
  login: (email: string) =>
    api<LoginResponse>("/auth/login", { method: "POST", json: { email } }),

  verifyOtp: (input: VerifyOtpInput) =>
    api<VerifyOtpResponse>("/auth/otp/verify", { method: "POST", json: input }),

  me: () => api<{ user: ApiUser }>("/auth/me"),

  refresh: () => api<{ ok: true }>("/auth/refresh", { method: "POST" }),

  logout: () => api<{ ok: true }>("/auth/logout", { method: "POST" }),

  /**
   * Password login — for staff AND for employers whose credentials were
   * minted by staff (they have a `sharedPassword` on the row). No OTP.
   * Backend validates bcrypt-hash + issues the same JWT cookies as the
   * OTP flow. Throws ApiError code=AUTH_INVALID for bad creds or an
   * ineligible role; ACCOUNT_DEACTIVATED for a disabled account.
   */
  passwordLogin: (email: string, password: string) =>
    api<{ user: ApiUser; message: string }>("/auth/password/login", {
      method: "POST",
      json: { email, password },
    }),
};
