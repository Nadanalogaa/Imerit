import { Router } from "express";
import { Prisma, UserRole } from "@prisma/client";

import { asyncHandler, HttpError } from "../middleware/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getOrCreateProfile,
  getProfileByUserId,
  patchProfile,
  replaceEducation,
  replaceExperiences,
} from "../services/profile.service.js";
import {
  educationReplaceSchema,
  experiencesReplaceSchema,
  profilePatchSchema,
} from "../schemas/profile.schemas.js";

const router = Router();

/**
 * Convert a profile row into the public-safe shape — drops the private
 * street fields that should never go over the wire to non-owners. Accepts
 * any of the profile-with-relations shapes (with or without user joined).
 */
function publicProfile<T extends { currentStreet?: string | null }>(row: T, includePrivate: boolean): T | Omit<T, "currentStreet"> {
  if (includePrivate) return row;
  const { currentStreet, ...rest } = row;
  void currentStreet;
  return rest as Omit<T, "currentStreet">;
}

/* ---------- The caller's own profile (auth required, candidate only) ---------- */

router.get(
  "/candidate/profile",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  asyncHandler(async (req, res) => {
    const profile = await getOrCreateProfile(req.user!.sub);
    res.json({ profile: publicProfile(profile, true) });
  }),
);

router.patch(
  "/candidate/profile",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  validate({ body: profilePatchSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body as Prisma.CandidateProfileUpdateInput;
    const profile = await patchProfile(req.user!.sub, data);
    res.json({ profile: publicProfile(profile, true) });
  }),
);

router.put(
  "/candidate/profile/education",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  validate({ body: educationReplaceSchema }),
  asyncHandler(async (req, res) => {
    const { education } = req.body as { education: Array<{ level: string; enabled: boolean }> };
    const rows = await replaceEducation(req.user!.sub, education as Parameters<typeof replaceEducation>[1]);
    res.json({ education: rows });
  }),
);

router.put(
  "/candidate/profile/experiences",
  requireAuth,
  requireRole(UserRole.CANDIDATE),
  validate({ body: experiencesReplaceSchema }),
  asyncHandler(async (req, res) => {
    const { experiences } = req.body as { experiences: Array<{ company: string; role: string; fromDate: string }> };
    const rows = await replaceExperiences(req.user!.sub, experiences as Parameters<typeof replaceExperiences>[1]);
    res.json({ experiences: rows });
  }),
);

/* ---------- Read another candidate's profile (employer + admin views) ---------- */

router.get(
  "/profiles/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawId = req.params.userId;
    const userId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!userId) throw new HttpError(400, "userId is required", "USER_ID_REQUIRED");
    const profile = await getProfileByUserId(userId);
    // Owner sees private fields; everyone else gets the public projection.
    const includePrivate = req.user!.sub === userId || req.user!.role === UserRole.ADMIN || req.user!.role === UserRole.SUPER_ADMIN;
    res.json({ profile: publicProfile(profile, includePrivate) });
  }),
);

export default router;
