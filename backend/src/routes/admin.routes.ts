import { Router } from "express";
import { ModerationStatus, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminActivitySchema,
  adminProfileListSchema,
  adminUserListSchema,
  moderateProfileSchema,
} from "../schemas/admin.schemas.js";
import {
  getOverviewStats,
  getRecentActivity,
  listProfiles,
  listUsers,
  moderateProfile,
} from "../services/admin.service.js";

const router = Router();

// Both ADMIN and SUPER_ADMIN can use every read-only endpoint. We tighten
// later for SUPER_ADMIN-only actions (pricing edits, sub-admin management).
const adminGuard = [requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)];

router.get(
  "/admin/stats",
  ...adminGuard,
  asyncHandler(async (_req, res) => {
    res.json(await getOverviewStats());
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
