import { Prisma, ModerationStatus, UserRole, AuditAction } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { logger } from "../lib/logger.js";
import { notifyProfileModerated } from "./notify.service.js";

/**
 * Snapshot of the system for the admin dashboard. One round-trip, cheap
 * COUNT queries — the dashboard refreshes this every minute or so. Add
 * heavier breakdowns (revenue, conversion) only when the panel asks for them.
 */
export async function getOverviewStats() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    userTotal,
    candidates,
    employers,
    admins,
    profilesPending,
    profilesApproved,
    profilesRejected,
    signupsLast7d,
    jobsActive,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, role: UserRole.CANDIDATE } }),
    prisma.user.count({ where: { deletedAt: null, role: UserRole.EMPLOYER } }),
    prisma.user.count({
      where: { deletedAt: null, role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } },
    }),
    prisma.candidateProfile.count({ where: { moderationStatus: ModerationStatus.PENDING } }),
    prisma.candidateProfile.count({ where: { moderationStatus: ModerationStatus.APPROVED } }),
    prisma.candidateProfile.count({ where: { moderationStatus: ModerationStatus.REJECTED } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since7d } } }),
    prisma.job.count({ where: { deletedAt: null, status: "ACTIVE" } }),
  ]);

  return {
    users: { total: userTotal, candidates, employers, admins },
    profiles: {
      pending: profilesPending,
      approved: profilesApproved,
      rejected: profilesRejected,
      total: profilesPending + profilesApproved + profilesRejected,
    },
    jobs: { active: jobsActive },
    signupsLast7d,
  };
}

/**
 * 7-day daily trend series for the admin/super-admin sparklines. Returns an
 * array of length 7 per metric — index 0 is the oldest day, index 6 is today.
 * One SQL group-by per metric bucketed by day-of-year in the local TZ.
 * Cheap enough to compute on every dashboard load; if it ever becomes hot,
 * cache in Redis with a 60s TTL.
 */
export async function getSevenDayTrends() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const bucketCount = async (
    fetch: (from: Date, to: Date) => Promise<number>,
  ): Promise<number[]> => {
    const out: number[] = [];
    for (let i = 0; i < days.length; i++) {
      const from = days[i]!;
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      out.push(await fetch(from, to));
    }
    return out;
  };

  const [candidateSignups, employerSignups, jobsPosted, applications] = await Promise.all([
    bucketCount((from, to) =>
      prisma.user.count({ where: { role: UserRole.CANDIDATE, createdAt: { gte: from, lt: to } } }),
    ),
    bucketCount((from, to) =>
      prisma.user.count({ where: { role: UserRole.EMPLOYER, createdAt: { gte: from, lt: to } } }),
    ),
    bucketCount((from, to) =>
      prisma.job.count({ where: { postedAt: { gte: from, lt: to } } }),
    ),
    bucketCount((from, to) =>
      prisma.application.count({ where: { appliedAt: { gte: from, lt: to } } }),
    ),
  ]);

  return {
    days: days.map((d) => d.toISOString().slice(0, 10)),
    candidateSignups,
    employerSignups,
    jobsPosted,
    applications,
  };
}

/** Recent platform activity for the live feed on the admin dashboard. */
export async function getRecentActivity(limit: number) {
  return prisma.auditLog.findMany({
    take: Math.min(Math.max(1, limit), 200),
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}

interface UserListArgs {
  role?: UserRole;
  search?: string;
  page: number;
  pageSize: number;
}

/** Paginated user list with optional role filter + email/name search. */
export async function listUsers(args: UserListArgs) {
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (args.role) where.role = args.role;
  if (args.search) {
    const q = args.search.toLowerCase();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }
  const skip = (args.page - 1) * args.pageSize;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: args.pageSize,
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        mobile: true,
        emailVerified: true,
        createdAt: true,
        lastSeenAt: true,
        candidateProfile: { select: { moderationStatus: true, selectedTemplateId: true } },
        employerProfile: { select: { companyName: true, moderationStatus: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page: args.page, pageSize: args.pageSize };
}

interface ProfileListArgs {
  status?: ModerationStatus;
  search?: string;
  page: number;
  pageSize: number;
}

/** Paginated candidate-profile list, joined with the user row. */
export async function listProfiles(args: ProfileListArgs) {
  const where: Prisma.CandidateProfileWhereInput = {};
  if (args.status) where.moderationStatus = args.status;
  if (args.search) {
    where.user = {
      OR: [
        { email: { contains: args.search, mode: "insensitive" } },
        { name: { contains: args.search, mode: "insensitive" } },
      ],
    };
  }
  const skip = (args.page - 1) * args.pageSize;
  const [items, total] = await Promise.all([
    prisma.candidateProfile.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: args.pageSize,
      include: {
        user: {
          select: { id: true, name: true, email: true, mobile: true, createdAt: true, lastSeenAt: true },
        },
      },
    }),
    prisma.candidateProfile.count({ where }),
  ]);
  return { items, total, page: args.page, pageSize: args.pageSize };
}

/** Approve or reject a candidate profile + write the audit trail. */
export async function moderateProfile(args: {
  adminId: string;
  adminRole: UserRole;
  userId: string;
  status: ModerationStatus;
  notes?: string;
  ip?: string;
  userAgent?: string;
}) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId: args.userId } });
  if (!profile) throw new HttpError(404, "Profile not found", "PROFILE_NOT_FOUND");
  if (args.status === ModerationStatus.PENDING) {
    throw new HttpError(400, "PENDING is not a valid moderation target", "INVALID_STATUS");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.candidateProfile.update({
      where: { userId: args.userId },
      data: {
        moderationStatus: args.status,
        moderationNotes: args.notes ?? null,
        moderatedAt: new Date(),
        moderatedById: args.adminId,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: args.adminId,
        actorRole: args.adminRole,
        action: args.status === ModerationStatus.APPROVED ? AuditAction.PROFILE_APPROVED : AuditAction.PROFILE_REJECTED,
        targetType: "candidate_profile",
        targetId: next.id,
        payload: { userId: args.userId, notes: args.notes ?? null },
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return next;
  });

  // Notify the candidate + cc admin activity inbox. Best-effort — the
  // moderation itself already committed, mail is a side channel.
  const candidate = await prisma.user.findUnique({ where: { id: args.userId } });
  if (candidate && !candidate.deletedAt) {
    const moderator = await prisma.user.findUnique({ where: { id: args.adminId }, select: { email: true } });
    void notifyProfileModerated({
      name: candidate.name,
      email: candidate.email,
      status: args.status,
      notes: args.notes ?? null,
      role: "candidate",
      moderatorEmail: moderator?.email,
    }).catch((err) => logger.warn({ err }, "notifyProfileModerated failed"));
  }

  return updated;
}
