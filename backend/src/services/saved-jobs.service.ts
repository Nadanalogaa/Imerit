import { type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

/**
 * Toggle a saved-job bookmark. Idempotent on both sides:
 *   - saving an already-saved job is a no-op (returns the existing row)
 *   - unsaving a not-saved job is a no-op (returns deletedCount: 0)
 *
 * The `(candidateId, jobId)` unique index protects against duplicates.
 */
export async function saveJob(args: { candidateId: string; jobId: string }) {
  const job = await prisma.job.findUnique({ where: { id: args.jobId } });
  if (!job || job.deletedAt) throw new HttpError(404, "Job not found", "JOB_NOT_FOUND");

  try {
    return await prisma.savedJob.create({
      data: { candidateId: args.candidateId, jobId: args.jobId },
    });
  } catch (err) {
    if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
      // Already saved — return the existing row so the caller doesn't have to branch.
      const existing = await prisma.savedJob.findUnique({
        where: { candidateId_jobId: { candidateId: args.candidateId, jobId: args.jobId } },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function unsaveJob(args: { candidateId: string; jobId: string }) {
  return prisma.savedJob.deleteMany({
    where: { candidateId: args.candidateId, jobId: args.jobId },
  });
}

export async function listSavedJobs(candidateId: string) {
  return prisma.savedJob.findMany({
    where: { candidateId },
    orderBy: { savedAt: "desc" },
    include: { job: true },
  });
}
