import type { Request, RequestHandler } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";
import { HttpError } from "./error.js";

/** Attach the decoded JWT payload onto the request for downstream handlers. */
declare module "express-serve-static-core" {
  interface Request {
    user?: AccessTokenPayload;
  }
}

/**
 * Reads the bearer token from `Authorization: Bearer ...` OR the
 * `itr_access` httpOnly cookie. Throws 401 if missing/invalid.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw new HttpError(401, "Not authenticated", "AUTH_REQUIRED");
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, "Invalid or expired token", "AUTH_INVALID"));
  }
};

/**
 * Restricts a route to one or more roles. Mount AFTER `requireAuth`.
 *
 *   router.get("/admin/users", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), handler)
 */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Not authenticated", "AUTH_REQUIRED"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "Forbidden", "ROLE_FORBIDDEN"));
    }
    next();
  };

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.itr_access;
  if (cookie) return cookie;
  return null;
}
