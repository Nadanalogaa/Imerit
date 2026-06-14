import { z } from "zod";
import { ModerationStatus, UserRole } from "@prisma/client";

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
