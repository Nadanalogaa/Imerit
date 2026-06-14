import { z } from "zod";
import { ApplicationStatus, JobExperience, JobField, JobType } from "@prisma/client";

const skills = z.array(z.string().min(1).max(80)).max(30);
const description = z.string().trim().min(20).max(8000);
const title = z.string().trim().min(3).max(200);
const location = z.string().trim().min(2).max(200);

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
  field: z.nativeEnum(JobField),
  type: z.nativeEnum(JobType),
  experience: z.nativeEnum(JobExperience),
  yearsMin: z.number().int().min(0).max(60).optional(),
  yearsMax: z.number().int().min(0).max(60).optional(),
  salaryRange: z.string().max(120).optional(),
  skills,
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED", "DRAFT"]).optional(),
});

export const applyJobSchema = z.object({
  matchScore: z.number().int().min(0).max(100).optional(),
  coverNote: z.string().max(2000).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});
