import { Prisma, type CandidateProfile, type Education, type Experience } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

/**
 * Get the caller's profile, lazily creating an empty shell on first hit so
 * the frontend can PATCH without a pre-create dance. Callers always get a
 * complete `CandidateProfile` record back (including the empty arrays).
 */
export async function getOrCreateProfile(userId: string): Promise<ProfileWithRelations> {
  const existing = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { education: true, experiences: true },
  });
  if (existing) return existing;

  return prisma.candidateProfile.create({
    data: { userId },
    include: { education: true, experiences: true },
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
      experiences: true,
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
  // Ensure the row exists so a fresh user can PATCH without a 404.
  await getOrCreateProfile(userId);
  return prisma.candidateProfile.update({
    where: { userId },
    data,
    include: { education: true, experiences: true },
  });
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

/**
 * Replace the work-experience list. Same wipe-and-insert as education for
 * the same reason — the form lets the user add/remove rows freely and we
 * don't want orphan records.
 */
export async function replaceExperiences(
  userId: string,
  rows: Array<Omit<Prisma.ExperienceCreateManyInput, "profileId" | "id" | "createdAt">>,
): Promise<Experience[]> {
  const profile = await getOrCreateProfile(userId);
  return prisma.$transaction(async (tx) => {
    await tx.experience.deleteMany({ where: { profileId: profile.id } });
    if (rows.length === 0) return [];
    await tx.experience.createMany({
      data: rows.map((r) => ({ ...r, profileId: profile.id })),
    });
    return tx.experience.findMany({ where: { profileId: profile.id }, orderBy: { fromDate: "desc" } });
  });
}

export type ProfileWithRelations = CandidateProfile & {
  education: Education[];
  experiences: Experience[];
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
