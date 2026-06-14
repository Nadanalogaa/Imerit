import { AuditAction, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

/**
 * SUPER_ADMIN-only management of admin (and other super-admin) accounts.
 *
 * Bootstrap rules:
 *   - The very first SUPER_ADMIN is seeded from SUPER_ADMIN_EMAIL on boot.
 *   - All other privileged accounts (additional admins / super-admins) are
 *     created here, through audit-logged HTTP calls — never via deploy env.
 *
 * Safety rules:
 *   - A super-admin cannot delete their own account (no last-key lockout).
 *   - A super-admin cannot demote their own role (same reason).
 *   - Creating an admin assumes the inviting super-admin has verified the
 *     email — we mark emailVerified=true so the new user can OTP-in
 *     immediately. They still need to receive the code via the OTP flow.
 *
 * Every action writes an AuditLog entry so /admin/activity shows it.
 */

export async function listAdmins() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      mobile: true,
      createdAt: true,
      lastSeenAt: true,
    },
  });
}

interface CreateAdminArgs {
  actorId: string;
  actorRole: UserRole;
  email: string;
  name: string;
  role: UserRole; // ADMIN | SUPER_ADMIN — validated by the schema
  ip?: string;
  userAgent?: string;
}

export async function createAdmin(args: CreateAdminArgs) {
  if (args.role !== UserRole.ADMIN && args.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(400, "Role must be ADMIN or SUPER_ADMIN", "INVALID_ROLE");
  }
  const email = args.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "A user with that email already exists", "EMAIL_TAKEN");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        name: args.name.trim(),
        role: args.role,
        emailVerified: true,
      },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
        lastSeenAt: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.USER_CREATED,
        targetType: "user",
        targetId: created.id,
        payload: { role: args.role, email: created.email, name: created.name },
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return created;
  });
}

interface DeleteAdminArgs {
  actorId: string;
  actorRole: UserRole;
  targetId: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Soft-delete an admin (or super-admin) account. Hard delete would orphan
 * audit rows we want to keep, so we set deletedAt — the user can no longer
 * log in (the auth flow filters on deletedAt: null) but the historical
 * trail is preserved.
 */
export async function softDeleteAdmin(args: DeleteAdminArgs) {
  if (args.targetId === args.actorId) {
    throw new HttpError(400, "You cannot delete your own account", "CANNOT_DELETE_SELF");
  }

  const target = await prisma.user.findUnique({
    where: { id: args.targetId },
    select: { id: true, role: true, email: true, deletedAt: true },
  });
  if (!target || target.deletedAt) {
    throw new HttpError(404, "Admin not found", "USER_NOT_FOUND");
  }
  if (target.role !== UserRole.ADMIN && target.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(400, "Target is not an admin account", "NOT_AN_ADMIN");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
      select: { id: true, role: true, email: true, deletedAt: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.USER_DELETED,
        targetType: "user",
        targetId: target.id,
        payload: { role: target.role, email: target.email } as Prisma.InputJsonValue,
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return updated;
  });
}
