import { Router } from "express";
import { ApplicationStatus, JobExperience, JobField, JobType, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  applyJobSchema,
  browseJobsSchema,
  createJobSchema,
  updateApplicationStatusSchema,
  updateJobSchema,
} from "../schemas/jobs.schemas.js";
import {
  createJob,
  deleteJob,
  getJobById,
  listEmployerJobs,
  listPublicJobs,
  updateJob,
} from "../services/jobs.service.js";
import {
  applyForJob,
  listApplicantsForJob,
  listMyApplications,
  updateApplicationStatus,
} from "../services/applications.service.js";
import { listSavedJobs, saveJob, unsaveJob } from "../services/saved-jobs.service.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const paramId = (raw: string | string[] | undefined): string => {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) throw new HttpError(400, "id is required", "ID_REQUIRED");
  return v;
};

/* ============================== Public / Candidate ============================== */

/** Browse jobs — no auth required so the landing page can preview. */
router.get(
  "/jobs",
  validate({ query: browseJobsSchema }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as {
      field?: JobField; type?: JobType; experience?: JobExperience;
      districtId?: string; search?: string; page: number; pageSize: number;
    };
    res.json(await listPublicJobs(q));
  }),
);

router.get(
  "/jobs/:id",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    res.json({ job: await getJobById(id) });
  }),
);

/* ----------------------- Candidate's own applications ----------------------- */

router.get(
  "/candidate/applications",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  asyncHandler(async (req, res) => {
    res.json({ items: await listMyApplications(req.user!.sub) });
  }),
);

router.post(
  "/jobs/:id/apply",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  validate({ body: applyJobSchema }),
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const body = req.body as { matchScore?: number; coverNote?: string };
    const app = await applyForJob({
      candidateId: req.user!.sub,
      jobId: id,
      matchScore: body.matchScore,
      coverNote: body.coverNote,
    });
    res.status(201).json({ application: app });
  }),
);

/* ----------------------- Candidate's saved-jobs list ----------------------- */

router.get(
  "/candidate/saved-jobs",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  asyncHandler(async (req, res) => {
    res.json({ items: await listSavedJobs(req.user!.sub) });
  }),
);

router.post(
  "/candidate/saved-jobs/:jobId",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  asyncHandler(async (req, res) => {
    const jobId = paramId(req.params.jobId);
    res.status(201).json({ saved: await saveJob({ candidateId: req.user!.sub, jobId }) });
  }),
);

router.delete(
  "/candidate/saved-jobs/:jobId",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  asyncHandler(async (req, res) => {
    const jobId = paramId(req.params.jobId);
    await unsaveJob({ candidateId: req.user!.sub, jobId });
    res.json({ ok: true });
  }),
);

/* ================================ Employer ================================ */

router.get(
  "/employer/jobs",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  asyncHandler(async (req, res) => {
    res.json({ items: await listEmployerJobs(req.user!.sub) });
  }),
);

router.post(
  "/employer/jobs",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  validate({ body: createJobSchema }),
  asyncHandler(async (req, res) => {
    const employer = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!employer) throw new HttpError(404, "Employer not found", "USER_NOT_FOUND");

    // We snapshot the employer's name into the job row so list views never
    // need an extra join. Frontend's existing JobCard renders the field as-is.
    const job = await createJob({
      employerId: employer.id,
      employerName: employer.name,
      data: req.body as Parameters<typeof createJob>[0]["data"],
    });
    res.status(201).json({ job });
  }),
);

router.patch(
  "/employer/jobs/:id",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  validate({ body: updateJobSchema }),
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const job = await updateJob({
      employerId: req.user!.sub,
      id,
      patch: req.body as Parameters<typeof updateJob>[0]["patch"],
    });
    res.json({ job });
  }),
);

router.delete(
  "/employer/jobs/:id",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    await deleteJob({ employerId: req.user!.sub, id });
    res.json({ ok: true });
  }),
);

router.get(
  "/employer/jobs/:id/applicants",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    res.json({ items: await listApplicantsForJob({ employerId: req.user!.sub, jobId: id }) });
  }),
);

router.patch(
  "/employer/applications/:id",
  requireAuth,
  requireRole(UserRole.EMPLOYER),
  validate({ body: updateApplicationStatusSchema }),
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const { status } = req.body as { status: ApplicationStatus };
    const app = await updateApplicationStatus({
      employerId: req.user!.sub,
      applicationId: id,
      status,
    });
    res.json({ application: app });
  }),
);

export default router;
