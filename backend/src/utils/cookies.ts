import type { Response } from "express";
import { env } from "../config/env.js";

/**
 * Auth cookies are httpOnly + SameSite=Lax so a stolen XSS token is useless and
 * cross-site form posts can't forge requests. They're scoped to "/" so the
 * refresh route + the protected APIs all see them.
 *
 * - `itr_access`  lifetime = JWT_ACCESS_TTL_MIN  (short — minutes)
 * - `itr_refresh` lifetime = JWT_REFRESH_TTL_DAYS (long  — days)
 *
 * `secure` flips on automatically in production so we never send over plain HTTP.
 */
const baseCookie = {
  httpOnly: true as const,
  sameSite: "lax" as const,
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
