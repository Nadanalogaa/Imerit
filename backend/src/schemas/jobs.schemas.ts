import { z } from "zod";
import { ApplicationStatus, CandidateType, FieldKind, JobExperience, JobField, JobType } from "@prisma/client";

const skills = z.array(z.string().min(1).max(80)).max(30);
const description = z.string().trim().min(20).max(8000);
const title = z.string().trim().min(3).max(200);
const location = z.string().trim().min(2).max(200);

/**
 * Strict enum of supported employee benefits — checkbox grid on the Post-Job
 * wizard. Stored as Json (string[]) in Postgres for forward-compatibility;
 * validated here so the API never accepts unknown keys.
 */
export const JOB_BENEFITS = [
  "PF",
  "ESI",
  "HEALTH_INSURANCE",
  "WFH",
  "HYBRID",
  "MEALS",
  "TRANSPORT",
  "PAID_LEAVE",
  "LEARNING_BUDGET",
  "PERFORMANCE_BONUS",
  "STOCK_OPTIONS",
  "GYM_WELLNESS",
] as const;
export type JobBenefit = (typeof JOB_BENEFITS)[number];
const benefits = z.array(z.enum(JOB_BENEFITS)).max(JOB_BENEFITS.length);
const contactEmail = z.string().trim().email().max(254);

/** Browse list query — every filter optional, pagination clamped. */
export const browseJobsSchema = z.object({
  field: z.nativeEnum(JobField).optional(),
  type: z.nativeEnum(JobType).optional(),
  experience: z.nativeEnum(JobExperience).optional(),
  districtId: z.string().max(80).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createJobSchema = z.object({
  title,
  description,
  location,
  districtId: z.string().max(80).optional(),
  talukId: z.string().max(80).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  pincode: z.string().regex(/^\d{6}$/u).optional(),
  street: z.string().max(255).optional(),
  field: z.nativeEnum(JobField),
  type: z.nativeEnum(JobType),
  experience: z.nativeEnum(JobExperience),
  yearsMin: z.number().int().min(0).max(60).optional(),
  yearsMax: z.number().int().min(0).max(60).optional(),
  salaryRange: z.string().max(120).optional(),
  skills,
  benefits: benefits.default([]),
  contactEmail: contactEmail.optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "DRAFT"]).optional(),
});

/**
 * Staff variant — same job fields PLUS a required `employerId` (the
 * employer they're posting on behalf of). Employer endpoints derive
 * that id from the JWT sub, which doesn't work for staff since the JWT
 * belongs to the staff user, not the target employer.
 */
export const staffCreateJobSchema = createJobSchema.extend({
  employerId: z.string().min(1, "employerId is required"),
});

export const applyJobSchema = z.object({
  matchScore: z.number().int().min(0).max(100).optional(),
  coverNote: z.string().max(2000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export const employerCandidateSearchSchema = z.object({
  field: z.nativeEnum(FieldKind).optional(),
  type: z.nativeEnum(CandidateType).optional(),
  districtId: z.string().max(80).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
