import { Prisma, type CandidateProfile, type Education, type Experience, type ExperienceProject } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../lib/logger.js";
import { notifyProfileSubmitted } from "./notify.service.js";

/**
 * Get the caller's profile, lazily creating an empty shell on first hit so
 * the frontend can PATCH without a pre-create dance. Callers always get a
 * complete `CandidateProfile` record back (including the empty arrays).
 */
export async function getOrCreateProfile(userId: string): Promise<ProfileWithRelations> {
  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { education: true, experiences: { include: { projects: { orderBy: { createdAt: "asc" } } }, orderBy: { fromDate: "desc" } } },
  });
  if (existing) return existing;

  return prisma.candidateProfile.create({
    data: { userId },
    include: { education: true, experiences: { include: { projects: { orderBy: { createdAt: "asc" } } }, orderBy: { fromDate: "desc" } } },
  });
}

/**
 * Read-only lookup by user id — used by the employer candidate-detail page
 * and the admin candidate view. Includes the joined user record so the UI
 * doesn't have to make a second round-trip for the candidate's name/email.
 * Throws 404 if missing/soft-deleted.
 */
export async function getProfileByUserId(userId: string): Promise<ProfileWithUser> {
  const found = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      education: true,
      experiences: { include: { projects: { orderBy: { createdAt: "asc" } } }, orderBy: { fromDate: "desc" } },
      user: {
        select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true, lastSeenAt: true },
      },
    },
  });
  if (!found) throw new HttpError(404, "Profile not found", "PROFILE_NOT_FOUND");
  return found;
}

/**
 * Apply a partial update. Only fields present in `data` are touched; nulls
 * are allowed for clearing optional fields. The matching profile is created
 * implicitly if it doesn't exist yet so the frontend can PATCH on first save.
 */
export async function patchProfile(
  userId: string,
  data: Prisma.CandidateProfileUpdateInput,
): Promise<ProfileWithRelations> {
  // Ensure the row exists so a fresh user can PATCH without a 404. We
  // also grab the current selectedTemplateId so we can detect the
  // FIRST time a candidate finishes their profile (null → not-null)
  // and fire the "profile submitted for review" notification.
  const existing = await getOrCreateProfile(userId);
  const wasIncomplete = existing.selectedTemplateId === null;

  const updated = await prisma.candidateProfile.update({
    where: { userId },
    data,
    include: { education: true, experiences: { include: { projects: { orderBy: { createdAt: "asc" } } }, orderBy: { fromDate: "desc" } } },
  });

  // Detect the first-time submit: profile had no template before, and
  // this patch just set one. Every subsequent edit is a no-op for the
  // notification (we don't want to spam on every save).
  if (wasIncomplete && updated.selectedTemplateId !== null) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      void notifyProfileSubmitted({
        name: user.name,
        email: user.email,
        role: "candidate",
      }).catch((err) => logger.warn({ err, userId }, "notifyProfileSubmitted failed"));
    }
  }

  return updated;
}

/**
 * Replace the entire education list — the frontend's education step shows
 * every level and toggles `enabled`, so we just wipe and re-insert each time.
 * That avoids stale rows when the user un-checks a level.
 */
export async function replaceEducation(
  userId: string,
  rows: Array<Omit<Prisma.EducationCreateManyInput, "profileId" | "id" | "createdAt">>,
): Promise<Education[]> {
  const profile = await getOrCreateProfile(userId);
  return prisma.$transaction(async (tx) => {
    await tx.education.deleteMany({ where: { profileId: profile.id } });
    if (rows.length === 0) return [];
    await tx.education.createMany({
      data: rows.map((r) => ({ ...r, profileId: profile.id })),
    });
    return tx.education.findMany({ where: { profileId: profile.id }, orderBy: { level: "asc" } });
  });
}

export interface ExperienceProjectInput {
  name: string;
  description?: string | null;
  skills?: string[];
  showcaseUrl?: string | null;
}

export interface ExperienceRowInput {
  company: string;
  role: string;
  fromDate: string;
  toDate?: string | null;
  projects?: ExperienceProjectInput[];
}

/**
 * Replace the work-experience list (and each row's nested projects). Same
 * wipe-and-insert as education for the same reason — the form lets the user
 * add/remove rows freely and we don't want orphan records.
 * Each Experience row creates its own ExperienceProject children in the same
 * transaction so a partial failure rolls back cleanly.
 */
export async function replaceExperiences(
  userId: string,
  rows: ExperienceRowInput[],
): Promise<ExperienceWithProjects[]> {
  const profile = await getOrCreateProfile(userId);
  return prisma.$transaction(async (tx) => {
    await tx.experience.deleteMany({ where: { profileId: profile.id } });
    if (rows.length === 0) return [];
    for (const r of rows) {
      const projects = r.projects ?? [];
      await tx.experience.create({
        data: {
          profileId: profile.id,
          company: r.company,
          role: r.role,
          fromDate: r.fromDate,
          toDate: r.toDate ?? null,
          projects: projects.length
            ? {
                create: projects.map((p) => ({
                  name: p.name,
                  description: p.description ?? null,
                  skills: (p.skills ?? []) as Prisma.InputJsonValue,
                  showcaseUrl: p.showcaseUrl ?? null,
                })),
              }
            : undefined,
        },
      });
    }
    return tx.experience.findMany({
      where: { profileId: profile.id },
      orderBy: { fromDate: "desc" },
      include: { projects: { orderBy: { createdAt: "asc" } } },
    });
  });
}

/**
 * Get-or-create the caller's employer profile. The /auth/register flow only
 * creates a User row for employers — the profile is implied until they fill
 * something in. Same lazy-init story as getOrCreateProfile for candidates.
 */
export async function getOrCreateEmployerProfile(userId: string) {
  const existing = await prisma.employerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  // Inherit user.name as a placeholder companyName so the row is valid; the
  // wizard's Brand step overwrites this with the real company name.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return prisma.employerProfile.create({
    data: { userId, companyName: user?.name ?? "Untitled company" },
  });
}

/** Apply a partial update to the caller's employer profile. */
export async function patchEmployerProfile(
  userId: string,
  data: Prisma.EmployerProfileUpdateInput,
) {
  await getOrCreateEmployerProfile(userId);
  return prisma.employerProfile.update({ where: { userId }, data });
}

export type ExperienceWithProjects = Experience & { projects: ExperienceProject[] };

export type ProfileWithRelations = CandidateProfile & {
  education: Education[];
  experiences: ExperienceWithProjects[];
};

export type ProfileWithUser = ProfileWithRelations & {
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string | null;
    role: import("@prisma/client").UserRole;
    createdAt: Date;
    lastSeenAt: Date | null;
  };
};
