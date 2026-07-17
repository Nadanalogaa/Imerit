import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { staffCreateJobSchema } from "../schemas/jobs.schemas.js";
import {
  createEmployerByStaff,
  createStaffAndNotify,
  listEmployersForStaff,
  listStaff,
  resetEmployerPasswordByStaff,
  resetStaffPassword,
  setStaffDeactivated,
  setStaffPassword,
  updateEmployerByStaff,
} from "../services/staff.service.js";
import { createJob } from "../services/jobs.service.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const paramId = (raw: string | string[] | undefined): string => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) throw new HttpError(400, "id is required", "ID_REQUIRED");
  return v;
};

const superAdminGuard = [requireAuth, requireRole(UserRole.SUPER_ADMIN)];
const staffGuard = [requireAuth, requireRole(UserRole.STAFF)];

// ==================================================================
// Super-admin — manage staff accounts
// ==================================================================

router.get(
  "/super-admin/staff",
  ...superAdminGuard,
  asyncHandler(async (_req, res) => {
    res.json({ items: await listStaff() });
  }),
);

router.post(
  "/super-admin/staff",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const body = req.body as { email?: unknown; name?: unknown; mobile?: unknown };
    if (typeof body.email !== "string" || typeof body.name !== "string") {
      throw new HttpError(400, "email and name are required", "MISSING_FIELDS");
    }
    const { user, password } = await createStaffAndNotify({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      actorEmail: req.user!.email,
      email: body.email,
      name: body.name,
      mobile: typeof body.mobile === "string" ? body.mobile : undefined,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ user, password });
  }),
);

router.patch(
  "/super-admin/staff/:id/reset-password",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const { user, password } = await resetStaffPassword({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      actorEmail: req.user!.email,
      staffId: paramId(req.params.id),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.json({ user, password });
  }),
);

router.patch(
  "/super-admin/staff/:id/set-password",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const body = req.body as { password?: unknown };
    if (typeof body.password !== "string") {
      throw new HttpError(400, "password is required", "MISSING_PASSWORD");
    }
    const { user } = await setStaffPassword({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      staffId: paramId(req.params.id),
      password: body.password,
    });
    res.json({ user });
  }),
);

router.patch(
  "/super-admin/staff/:id/deactivate",
  ...superAdminGuard,
  asyncHandler(async (req, res) => {
    const body = req.body as { deactivated?: unknown };
    if (typeof body.deactivated !== "boolean") {
      throw new HttpError(400, "deactivated (boolean) is required", "MISSING_FLAG");
    }
    const { user } = await setStaffDeactivated({
      actorId: req.user!.sub,
      actorRole: req.user!.role,
      actorEmail: req.user!.email,
      staffId: paramId(req.params.id),
      deactivated: body.deactivated,
    });
    res.json({ user });
  }),
);

// ==================================================================
// Staff — manage employers they've provisioned + post jobs for them
// ==================================================================

router.get(
  "/staff/employers",
  ...staffGuard,
  asyncHandler(async (req, res) => {
    res.json({ items: await listEmployersForStaff(req.user!.sub) });
  }),
);

// Jobs THIS staff user posted (across any employer). We use the exact
// same job shape as /employer/jobs so the frontend can reuse fromApiJob().
router.get(
  "/staff/jobs",
  ...staffGuard,
  asyncHandler(async (req, res) => {
    const rows = await prisma.job.findMany({
      where: { postedByStaffId: req.user!.sub, deletedAt: null },
      orderBy: { postedAt: "desc" },
      include: {
        _count: { select: { applications: true } },
      },
    });
    res.json({ items: rows });
  }),
);

router.post(
  "/staff/employers",
  ...staffGuard,
  asyncHandler(async (req, res) => {
    const body = req.body as { name?: unknown; email?: unknown; mobile?: unknown; company?: unknown };
    if (typeof body.name !== "string" || typeof body.email !== "string") {
      throw new HttpError(400, "name and email are required", "MISSING_FIELDS");
    }
    const { user, password } = await createEmployerByStaff({
      staffId: req.user!.sub,
      staffEmail: req.user!.email,
      name: body.name,
      email: body.email,
      mobile: typeof body.mobile === "string" ? body.mobile : undefined,
      company: typeof body.company === "string" ? body.company : undefined,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ user, password });
  }),
);

router.patch(
  "/staff/employers/:id",
  ...staffGuard,
  asyncHandler(async (req, res) => {
    const body = req.body as { name?: unknown; mobile?: unknown; company?: unknown };
    const { user } = await updateEmployerByStaff({
      staffId: req.user!.sub,
      employerId: paramId(req.params.id),
      patch: {
        name: typeof body.name === "string" ? body.name : undefined,
        mobile: body.mobile === undefined ? undefined : (typeof body.mobile === "string" ? body.mobile : null),
        company: body.company === undefined ? undefined : (typeof body.company === "string" ? body.company : null),
      },
    });
    res.json({ user });
  }),
);

router.patch(
  "/staff/employers/:id/reset-password",
  ...staffGuard,
  asyncHandler(async (req, res) => {
    const { user, password } = await resetEmployerPasswordByStaff({
      staffId: req.user!.sub,
      staffEmail: req.user!.email,
      employerId: paramId(req.params.id),
    });
    res.json({ user, password });
  }),
);

// ------------------------------------------------------------------
// Staff posts a job on behalf of a specific employer. The employerId
// is in the BODY (not derived from req.user.sub — that would be the
// staff's own id). We snapshot the employer's name onto the job row
// exactly like the /employer/jobs endpoint does.
// ------------------------------------------------------------------
router.post(
  "/staff/jobs",
  ...staffGuard,
  validate({ body: staffCreateJobSchema }),
  asyncHandler(async (req, res) => {
    // staffCreateJobSchema guarantees employerId is a non-empty string.
    const body = req.body as { employerId: string } & Parameters<typeof createJob>[0]["data"];
    const employer = await prisma.user.findUnique({ where: { id: body.employerId } });
    if (!employer || employer.deletedAt) throw new HttpError(404, "Employer not found", "EMPLOYER_NOT_FOUND");
    if (employer.role !== UserRole.EMPLOYER) throw new HttpError(400, "Target is not an employer account", "NOT_EMPLOYER");

    // Strip employerId from the pass-through — it's a request-body field,
    // not a job-model field. The createJob service will merge the rest.
    const { employerId: _emp, ...jobData } = body;
    const job = await createJob({
      employerId: employer.id,
      employerName: employer.name,
      postedByStaffId: req.user!.sub,
      data: jobData as Parameters<typeof createJob>[0]["data"],
    });
    res.status(201).json({ job });
  }),
);

export default router;
