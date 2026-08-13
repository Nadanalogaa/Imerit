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
  industry: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** Single extra location row. The primary is still the top-level
 *  districtId/lat/lng/pincode/street/location fields on the job body. */
const jobExtraLocation = z.object({
  districtId: z.string().max(80).optional(),
  talukId: z.string().max(80).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  pincode: z.string().regex(/^\d{6}$/u).optional(),
  street: z.string().max(255).optional(),
  label: z.string().trim().min(1).max(200),
}).strict();

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
  /** Extra locations beyond the primary. Empty / omitted = single-location job. */
  extraLocations: z.array(jobExtraLocation).max(15).optional(),
  field: z.nativeEnum(JobField),
  type: z.nativeEnum(JobType),
  experience: z.nativeEnum(JobExperience),
  yearsMin: z.number().int().min(0).max(60).optional(),
  yearsMax: z.number().int().min(0).max(60).optional(),
  salaryRange: z.string().max(120).optional(),
  skills,
  benefits: benefits.default([]),
  contactEmail: contactEmail.optional(),
  // Hiring-contact phone shown to matched candidates. Not required at the
  // schema level so older clients keep posting; the web+mobile wizard
  // both enforce it as required at input time.
  contactMobile: z.string().trim().min(4).max(20).optional(),
  // Curated industry list on the client, but we accept any short string
  // here — future free-tag support without a schema change.
  industry: z.string().trim().max(120).optional(),
  // Naukri-style department, paired with industry in the wizard. Also
  // free-text server-side; the UI enforces the pick-list.
  department: z.string().trim().max(120).optional(),
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
  industry: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
