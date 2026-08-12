import { Router } from "express";
import { ModerationStatus, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminActivitySchema,
  adminProfileListSchema,
  adminUserListSchema,
  bulkIdsSchema,
  createAdminSchema,
  moderateProfileSchema,
  trashListSchema,
} from "../schemas/admin.schemas.js";
import {
  getOverviewStats,
  getRecentActivity,
  getSevenDayTrends,
  listProfiles,
  listUsers,
  moderateProfile,
} from "../services/admin.service.js";
import {
  createAdmin,
  listAdmins,
  softDeleteAdmin,
  updateEmployerByAdmin,
} from "../services/admin-users.service.js";
import {
  bulkPurgeUsers,
  bulkRestoreUsers,
  bulkSoftDeleteUsers,
  emptyTrash,
  listTrash,
  purgeUser,
  restoreUser,
  softDeleteUser,
} from "../services/trash.service.js";

const router = Router();

// Both ADMIN and SUPER_ADMIN can use every read-only endpoint. We tighten
// for SUPER_ADMIN-only actions (admin user management, pricing) using
// `superAdminGuard` below.
const adminGuard = [requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)];
const superAdminGuard = [requireAuth, requireRole(UserRole.SUPER_ADMIN)];

router.get(
  "/admin/stats",
  ...adminGuard,
  asyncHandler(async (_req, res) => {
    res.json(await getOverviewStats());
  }),
);

router.get(
  "/admin/trends",
  ...adminGuard,
  asyncHandler(async (_req, res) => {
    res.json(await getSevenDayTrends());
  }),
);

router.get(
  "/admin/activity",
  ...adminGuard,
  validate({ query: adminActivitySchema }),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as { limit: number };
    res.json({ items: await getRecentActivity(limit) });
  }),
);

router.get(
  "/admin/users",
  ...adminGuard,
  validate({ query: adminUserListSchema }),
  asyncHandler(async (req, res) => {
    const args = req.query as unknown as {
      role?: UserRole; search?: string; page: number; pageSize: number;
    };
    res.json(await listUsers(args));
  }),
);

router.get(
  "/admin/profiles",
  ...adminGuard,
  validate({ query: adminProfileListSchema }),
  asyncHandler(async (req, res) => {
    const args = req.query as unknown as {
      status?: ModerationStatus; search?: string; page: number; pageSize: number;
    };
    res.json(await listProfiles(args));
  }),
);

/* --------------------- SUPER_ADMIN-only: manage admin accounts --------------------- */

router.get(
  "/super-admin/admins",
  ...superAdminGuard,
  asyncHandler(async (_req, res) => {
    res.json({ items: await listAdmins() });
  }),
);

router.post(
  "/super-admin/admins",
  ...superAdminGuard,
  validate({ body: createAdminSchema }),
  asyncHandler(async (req, res) => {
    const { email, name, role } = req.body as { email: string; name: string; role: UserRole };
    const created = await createAdmin({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      email,
      name,
      role,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ user: created });
  }),
);

router.delete(
  "/super-admin/admins/:id",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetId) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const result = await softDeleteAdmin({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      targetId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ user: result });
  }),
);

/* --------------------- SUPER_ADMIN-only: user trash (recycle bin) --------------------- */

// Two-step lifecycle: DELETE moves the user to trash (soft delete, keeps
// email locked so nobody can re-register with it); PURGE hard-deletes and
// finally frees the email. Bulk variants take an { ids: string[] } body.

router.get(
  "/super-admin/trash",
  ...superAdminGuard,
  validate({ query: trashListSchema }),
  asyncHandler(async (req, res) => {
    const { role } = req.query as unknown as { role?: UserRole };
    res.json({ items: await listTrash(role) });
  }),
);

router.delete(
  "/super-admin/users/:id",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetId) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const result = await softDeleteUser(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      targetId,
    );
    res.json({ user: result });
  }),
);

router.post(
  "/super-admin/users/bulk-delete",
  ...superAdminGuard,
  validate({ body: bulkIdsSchema }),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    const result = await bulkSoftDeleteUsers(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      ids,
    );
    res.json(result);
  }),
);

router.post(
  "/super-admin/users/:id/restore",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetId) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const result = await restoreUser(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      targetId,
    );
    res.json({ user: result });
  }),
);

router.post(
  "/super-admin/users/bulk-restore",
  ...superAdminGuard,
  validate({ body: bulkIdsSchema }),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    const result = await bulkRestoreUsers(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      ids,
    );
    res.json(result);
  }),
);

router.delete(
  "/super-admin/users/:id/permanent",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetId) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const result = await purgeUser(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      targetId,
    );
    res.json({ user: result });
  }),
);

router.post(
  "/super-admin/users/bulk-purge",
  ...superAdminGuard,
  validate({ body: bulkIdsSchema }),
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids: string[] };
    const result = await bulkPurgeUsers(
      {
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
      ids,
    );
    res.json(result);
  }),
);

router.post(
  "/super-admin/trash/empty",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const result = await emptyTrash({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json(result);
  }),
);

/* ------------------------- Employer identity edit ------------------------- */

// Admin/super-admin patch of an employer's identity (name / mobile / company
// name). The staff route (`PATCH /staff/employers/:id`) is scoped to the
// staff user who provisioned the row; this one has no ownership check so
// the platform reviewer can correct any employer.
router.patch(
  "/admin/employers/:id",
  ...adminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const targetId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!targetId) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const body = req.body as { name?: unknown; mobile?: unknown; company?: unknown };
    const patch: { name?: string; mobile?: string | null; company?: string | null } = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (body.mobile !== undefined) {
      patch.mobile = typeof body.mobile === "string" ? body.mobile : null;
    }
    if (body.company !== undefined) {
      patch.company = typeof body.company === "string" ? body.company : null;
    }
    const updated = await updateEmployerByAdmin({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      employerId: targetId,
      patch,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ user: updated });
  }),
);

/* ------------------------------ Moderation ------------------------------ */

router.patch(
  "/admin/profiles/:userId/moderate",
  ...adminGuard,
  validate({ body: moderateProfileSchema }),
  asyncHandler(async (req, res) => {
    const rawId = req.params.userId;
    const userId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!userId) throw new HttpError(400, "userId is required", "USER_ID_REQUIRED");
    const { status, notes } = req.body as { status: ModerationStatus; notes?: string };
    const updated = await moderateProfile({
      adminId: req.user!.sub,
      adminRole: req.user!.role,
      userId,
      status,
      notes,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ profile: updated });
  }),
);

export default router;
