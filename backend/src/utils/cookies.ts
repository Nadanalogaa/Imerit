import type { Request, Response } from "express";
import { env } from "../config/env.js";
/**
 * Auth cookies are httpOnly so XSS can't read them.
 *
 * We derive the transport flags from the actual request instead of a fixed
 * env toggle because this app is sometimes accessed over plain HTTP on an IP
 * address during testing. In that case a Secure cookie would be dropped by
 * the browser and the user would appear logged in locally while API routes
 * still returned `AUTH_REQUIRED`.
 *
 * When the request is HTTPS (directly or via a trusted proxy), we keep the
 * modern `SameSite=None; Secure` pairing so cross-site frontend/API deploys
 * still work. On plain HTTP we fall back to `SameSite=Lax; Secure=false`.
 *
 * Cookies are scoped to "/" so /auth/me and /auth/refresh both see them.
 *   - `itr_access`  lifetime = JWT_ACCESS_TTL_MIN  (short — minutes)
 *   - `itr_refresh` lifetime = JWT_REFRESH_TTL_DAYS (long  — days)
 */
function cookieOptions(res: Response) {
  const req = res.req as Request | undefined;
  if (!req) {
    return {
      httpOnly: true as const,
      sameSite: "lax" as const,
      secure: false,
      path: "/",
    };
  }

  let secure = Boolean(req.secure);
  if (!secure) {
    const forwardedProto = String(req.get("x-forwarded-proto") ?? "");
    const proto = forwardedProto.split(",")[0] ?? "";
    secure = proto.trim().toLowerCase() === "https";
  }

  return {
    httpOnly: true as const,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    secure,
    path: "/",
  };
}

export function setAuthCookies(res: Response, access: string, refresh: string): void {
  const baseCookie = cookieOptions(res);
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
  const baseCookie = cookieOptions(res);
  res.clearCookie("itr_access", baseCookie);
  res.clearCookie("itr_refresh", baseCookie);
}
