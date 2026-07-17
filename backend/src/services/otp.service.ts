import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { OtpPurpose, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { HttpError } from "../middleware/error.js";
import { notifyOtp } from "./notify.service.js";

/**
 * OTP design — kept intentionally simple but defensible.
 *
 *  - Code is a 6-digit number; stored in DB as a bcrypt hash so a DB leak
 *    can't reveal active codes.
 *  - Expires after env.OTP_TTL_MIN (default 10 minutes).
 *  - Max 5 verification attempts before the OTP is invalidated.
 *  - Per-email rate limit: at most one new OTP per minute for the same
 *    (email, purpose) combo. Anything more aggressive needs Redis.
 *  - In production, swap `dispatch()` for a real SMS/email provider
 *    (MSG91, AWS SES). In dev we log the code to stdout — easier to test.
 */

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function generateCode(): string {
  // crypto.randomInt is unbiased, unlike Math.random.
  return String(randomInt(0, 1_000_000)).padStart(CODE_LENGTH, "0");
}

interface IssueArgs {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Generate, store, and dispatch a new OTP. Enforces the resend cooldown so a
 * user (or script) can't spam the email queue.
 *
 * Returns `devCode` (plaintext OTP) **only** when env.ENABLE_DEV_OTP is set —
 * never in real production. Callers (the auth routes) forward that field into
 * the response body so demo/curl flows don't need to dig through server logs.
 */
export async function issueOtp(args: IssueArgs): Promise<{ expiresAt: Date; devCode?: string }> {
  const email = args.email.toLowerCase().trim();

  const since = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000);
  const recent = await prisma.otpToken.findFirst({
    where: { email, purpose: args.purpose, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    throw new HttpError(429, "Please wait a minute before requesting another code", "OTP_TOO_SOON");
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MIN * 60 * 1000);

  await prisma.otpToken.create({
    data: {
      email,
      purpose: args.purpose,
      codeHash,
      expiresAt,
      userId: args.userId,
      ip: args.ip,
      userAgent: args.userAgent?.slice(0, 512),
    },
  });

  await dispatch(email, code, args.purpose);
  return { expiresAt, devCode: env.ENABLE_DEV_OTP ? code : undefined };
}

/**
 * Validate a submitted code. Returns the matched (and now-consumed) OTP row.
 * Throws structured HttpErrors for the various failure modes so the API can
 * surface specific reasons (expired vs wrong code vs locked out).
 */
export async function verifyOtp(args: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<{ tokenId: string; userId: string | null }> {
  const email = args.email.toLowerCase().trim();

  const token = await prisma.otpToken.findFirst({
    where: { email, purpose: args.purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!token) throw new HttpError(400, "No code requested for this email", "OTP_NOT_FOUND");
  if (token.expiresAt < new Date()) {
    throw new HttpError(400, "Code has expired — request a new one", "OTP_EXPIRED");
  }
  if (token.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, "Too many incorrect attempts — request a new code", "OTP_LOCKED");
  }

  const ok = await bcrypt.compare(args.code.trim(), token.codeHash);
  if (!ok) {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    throw new HttpError(400, "Incorrect code", "OTP_INVALID");
  }

  await prisma.otpToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  return { tokenId: token.id, userId: token.userId };
}

/**
 * OTP dispatch — routes the plaintext code out via the notify layer,
 * which formats a branded HTML email and hands it to nodemailer. When
 * SMTP isn't configured yet (dev / mis-configured prod) the mailer
 * falls back to logging so the OTP is still visible in server logs.
 *
 * The purpose maps to different subject-line + body copy so users can
 * tell "your login code" from "reset your password" in their inbox.
 */
async function dispatch(email: string, code: string, purpose: OtpPurpose): Promise<void> {
  if (env.ENABLE_DEV_OTP) {
    // Belt-and-braces: even with real SMTP wired, if the dev flag is on
    // we log the code too so demos aren't blocked by mailbox delays.
    logger.warn({ email, purpose, code }, "OTP (dev echo — flag ENABLE_DEV_OTP=true)");
  }
  const purposeSlug =
    purpose === OtpPurpose.REGISTER ? "register" :
    purpose === OtpPurpose.PASSWORD_RESET ? "reset" :
    "login";
  await notifyOtp({ to: email, code, purpose: purposeSlug, expiresInMin: env.OTP_TTL_MIN });
}

/** Optional convenience for tests / admin tools. */
export type OtpToken = Prisma.OtpTokenGetPayload<object>;
