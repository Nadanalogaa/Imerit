import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

/**
 * Bootstrap exactly ONE super-admin from the environment. Every other admin
 * is created from inside the app by that super-admin (POST /super-admin/admins),
 * so privileged account management lives in audit-logged HTTP requests rather
 * than the deploy config — which is the correct boundary.
 *
 * Env vars:
 *   SUPER_ADMIN_EMAIL — email for the bootstrap SUPER_ADMIN role
 *   SUPER_ADMIN_NAME  — display name (defaults to "Super Admin")
 *
 * Unset / blank means no seeding; safe to ship to environments that already
 * have a super-admin in the DB. Idempotent: if the email already exists, we
 * leave the row alone (and warn loudly if its current role doesn't match).
 */
export async function ensureAdminUsers(): Promise<void> {
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!superAdminEmail) return;

  const name = (process.env.SUPER_ADMIN_NAME ?? "").trim() || "Super Admin";

  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (existing) {
    if (existing.role !== UserRole.SUPER_ADMIN) {
      logger.warn(
        { email: superAdminEmail, currentRole: existing.role },
        "Seeded SUPER_ADMIN_EMAIL already exists with a different role — leaving as-is. Promote manually if intended.",
      );
    }
    return;
  }

  await prisma.user.create({
    data: {
      role: UserRole.SUPER_ADMIN,
      email: superAdminEmail,
      name,
      emailVerified: true,
    },
  });
  logger.info({ email: superAdminEmail }, "Seeded super-admin user");
}
