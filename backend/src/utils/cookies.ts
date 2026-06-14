import type { Response } from "express";
import { env } from "../config/env.js";

/**
 * Auth cookies are httpOnly so XSS can't read them, and the SameSite mode is
 * picked based on whether we're behind HTTPS:
 *
 * - production (COOKIE_SECURE=true): SameSite=None + Secure=true so the cookie
 *   survives cross-site fetch calls between the Vercel frontend (imerit.vercel.app)
 *   and the Render API (*.onrender.com). Without this, /auth/me on refresh would
 *   never see the cookie and the user would appear logged out after every reload.
 *   The browser requires Secure when SameSite=None, which is why these flags are
 *   tied together.
 *
 * - dev (COOKIE_SECURE=false): SameSite=Lax + Secure=false. localhost:5173 and
 *   localhost:4000 count as the same site, so Lax works; Secure must be off
 *   because there's no HTTPS locally.
 *
 * Cookies are scoped to "/" so /auth/me and /auth/refresh both see them.
 *   - `itr_access`  lifetime = JWT_ACCESS_TTL_MIN  (short — minutes)
 *   - `itr_refresh` lifetime = JWT_REFRESH_TTL_DAYS (long  — days)
 */
const baseCookie = {
  httpOnly: true as const,
  sameSite: env.COOKIE_SECURE ? ("none" as const) : ("lax" as const),
  secure: env.COOKIE_SECURE,
  path: "/",
};

export function setAuthCookies(res: Response, access: string, refresh: string): void {
  res.cookie("itr_access", access, {
    ...baseCookie,
    maxAge: env.JWT_ACCESS_TTL_MIN * 60 * 1000,
  });
  res.cookie("itr_refresh", refresh, {
    ...baseCookie,
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("itr_access", baseCookie);
  res.clearCookie("itr_refresh", baseCookie);
}
