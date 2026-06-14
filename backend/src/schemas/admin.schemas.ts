import { z } from "zod";
import { ModerationStatus, PlanAudience, UserRole } from "@prisma/client";

const pageNumber = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

export const adminUserListSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().trim().max(200).optional(),
  page: pageNumber,
  pageSize,
});

export const adminProfileListSchema = z.object({
  status: z.nativeEnum(ModerationStatus).optional(),
  search: z.string().trim().max(200).optional(),
  page: pageNumber,
  pageSize,
});

export const adminActivitySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const moderateProfileSchema = z.object({
  status: z.enum([ModerationStatus.APPROVED, ModerationStatus.REJECTED]),
  notes: z.string().max(2000).optional(),
});

/** Inputs for the super-admin's create-admin endpoint. */
export const createAdminSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120),
  role: z.enum([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
});

/** Plan management — values in PAISE to avoid float drift. */
const planKey = z.string().trim().regex(/^[a-z0-9_-]{3,40}$/u, "Use 3–40 lowercase letters / digits / _ / -");
const planLabel = z.string().trim().min(2).max(120);
const planAudience = z.nativeEnum(PlanAudience);
const planDays = z.number().int().min(1).max(3650);
const planPricePaise = z.number().int().min(0).max(10_00_00_00); // ₹10 lakh ceiling

export const createPlanSchema = z.object({
  key: planKey,
  label: planLabel,
  audience: planAudience,
  durationDays: planDays,
  priceInPaise: planPricePaise,
  gstApplies: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const updatePlanSchema = z.object({
  label: planLabel.optional(),
  durationDays: planDays.optional(),
  priceInPaise: planPricePaise.optional(),
  gstApplies: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  active: z.boolean().optional(),
}).strict();
