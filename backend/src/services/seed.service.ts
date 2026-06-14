import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

/**
 * Idempotent on-boot seeding of admin accounts. Reads ADMIN_EMAIL +
 * SUPER_ADMIN_EMAIL from the environment and creates a user with the
 * matching role if it doesn't already exist. Safe to run on every deploy.
 *
 * The seeded accounts log in via the same OTP flow as candidates / employers
 * — no password is set, the inbox owns the account. In dev + while the
 * ENABLE_DEV_OTP flag is on, the OTP shows up in the /auth/login response.
 *
 * Env vars:
 *   ADMIN_EMAIL        — email for the regular ADMIN role
 *   ADMIN_NAME         — display name (defaults to "Admin")
 *   SUPER_ADMIN_EMAIL  — email for the SUPER_ADMIN role
 *   SUPER_ADMIN_NAME   — display name (defaults to "Super Admin")
 *
 * Any var that's blank/unset is skipped silently so this works without
 * forcing every environment to specify both.
 */
export async function ensureAdminUsers(): Promise<void> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();

  await maybeSeed(adminEmail, process.env.ADMIN_NAME?.trim() || "Admin", UserRole.ADMIN);
  await maybeSeed(superAdminEmail, process.env.SUPER_ADMIN_NAME?.trim() || "Super Admin", UserRole.SUPER_ADMIN);
}

async function maybeSeed(email: string, name: string, role: UserRole): Promise<void> {
  if (!email) return;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) {
      // Already exists with a different role — don't silently change it,
      // but log loudly so the operator notices and reassigns by hand.
      logger.warn(
        { email, currentRole: existing.role, requestedRole: role },
        "Seeded admin email already exists with a different role — leaving as-is",
      );
    }
    return;
  }
  await prisma.user.create({
    data: {
      role,
      email,
      name,
      // Admin accounts are still verified by the same OTP flow as candidates;
      // we flip the flag on so the first login isn't gated behind extra checks.
      emailVerified: true,
    },
  });
  logger.info({ email, role }, "Seeded admin user");
}
