import { Router } from "express";
import { PlanAudience, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPlanSchema, updatePlanSchema } from "../schemas/admin.schemas.js";
import {
  createPlan,
  deactivatePlan,
  listActivePlans,
  listAllPlans,
  updatePlan,
} from "../services/plans.service.js";

const router = Router();

const superAdminGuard = [requireAuth, requireRole(UserRole.SUPER_ADMIN)];

/* ----------------------------- Public list ----------------------------- */

/**
 * Public — used by the candidate + employer subscribe pages. Returns only
 * active plans; price is in paise so the client divides by 100 for display.
 */
router.get(
  "/plans",
  asyncHandler(async (_req, res) => {
    res.json({ plans: await listActivePlans() });
  }),
);

/* ------------------------- Super-admin management ------------------------- */

router.get(
  "/super-admin/plans",
  ...superAdminGuard,
  asyncHandler(async (_req, res) => {
    res.json({ plans: await listAllPlans() });
  }),
);

router.post(
  "/super-admin/plans",
  ...superAdminGuard,
  validate({ body: createPlanSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      key: string; label: string; audience: PlanAudience;
      durationDays: number; priceInPaise: number; gstApplies: boolean; sortOrder?: number;
    };
    const created = await createPlan({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      ...body,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ plan: created });
  }),
);

router.patch(
  "/super-admin/plans/:id",
  ...superAdminGuard,
  validate({ body: updatePlanSchema }),
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const updated = await updatePlan({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      id,
      patch: req.body as Parameters<typeof updatePlan>[0]["patch"],
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ plan: updated });
  }),
);

router.delete(
  "/super-admin/plans/:id",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) throw new HttpError(400, "id is required", "ID_REQUIRED");
    const updated = await deactivatePlan({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ plan: updated });
  }),
);

export default router;
