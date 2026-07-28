import { AuditAction, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

/**
 * SUPER_ADMIN-only "recycle bin" for user accounts.
 *
 * Two-step deletion pattern:
 *   1. Soft delete  — sets `deletedAt`. Row stays in DB, user can't log in
 *      (auth guards filter `deletedAt: null`), email cannot be re-registered
 *      (unique constraint still blocks it).
 *   2. Purge (hard delete) — actually removes the row. All cascaded FK
 *      relations (profiles, jobs, applications, subscriptions...) go with
 *      it. This is the point at which the email is freed for re-signup.
 *
 * Every action writes an AuditLog entry.
 *
 * Safety:
 *   - You cannot soft-delete or purge yourself.
 *   - You cannot soft-delete another SUPER_ADMIN (avoid last-key lockout).
 *     Purging a soft-deleted super-admin IS allowed — because purge already
 *     requires a preceding soft-delete which this rule protected.
 */

interface Actor {
  actorId: string;
  actorRole: UserRole;
  ip?: string;
  userAgent?: string;
}

/** List every soft-deleted user, newest deletion first. */
export async function listTrash(role?: UserRole) {
  const where: Prisma.UserWhereInput = { deletedAt: { not: null } };
  if (role) where.role = role;
  return prisma.user.findMany({
    where,
    orderBy: { deletedAt: "desc" },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      mobile: true,
      emailVerified: true,
      createdAt: true,
      deletedAt: true,
      employerProfile: { select: { companyName: true } },
      candidateProfile: { select: { moderationStatus: true } },
    },
  });
}

/** Soft-delete a single user. */
export async function softDeleteUser(actor: Actor, targetId: string) {
  if (targetId === actor.actorId) {
    throw new HttpError(400, "You cannot delete your own account", "CANNOT_DELETE_SELF");
  }
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, email: true, deletedAt: true },
  });
  if (!target) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  if (target.deletedAt) {
    throw new HttpError(409, "User is already in trash", "ALREADY_DELETED");
  }
  if (target.role === UserRole.SUPER_ADMIN) {
    throw new HttpError(
      400,
      "Cannot delete another super-admin. Demote them first.",
      "CANNOT_DELETE_SUPER_ADMIN",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
      select: { id: true, role: true, email: true, deletedAt: true, name: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        action: AuditAction.USER_DELETED,
        targetType: "user",
        targetId: target.id,
        payload: { role: target.role, email: target.email } as Prisma.InputJsonValue,
        ip: actor.ip,
        userAgent: actor.userAgent?.slice(0, 512),
      },
    });
    return updated;
  });
}

/** Bulk soft-delete. Partial success returns per-id outcome. */
export async function bulkSoftDeleteUsers(actor: Actor, ids: string[]) {
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await softDeleteUser(actor, id);
      results.push({ id, ok: true });
    } catch (e) {
      const err = e as HttpError;
      results.push({ id, ok: false, error: err.code ?? "ERROR" });
    }
  }
  return {
    total: ids.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/** Restore a soft-deleted user. */
export async function restoreUser(actor: Actor, targetId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, email: true, deletedAt: true },
  });
  if (!target) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  if (!target.deletedAt) {
    throw new HttpError(409, "User is not in trash", "NOT_IN_TRASH");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: target.id },
      data: { deletedAt: null },
      select: { id: true, role: true, email: true, deletedAt: true, name: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        action: AuditAction.USER_RESTORED,
        targetType: "user",
        targetId: target.id,
        payload: { role: target.role, email: target.email } as Prisma.InputJsonValue,
        ip: actor.ip,
        userAgent: actor.userAgent?.slice(0, 512),
      },
    });
    return updated;
  });
}

export async function bulkRestoreUsers(actor: Actor, ids: string[]) {
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await restoreUser(actor, id);
      results.push({ id, ok: true });
    } catch (e) {
      const err = e as HttpError;
      results.push({ id, ok: false, error: err.code ?? "ERROR" });
    }
  }
  return {
    total: ids.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/**
 * Permanently delete a user + all cascaded rows. Only works on already
 * soft-deleted users — you must trash first, then purge. Prevents accidental
 * hard delete without the two-step gesture.
 */
export async function purgeUser(actor: Actor, targetId: string) {
  if (targetId === actor.actorId) {
    throw new HttpError(400, "You cannot purge your own account", "CANNOT_PURGE_SELF");
  }
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, email: true, deletedAt: true },
  });
  if (!target) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  if (!target.deletedAt) {
    throw new HttpError(
      409,
      "User must be moved to trash first before permanent deletion",
      "MUST_TRASH_FIRST",
    );
  }

  // Audit BEFORE delete — otherwise the FK on auditLog.actorId still points
  // to actor (not target), but we'd lose the target row's context.
  await prisma.auditLog.create({
    data: {
      actorId: actor.actorId,
      actorRole: actor.actorRole,
      action: AuditAction.USER_PURGED,
      targetType: "user",
      targetId: target.id,
      payload: { role: target.role, email: target.email } as Prisma.InputJsonValue,
      ip: actor.ip,
      userAgent: actor.userAgent?.slice(0, 512),
    },
  });

  await prisma.user.delete({ where: { id: target.id } });

  return { id: target.id, email: target.email, role: target.role };
}

export async function bulkPurgeUsers(actor: Actor, ids: string[]) {
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const id of ids) {
    try {
      await purgeUser(actor, id);
      results.push({ id, ok: true });
    } catch (e) {
      const err = e as HttpError;
      results.push({ id, ok: false, error: err.code ?? "ERROR" });
    }
  }
  return {
    total: ids.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/**
 * Nuke everything currently in the trash. Convenience over `bulkPurgeUsers`
 * with a pre-fetched id list — keeps the UI's "Empty Trash" button honest.
 */
export async function emptyTrash(actor: Actor) {
  const trashed = await prisma.user.findMany({
    where: { deletedAt: { not: null }, id: { not: actor.actorId } },
    select: { id: true },
  });
  return bulkPurgeUsers(actor, trashed.map((u) => u.id));
}
