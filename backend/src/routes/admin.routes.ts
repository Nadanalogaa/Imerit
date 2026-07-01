import { Router } from "express";
import { ModerationStatus, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminActivitySchema,
  adminProfileListSchema,
  adminUserListSchema,
  createAdminSchema,
  moderateProfileSchema,
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
} from "../services/admin-users.service.js";

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
