import {
  type Job,
  type JobExperience,
  type JobField,
  JobStatus,
  type JobType,
  ModerationStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../lib/logger.js";
import { notifyJobPosted } from "./notify.service.js";

/**
 * Filter shape used by GET /jobs. Every property is optional — only the
 * ones the candidate set on the browse page get applied.
 */
export interface JobFilters {
  field?: JobField;
  type?: JobType;
  experience?: JobExperience;
  districtId?: string;
  industry?: string;
  department?: string;
  search?: string;
  page: number;
  pageSize: number;
}

/**
 * Public job list — what the candidate sees on /candidate/jobs. We only
 * surface ACTIVE jobs that aren't deleted and aren't moderation-REJECTED.
 * Sorted by `postedAt` desc so newly posted roles bubble up top.
 */
export async function listPublicJobs(args: JobFilters) {
  const where: Prisma.JobWhereInput = {
    deletedAt: null,
    status: JobStatus.ACTIVE,
    // 45-day listing window — anything past its expiry drops from the
    // public feed without touching the row. The employer still sees it
    // in their own /employer/jobs list marked "Expired · Repost".
    expiresAt: { gt: new Date() },
    NOT: { moderationStatus: ModerationStatus.REJECTED },
  };
  if (args.field) where.field = args.field;
  if (args.type) where.type = args.type;
  // For experience filter we include "ANY" jobs in either bucket so a
  // fresher who picks "fresher" still sees roles open to all experience.
  if (args.experience === "FRESHER") where.experience = { in: ["FRESHER", "ANY"] };
  else if (args.experience === "EXPERIENCED") where.experience = { in: ["EXPERIENCED", "ANY"] };
  // Both the district match and the search match are OR-groups; we
  // compose them via AND so they don't clobber each other's `where.OR`.
  const and: Prisma.JobWhereInput[] = [];
  if (args.districtId) {
    // A job matches when EITHER its primary district or ANY extra
    // JobLocation row is in the picked district.
    and.push({
      OR: [
        { districtId: args.districtId },
        { locations: { some: { districtId: args.districtId } } },
      ],
    });
  }
  if (args.industry) where.industry = args.industry;
  if (args.department) where.department = args.department;
  if (args.search?.trim()) {
    const q = args.search.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { employerName: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (and.length) where.AND = and;

  const skip = (args.page - 1) * args.pageSize;
  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { postedAt: "desc" },
      skip,
      take: args.pageSize,
      include: { locations: { orderBy: { position: "asc" } } },
    }),
    prisma.job.count({ where }),
  ]);
  return { items, total, page: args.page, pageSize: args.pageSize };
}

