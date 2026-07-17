import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

/**
 * Bootstrap one or more super-admins from the environment. Every other
 * admin is created from inside the app by a super-admin (POST
 * /super-admin/admins), so privileged account management lives in
 * audit-logged HTTP requests rather than the deploy config — which is
 * the correct boundary. The seed exists only to guarantee at least one
 * super-admin can log in on a fresh database.
 *
 * Env vars:
 *   SUPER_ADMIN_EMAIL — comma-separated list of emails to seed as
 *                       SUPER_ADMIN. Blank/unset means no seeding.
 *                       Example: "founder@x.com,ops@x.com"
 *   SUPER_ADMIN_NAME  — display name applied to every seeded row
 *                       (defaults to "Super Admin").
 *
 * Idempotent: if any email already exists, that row is left alone
 * (and we warn loudly if its role doesn't match).
 */
export async function ensureAdminUsers(): Promise<void> {
  const raw = (process.env.SUPER_ADMIN_EMAIL ?? "").trim();
  if (!raw) return;

  const emails = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) return;

  const name = (process.env.SUPER_ADMIN_NAME ?? "").trim() || "Super Admin";

  for (const email of emails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.SUPER_ADMIN) {
        logger.warn(
          { email, currentRole: existing.role },
          "Seeded SUPER_ADMIN_EMAIL already exists with a different role — leaving as-is. Promote manually if intended.",
        );
      }
      continue;
    }
    await prisma.user.create({
      data: {
        role: UserRole.SUPER_ADMIN,
        email,
        name,
        emailVerified: true,
      },
    });
    logger.info({ email }, "Seeded super-admin user");
  }
}
