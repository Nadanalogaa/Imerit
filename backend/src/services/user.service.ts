import { type UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

/**
 * User lookup helpers. Centralising the email normalisation here means
 * there's exactly one place to change if we later switch to case-sensitive
 * emails (we won't) or strip dots (we might, for some flows).
 */

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

/**
 * Create a new user shell — emailVerified=false until the OTP is consumed.
 * Throws 409 via the central error handler if the email is already taken,
 * since Prisma surfaces unique-constraint violations as P2002.
 */
export async function createUser(args: {
  role: UserRole;
  name: string;
  email: string;
  mobile?: string;
}) {
  return prisma.user.create({
    data: {
      role: args.role,
      name: args.name.trim(),
      email: normalizeEmail(args.email),
      mobile: args.mobile?.trim() || null,
    },
  });
}

export async function markEmailVerified(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true, lastSeenAt: new Date() },
  });
}

export async function touchLastSeen(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {
    // Best-effort — don't fail the request just because the timestamp didn't write.
  });
}

export async function requireUserById(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u || u.deletedAt) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  return u;
}
