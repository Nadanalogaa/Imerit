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

interface AdminUpdateEmployerArgs {
  actorId: string;
  actorRole: UserRole;
  employerId: string;
  patch: { name?: string; mobile?: string | null; company?: string | null };
  ip?: string;
  userAgent?: string;
}

/**
 * Admin/super-admin edit of an employer's identity fields — used from the
 * SUPER_ADMIN "Employers" table where the reviewer needs to correct a
 * company name mid-flight (misspellings, rebrands, staff-typed placeholders).
 *
 * Distinct from `updateEmployerByStaff` in staff.service.ts: no
 * "provisioned-by-me" ownership check. Any employer row is fair game
 * for the platform reviewer.
 */
export async function updateEmployerByAdmin(args: AdminUpdateEmployerArgs) {
  const target = await prisma.user.findFirst({
    where: { id: args.employerId, role: UserRole.EMPLOYER, deletedAt: null },
    select: { id: true, email: true },
  });
  if (!target) throw new HttpError(404, "Employer not found", "EMPLOYER_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: target.id },
      data: {
        name: args.patch.name?.trim() ?? undefined,
        mobile:
          args.patch.mobile === undefined
            ? undefined
            : args.patch.mobile?.trim() || null,
      },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        mobile: true,
        emailVerified: true,
        createdAt: true,
        employerProfile: { select: { companyName: true, moderationStatus: true } },
      },
    });

    if (args.patch.company !== undefined) {
      const company = args.patch.company?.trim() || "";
      // Upsert so admins can seed a companyName even if the employer
      // never completed onboarding — same shape as the staff path.
      await tx.employerProfile.upsert({
        where: { userId: target.id },
        create: { userId: target.id, companyName: company },
        update: { companyName: company },
      });
      // Relabel the denormalized Job.employerName snapshots so browse
      // cards + candidate views reflect the corrected company name
      // immediately, without waiting for a repost.
      if (company) {
        await tx.job.updateMany({
          where: { employerId: target.id, deletedAt: null },
          data: { employerName: company },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        // No dedicated USER_UPDATED action in the enum yet — reuse
        // ADMIN_NOTE_ADDED so the change still shows up in
        // /admin/activity with the diff in payload. Introduce a proper
        // enum value the next time we roll a Prisma migration.
        action: AuditAction.ADMIN_NOTE_ADDED,
        targetType: "user",
        targetId: target.id,
        payload: {
          email: target.email,
          patch: args.patch,
        } as Prisma.InputJsonValue,
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });

    return updated;
  });
}
