import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { AuditAction, OtpPurpose, UserRole } from "@prisma/client";

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
import { notifyRegistered } from "../services/notify.service.js";
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
    const otp = await issueOtp({
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
      devCode: otp.devCode, // present only when ENABLE_DEV_OTP=true
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

    const otp = await issueOtp({
      email,
      purpose: OtpPurpose.LOGIN,
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({
      message: "OTP sent — check the email inbox.",
      devCode: otp.devCode, // present only when ENABLE_DEV_OTP=true
    });
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

    // Post-verify emails — only on REGISTER (welcome + admin cc). Login
    // verifications don't fire welcome; that would be noisy every session.
    // Best-effort — never let a mail failure block the login response.
    if (purpose === OtpPurpose.REGISTER && (updated.role === UserRole.CANDIDATE || updated.role === UserRole.EMPLOYER)) {
      const roleSlug = updated.role === UserRole.CANDIDATE ? "candidate" : "employer";
      void notifyRegistered({ name: updated.name, email: updated.email, role: roleSlug }).catch((err) => {
        logger.warn({ err, userId: updated.id }, "welcome email failed");
      });
    }

    res.json({
      user: publicUser(updated),
      message: purpose === OtpPurpose.REGISTER ? "Account verified" : "Logged in",
    });
  }),
);

/* --------------------- Password login (staff + provisioned employers) --------------------- */

/**
 * Password login — used by two lanes:
 *   1. Staff accounts (role=STAFF), always. Staff was bootstrapped by a
 *      super-admin who already knows the person, so no OTP.
 *   2. Employer accounts (role=EMPLOYER) whose credentials were minted
 *      by a staff member (their `sharedPassword` field is set). Those
 *      employers can log in via password as well as via OTP.
 *
 * All other roles must use the OTP path — this route refuses them.
 */
const passwordLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMIT", message: "Too many login attempts — try again shortly" } },
});

const passwordLoginHandler = asyncHandler(async (req, res) => {
  const body = req.body as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    throw new HttpError(400, "Email and password are required", "MISSING_CREDENTIALS");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Same error message for missing account / wrong password / role
  // ineligible so we don't leak which of the three is the case.
  const denyMsg = "Incorrect email or password";
  if (!user || user.deletedAt) {
    throw new HttpError(401, denyMsg, "AUTH_INVALID");
  }
  const eligible =
    user.role === UserRole.STAFF ||
    (user.role === UserRole.EMPLOYER && !!user.sharedPassword);
  if (!eligible) {
    throw new HttpError(401, denyMsg, "AUTH_INVALID");
  }
  if (user.deactivated) {
    throw new HttpError(403, "This account is deactivated. Ask a super-admin to reactivate it.", "ACCOUNT_DEACTIVATED");
  }
  if (!user.passwordHash) {
    // Employer with sharedPassword but no hash: possible if the row was
    // seeded before the staff-provisioning flow, so treat it as auth-fail.
    throw new HttpError(401, denyMsg, "AUTH_INVALID");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, denyMsg, "AUTH_INVALID");

  const access = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const refresh = signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });
  setAuthCookies(res, access, refresh);
  await touchLastSeen(user.id);
  await recordAudit({ req, actorId: user.id, actorRole: user.role, action: AuditAction.USER_LOGIN });
  res.json({ user: publicUser(user), message: "Logged in" });
});

// Primary route + legacy alias so the previous /auth/staff/login path
// keeps working (frontend uses `/auth/password/login` now).
router.post("/auth/password/login", passwordLoginLimiter, passwordLoginHandler);
router.post("/auth/staff/login", passwordLoginLimiter, passwordLoginHandler);

/* -------------------- Forgot / reset / change password -------------------- */

/**
 * POST /auth/password/forgot — start a password-reset flow.
 * Only STAFF and staff-provisioned EMPLOYER accounts have passwords, so
 * only those roles receive a reset OTP. Every other role uses OTP login
 * directly (there's no password to reset). We deliberately return the
 * same response whether the email exists or not — enumeration would
 * leak which addresses are on the platform.
 */
router.post(
  "/auth/password/forgot",
  otpLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!email) throw new HttpError(400, "Email is required", "MISSING_EMAIL");

    const user = await prisma.user.findUnique({ where: { email } });
    const eligible = !!user && !user.deletedAt && !user.deactivated && (
      user.role === UserRole.STAFF ||
      (user.role === UserRole.EMPLOYER && !!user.sharedPassword)
    );
    if (eligible) {
      await issueOtp({
        email,
        purpose: OtpPurpose.PASSWORD_RESET,
        userId: user!.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }
    // Same response for eligible / ineligible / missing — no enumeration.
    res.json({
      message: "If an eligible account exists for that email, a reset code has been sent.",
    });
  }),
);

/**
 * POST /auth/password/reset — finish the reset flow.
 * Consumes a PASSWORD_RESET OTP and sets a new bcrypt hash. Also
 * clears the old `sharedPassword` field on staff/employer rows so the
 * previous shared cred can no longer be revealed by super-admin or
 * staff — the user chose their own now, no one else should hold it.
 */
router.post(
  "/auth/password/reset",
  verifyLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as { email?: unknown; code?: unknown; newPassword?: unknown };
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!email || !code || !newPassword) {
      throw new HttpError(400, "email, code, and newPassword are required", "MISSING_FIELDS");
    }
    if (newPassword.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters", "PASSWORD_TOO_SHORT");
    }

    await verifyOtp({ email, code, purpose: OtpPurpose.PASSWORD_RESET });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      // Null out sharedPassword — the user has chosen their own, so the
      // shared cred an admin/staff might have seen is now obsolete and
      // shouldn't be revealed in the reveal-and-copy UI anymore.
      data: { passwordHash, sharedPassword: null },
    });
    await recordAudit({ req, actorId: user.id, actorRole: user.role, action: AuditAction.USER_LOGIN, targetType: "user", targetId: user.id });

    res.json({ message: "Password has been reset. You can now sign in with your new password." });
  }),
);

/**
 * POST /auth/password/change — signed-in user changes their own password.
 * Requires the current password (or the shared password) to prove
 * possession. Same null-sharedPassword step as reset.
 */
router.post(
  "/auth/password/change",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body as { oldPassword?: unknown; newPassword?: unknown };
    const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (!oldPassword || !newPassword) {
      throw new HttpError(400, "oldPassword and newPassword are required", "MISSING_FIELDS");
    }
    if (newPassword.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters", "PASSWORD_TOO_SHORT");
    }
    if (newPassword === oldPassword) {
      throw new HttpError(400, "New password must be different from the old one", "PASSWORD_UNCHANGED");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user || user.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
    if (!user.passwordHash) {
      throw new HttpError(400, "This account doesn't use password sign-in", "NO_PASSWORD");
    }
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new HttpError(401, "Current password is incorrect", "OLD_PASSWORD_INVALID");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, sharedPassword: null },
    });

    res.json({ message: "Password changed." });
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
