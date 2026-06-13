import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuditAction, OtpPurpose } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import { issueOtp, verifyOtp } from "../services/otp.service.js";
import { createUser, findByEmail, markEmailVerified, touchLastSeen } from "../services/user.service.js";
import { recordAudit } from "../services/audit.service.js";
import { loginSchema, otpVerifySchema, registerSchema } from "../schemas/auth.schemas.js";

const router = Router();

/**
 * Strict per-IP rate limit on OTP-issuing endpoints. The OTP service also
 * enforces a per-email cooldown, but a stricter per-IP cap blunts brute-force
 * fishing across many accounts.
 */
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT", message: "Too many OTP requests — try again in an hour" } },
});

const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT", message: "Too many verification attempts" } },
});

/* ------------------------------- Register ------------------------------- */

router.post(
  "/auth/register",
  otpLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { role, name, email, mobile } = req.body as ReturnType<typeof registerSchema.parse>;

    const existing = await findByEmail(email);
    if (existing) {
      // Don't reveal whether a verified user is squatting the email — point
      // the user toward login instead. Still safe-ish, since both flows then
      // require the OTP they'd never receive without owning the inbox.
      throw new HttpError(409, "This email is already registered. Please log in instead.", "EMAIL_TAKEN");
    }

    const user = await createUser({ role, name, email, mobile });
    await issueOtp({
      email,
      purpose: OtpPurpose.REGISTER,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    await recordAudit({ req, actorId: user.id, actorRole: user.role, action: AuditAction.USER_CREATED, targetType: "user", targetId: user.id });

    res.status(201).json({
      message: "OTP sent — check the email inbox (in development, it's logged to the server console).",
      userId: user.id,
    });
  }),
);

/* --------------------------- Login (request OTP) --------------------------- */

router.post(
  "/auth/login",
  otpLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email } = req.body as ReturnType<typeof loginSchema.parse>;

    const user = await findByEmail(email);
    if (!user || user.deletedAt) {
      throw new HttpError(404, "No account with that email. Please register first.", "USER_NOT_FOUND");
    }

    await issueOtp({
      email,
      purpose: OtpPurpose.LOGIN,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ message: "OTP sent — check the email inbox." });
  }),
);

/* ---------------------------- Verify OTP + issue JWT ---------------------------- */

router.post(
  "/auth/otp/verify",
  verifyLimiter,
  validate({ body: otpVerifySchema }),
  asyncHandler(async (req, res) => {
    const { email, code, purpose } = req.body as ReturnType<typeof otpVerifySchema.parse>;

    await verifyOtp({ email, code, purpose });

    const user = await findByEmail(email);
    if (!user || user.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");

    // On register, this is the moment we mark them verified. On login, we
    // also bump it because re-verifying via OTP is itself proof of ownership.
    const updated = await markEmailVerified(user.id);

    const access = signAccessToken({ sub: updated.id, role: updated.role, email: updated.email });
    const refresh = signRefreshToken({ sub: updated.id, jti: crypto.randomUUID() });
    setAuthCookies(res, access, refresh);

    await recordAudit({ req, actorId: updated.id, actorRole: updated.role, action: AuditAction.USER_LOGIN });

    res.json({
      user: publicUser(updated),
      message: purpose === OtpPurpose.REGISTER ? "Account verified" : "Logged in",
    });
  }),
);

/* ------------------------------- Refresh ------------------------------- */

router.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const cookie = (req as typeof req & { cookies?: Record<string, string> }).cookies?.itr_refresh;
    if (!cookie) throw new HttpError(401, "No refresh token", "REFRESH_MISSING");

    let payload;
    try {
      payload = verifyRefreshToken(cookie);
    } catch (err) {
      logger.debug({ err }, "Refresh verify failed");
      throw new HttpError(401, "Invalid refresh token", "REFRESH_INVALID");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.deletedAt) {
      clearAuthCookies(res);
      throw new HttpError(401, "User no longer exists", "USER_NOT_FOUND");
    }

    const newAccess = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const newRefresh = signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });
    setAuthCookies(res, newAccess, newRefresh);
    res.json({ ok: true });
  }),
);

/* ------------------------------- Logout ------------------------------- */

router.post(
  "/auth/logout",
  asyncHandler(async (req, res) => {
    if (req.user?.sub) {
      await recordAudit({ req, action: AuditAction.USER_LOGOUT });
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  }),
);

/* ------------------------------- /auth/me ------------------------------- */

router.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || user.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
    await touchLastSeen(user.id);
    res.json({ user: publicUser(user) });
  }),
);

/** Strip server-only fields before returning a User to the client. */
function publicUser<T extends { passwordHash?: string | null; deletedAt?: Date | null }>(u: T) {
  const { passwordHash: _ph, deletedAt: _dd, ...rest } = u;
  return rest;
}

export default router;