export async function getJobById(id: string): Promise<Job> {
  const job = await prisma.job.findUnique({
    where: { id },
    include: { locations: { orderBy: { position: "asc" } } },
  });
  if (!job || job.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");
  return job;
}

export async function listEmployerJobs(employerId: string) {
  return prisma.job.findMany({
    where: { employerId, deletedAt: null },
    orderBy: { postedAt: "desc" },
    include: {
      _count: { select: { applications: true, savedBy: true } },
      locations: { orderBy: { position: "asc" } },
    },
  });
}

interface CreateJobArgs {
  employerId: string;
  employerName: string;
  data: {
    title: string;
    description: string;
    location: string;
    districtId?: string;
    talukId?: string;
    lat?: number;
    lng?: number;
    pincode?: string;
    street?: string;
    field: JobField;
    type: JobType;
    experience: JobExperience;
    yearsMin?: number;
    yearsMax?: number;
    salaryRange?: string;
    skills: string[];
    benefits?: string[];
    contactEmail?: string;
    contactMobile?: string;
    industry?: string;
    department?: string;
    /** Extra locations beyond the primary — the JobLocation child rows. */
    extraLocations?: Array<{
      districtId?: string;
      talukId?: string;
      lat?: number;
      lng?: number;
      pincode?: string;
      street?: string;
      label: string;
    }>;
  };
}

/**
 * Create a job. We default both status and moderation to ACTIVE / APPROVED
 * so the demo flow is friction-free; an admin can later flip a job to
 * REJECTED via the moderation endpoint and the public list will hide it.
 */
export async function createJob(args: CreateJobArgs & { postedByStaffId?: string }): Promise<Job> {
  const { extraLocations, ...primary } = args.data;
  const job = await prisma.job.create({
    data: {
      employerId: args.employerId,
      employerName: args.employerName,
      // Optional back-reference to the staff user who posted on behalf of
      // this employer. NULL when the employer posted the job themselves.
      postedByStaffId: args.postedByStaffId,
      ...primary,
      skills: primary.skills,
      benefits: primary.benefits ?? [],
      status: JobStatus.ACTIVE,
      moderationStatus: ModerationStatus.APPROVED,
      locations:
        extraLocations && extraLocations.length
          ? {
              create: extraLocations.map((loc, i) => ({
                districtId: loc.districtId,
                talukId: loc.talukId,
                lat: loc.lat,
                lng: loc.lng,
                pincode: loc.pincode,
                street: loc.street,
                label: loc.label,
                position: i,
              })),
            }
          : undefined,
    },
    include: { locations: { orderBy: { position: "asc" } } },
  });

  // Notify the employer their job is live + cc admin activity inbox.
  // Best-effort; job is already committed by the time this fires.
  const employer = await prisma.user.findUnique({ where: { id: args.employerId } });
  let staffEmail: string | undefined;
  if (args.postedByStaffId) {
    const staff = await prisma.user.findUnique({ where: { id: args.postedByStaffId }, select: { email: true } });
    staffEmail = staff?.email;
  }
  if (employer) {
    void notifyJobPosted({
      employerName: employer.name,
      employerEmail: employer.email,
      jobTitle: job.title,
      jobId: job.id,
      postedByStaffEmail: staffEmail,
    }).catch((err) => logger.warn({ err, jobId: job.id }, "notifyJobPosted failed"));
  }

  return job;
}

interface UpdateJobArgs {
  employerId: string;
  id: string;
  patch: Partial<CreateJobArgs["data"]> & { status?: JobStatus };
}

export async function updateJob(args: UpdateJobArgs): Promise<Job> {
  const existing = await prisma.job.findUnique({ where: { id: args.id } });
  if (!existing || existing.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");
  if (existing.employerId !== args.employerId) {
    throw new HttpError(403, "You can only edit your own jobs", "FORBIDDEN");
  }
  // If the caller sent extraLocations, we replace the whole child set
  // (wipe + reinsert) so the wizard's "add / remove locations" flow
  // stays stateless. Omit the field to leave existing rows alone.
  const { extraLocations, ...scalar } = args.patch;
  return prisma.$transaction(async (tx) => {
    if (extraLocations !== undefined) {
      await tx.jobLocation.deleteMany({ where: { jobId: args.id } });
      if (extraLocations.length) {
        await tx.jobLocation.createMany({
          data: extraLocations.map((loc, i) => ({
            jobId: args.id,
            districtId: loc.districtId,
            talukId: loc.talukId,
            lat: loc.lat,
            lng: loc.lng,
            pincode: loc.pincode,
            street: loc.street,
            label: loc.label,
            position: i,
          })),
        });
      }
    }
    return tx.job.update({
      where: { id: args.id },
      data: scalar,
      include: { locations: { orderBy: { position: "asc" } } },
    });
  });
}

/**
 * Repost — resets postedAt to now and pushes expiresAt out 45 days.
 * Existing applications and saves are preserved (Naukri/Indeed pattern).
 * Only the owner can repost their own listing.
 */
const REPOST_DAYS = 45;
export async function repostJob(args: { employerId: string; id: string }): Promise<Job> {
  const existing = await prisma.job.findUnique({ where: { id: args.id } });
  if (!existing || existing.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");
  if (existing.employerId !== args.employerId) {
    throw new HttpError(403, "You can only repost your own jobs", "FORBIDDEN");
  }
  const now = new Date();
  return prisma.job.update({
    where: { id: args.id },
    data: {
      postedAt: now,
      expiresAt: new Date(now.getTime() + REPOST_DAYS * 24 * 60 * 60 * 1000),
      // If a listing was closed manually, repost also brings it back active.
      status: JobStatus.ACTIVE,
    },
  });
}

export async function deleteJob(args: { employerId: string; id: string }): Promise<void> {
  const existing = await prisma.job.findUnique({ where: { id: args.id } });
  if (!existing || existing.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");
  if (existing.employerId !== args.employerId) {
    throw new HttpError(403, "You can only delete your own jobs", "FORBIDDEN");
  }
  await prisma.job.update({
    where: { id: args.id },
    data: { deletedAt: new Date(), status: JobStatus.CLOSED },
  });
}
