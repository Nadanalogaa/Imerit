import { AuditAction, type Plan, PlanAudience, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { HttpError } from "../middleware/error.js";

/**
 * Default plan catalogue — seeded once on first boot so the platform isn't
 * empty for the very first super-admin. Pricing matches read.md (₹333 for
 * candidates, employer SME + Large tiers in paise). Sort order keeps the
 * subscribe pages stable.
 *
 * After seeding, the super-admin can edit every field via /super-admin/plans.
 * Subsequent boots see the rows already exist and skip seeding entirely.
 */
const DEFAULT_PLANS: Array<{
  key: string;
  label: string;
  audience: PlanAudience;
  durationDays: number;
  priceInPaise: number;
  gstApplies: boolean;
  sortOrder: number;
}> = [
  { key: "candidate_45d", label: "Candidate · 45 days", audience: PlanAudience.CANDIDATE, durationDays: 45, priceInPaise: 33300, gstApplies: false, sortOrder: 10 },
  { key: "emp_sme_9d", label: "Employer SME · 9 days", audience: PlanAudience.EMPLOYER_SME, durationDays: 9, priceInPaise: 170100, gstApplies: true, sortOrder: 20 },
  { key: "emp_sme_18d", label: "Employer SME · 18 days", audience: PlanAudience.EMPLOYER_SME, durationDays: 18, priceInPaise: 340200, gstApplies: true, sortOrder: 21 },
  { key: "emp_sme_27d", label: "Employer SME · 27 days", audience: PlanAudience.EMPLOYER_SME, durationDays: 27, priceInPaise: 680400, gstApplies: true, sortOrder: 22 },
  { key: "emp_large_54d", label: "Employer Large · 54 days", audience: PlanAudience.EMPLOYER_LARGE, durationDays: 54, priceInPaise: 1360800, gstApplies: true, sortOrder: 30 },
  { key: "emp_large_108d", label: "Employer Large · 108 days", audience: PlanAudience.EMPLOYER_LARGE, durationDays: 108, priceInPaise: 2721600, gstApplies: true, sortOrder: 31 },
  { key: "emp_large_216d", label: "Employer Large · 216 days", audience: PlanAudience.EMPLOYER_LARGE, durationDays: 216, priceInPaise: 5443200, gstApplies: true, sortOrder: 32 },
];

/** Idempotent — runs on boot. Anything missing gets inserted; existing rows are left alone. */
export async function ensureDefaultPlans(): Promise<void> {
  for (const seed of DEFAULT_PLANS) {
    const exists = await prisma.plan.findUnique({ where: { key: seed.key } });
    if (exists) continue;
    await prisma.plan.create({ data: { ...seed, active: true } });
    logger.info({ key: seed.key }, "Seeded default plan");
  }
}

/** Public list — used by candidate + employer subscribe pages. Active plans only. */
export async function listActivePlans(): Promise<Plan[]> {
  return prisma.plan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { priceInPaise: "asc" }],
  });
}

/** Super-admin list — includes inactive plans so they can be re-enabled. */
export async function listAllPlans(): Promise<Plan[]> {
  return prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { priceInPaise: "asc" }],
  });
}

interface CreatePlanArgs {
  actorId: string;
  actorRole: UserRole;
  key: string;
  label: string;
  audience: PlanAudience;
  durationDays: number;
  priceInPaise: number;
  gstApplies: boolean;
  sortOrder?: number;
  ip?: string;
  userAgent?: string;
}

export async function createPlan(args: CreatePlanArgs): Promise<Plan> {
  return prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({
      data: {
        key: args.key.trim(),
        label: args.label.trim(),
        audience: args.audience,
        durationDays: args.durationDays,
        priceInPaise: args.priceInPaise,
        gstApplies: args.gstApplies,
        sortOrder: args.sortOrder ?? 100,
        active: true,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.PLAN_CREATED,
        targetType: "plan",
        targetId: created.id,
        payload: { key: created.key, audience: created.audience, priceInPaise: created.priceInPaise },
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return created;
  });
}

interface UpdatePlanArgs {
  actorId: string;
  actorRole: UserRole;
  id: string;
  patch: Partial<{ label: string; durationDays: number; priceInPaise: number; gstApplies: boolean; sortOrder: number; active: boolean }>;
  ip?: string;
  userAgent?: string;
}

export async function updatePlan(args: UpdatePlanArgs): Promise<Plan> {
  const existing = await prisma.plan.findUnique({ where: { id: args.id } });
  if (!existing) throw new HttpError(404, "Plan not found", "PLAN_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.plan.update({ where: { id: args.id }, data: args.patch });
    // Snapshot the before/after so the audit log is reviewable later.
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.PLAN_UPDATED,
        targetType: "plan",
        targetId: existing.id,
        payload: { key: existing.key, before: existing, after: updated },
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return updated;
  });
}

interface DeletePlanArgs {
  actorId: string;
  actorRole: UserRole;
  id: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Plans don't get truly deleted — existing subscriptions reference them
 * historically. Instead we flip `active = false` so they vanish from the
 * subscribe pages while staying intact for billing + analytics.
 */
export async function deactivatePlan(args: DeletePlanArgs): Promise<Plan> {
  const existing = await prisma.plan.findUnique({ where: { id: args.id } });
  if (!existing) throw new HttpError(404, "Plan not found", "PLAN_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.plan.update({ where: { id: args.id }, data: { active: false } });
    await tx.auditLog.create({
      data: {
        actorId: args.actorId,
        actorRole: args.actorRole,
        action: AuditAction.PLAN_DELETED,
        targetType: "plan",
        targetId: existing.id,
        payload: { key: existing.key, label: existing.label },
        ip: args.ip,
        userAgent: args.userAgent?.slice(0, 512),
      },
    });
    return updated;
  });
}
