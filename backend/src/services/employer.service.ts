import {
  CandidateType,
  FieldKind,
  ModerationStatus,
  type Prisma,
  TemplateId,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

/**
 * Employer-facing candidate search. Surfaces only APPROVED profiles —
 * candidates whose completed profile has been reviewed and cleared by
 * admin. PENDING and REJECTED profiles stay hidden from employers so
 * they only see vetted talent. Combined with the moderation queue at
 * /admin/candidates?status=PENDING and the automatic email notifications
 * on approve/reject, this is the "curated marketplace" pattern.
 *
 * The list payload is intentionally lean — name/role/field/location/skills
 * is enough for the cards on EmployerCandidates. Full profile detail is
 * fetched separately via /profiles/:userId (which is still subscription-
 * gated on the frontend until we move that check to the backend in Phase 5).
 */
export interface CandidateSearchFilters {
  field?: FieldKind;
  type?: CandidateType;
  search?: string;
  districtId?: string;
  page: number;
  pageSize: number;
}

export async function searchCandidatesForEmployer(args: CandidateSearchFilters) {
  // Compose AND clauses so district + search filters can coexist; Prisma's OR
  // is per-key so nesting under AND is the safest way to combine two OR groups.
  const and: Prisma.CandidateProfileWhereInput[] = [];

  if (args.districtId) {
    and.push({
      OR: [
        { currentDistrictId: args.districtId },
        { preferredDistrictId: args.districtId },
      ],
    });
  }
  if (args.search?.trim()) {
    const q = args.search.trim();
    and.push({
      OR: [
        { itSpecialization: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.CandidateProfileWhereInput = {
    selectedTemplateId: { not: null },
    moderationStatus: ModerationStatus.APPROVED,
    ...(args.field ? { field: args.field } : {}),
    ...(args.type ? { type: args.type } : {}),
    ...(and.length ? { AND: and } : {}),
  };

  const skip = (args.page - 1) * args.pageSize;
  const [items, total] = await Promise.all([
    prisma.candidateProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: args.pageSize,
      select: {
        id: true,
        userId: true,
        photoUrl: true,
        field: true,
        type: true,
        itSpecialization: true,
        itLanguages: true,
        nonItDepartments: true,
        topSkills: true,
        yearsOfExperience: true,
        preferredLocation: true,
        preferredLat: true,
        preferredLng: true,
        currentLat: true,
        currentLng: true,
        selectedTemplateId: true,
        moderationStatus: true,
        updatedAt: true,
        user: {
          select: { id: true, name: true, email: true, mobile: true, createdAt: true },
        },
      },
    }),
    prisma.candidateProfile.count({ where }),
  ]);
  return { items, total, page: args.page, pageSize: args.pageSize };
}

// Re-export enum tags the route validation references at runtime.
export const _candidateEnums = { CandidateType, FieldKind, TemplateId };
