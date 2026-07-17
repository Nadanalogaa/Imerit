import { ApplicationStatus, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../lib/logger.js";
import { notifyApplication } from "./notify.service.js";

/**
 * Submit an application for a job. Uniqueness is enforced by the
 * `(jobId, candidateId)` composite key on the Application table — Prisma
 * surfaces re-applies as P2002, which we translate to a friendlier 409.
 *
 * `matchScore` is the score the candidate's UI computed at click time; we
 * snapshot it for analytics so a later matcher tweak doesn't erase the
 * historical context.
 */
export async function applyForJob(args: {
  candidateId: string;
  jobId: string;
  matchScore?: number;
  coverNote?: string;
}) {
  const job = await prisma.job.findUnique({ where: { id: args.jobId } });
  if (!job || job.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");

  const profile = await prisma.candidateProfile.findUnique({ where: { userId: args.candidateId } });

  let application;
  try {
    application = await prisma.application.create({
      data: {
        jobId: args.jobId,
        candidateId: args.candidateId,
        profileId: profile?.id ?? null,
        matchScore: args.matchScore,
        coverNote: args.coverNote ?? null,
      },
    });
  } catch (err) {
    if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
      throw new HttpError(409, "You've already applied to this job", "DUPLICATE_APPLICATION");
    }
    throw err;
  }

  // Fire the three-way notification (candidate confirmation, employer
  // alert, admin cc). Best-effort — the application has already been
  // committed, we won't fail the request on a mail hiccup.
  const [candidate, employer] = await Promise.all([
    prisma.user.findUnique({ where: { id: args.candidateId } }),
    prisma.user.findUnique({ where: { id: job.employerId } }),
  ]);
  if (candidate && employer) {
    void notifyApplication({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      employerName: employer.name,
      employerEmail: employer.email,
      jobTitle: job.title,
      jobId: job.id,
    }).catch((err) => logger.warn({ err, jobId: job.id }, "notifyApplication failed"));
  }

  return application;
}

/** Candidate's own applications — includes the job snapshot for the list UI. */
export async function listMyApplications(candidateId: string) {
  return prisma.application.findMany({
    where: { candidateId },
    orderBy: { appliedAt: "desc" },
    include: { job: true },
  });
}

/**
 * Applicants for one of the employer's jobs. Ownership of the job is
 * enforced here so an attacker can't probe arbitrary jobIds.
 */
export async function listApplicantsForJob(args: { employerId: string; jobId: string }) {
  const job = await prisma.job.findUnique({ where: { id: args.jobId } });
  if (!job || job.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");
  if (job.employerId !== args.employerId) {
    throw new HttpError(403, "You can only view applicants for your own jobs", "FORBIDDEN");
  }

  return prisma.application.findMany({
    where: { jobId: args.jobId },
    orderBy: [{ matchScore: "desc" }, { appliedAt: "desc" }],
    include: {
      candidate: {
        select: { id: true, name: true, email: true, mobile: true, createdAt: true },
      },
      profile: true,
    },
  });
}

/** Employer marks an applicant's status — used for the kanban-style pipeline. */
export async function updateApplicationStatus(args: {
  employerId: string;
  applicationId: string;
  status: ApplicationStatus;
}) {
  const app = await prisma.application.findUnique({
    where: { id: args.applicationId },
    include: { job: true },
  });
  if (!app) throw new HttpError(404, "Application not found", "APPLICATION_NOT_FOUND");
  if (app.job.employerId !== args.employerId) {
    throw new HttpError(403, "You can only update applications for your own jobs", "FORBIDDEN");
  }
  return prisma.application.update({
    where: { id: args.applicationId },
    data: { status: args.status },
  });
}
