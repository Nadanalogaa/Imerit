import { z } from "zod";
import { CandidateType, EducationLevel, FieldKind, InternOrJob, TemplateId } from "@prisma/client";

/**
 * Profile patch — every field optional. The frontend ships partial bodies
 * as the user moves through the multi-step builder; whatever's present
 * gets persisted, the rest stays untouched.
 *
 * Use Zod's `.optional().nullable()` for the clearable bits — the UI uses
 * `null` to mean "user removed this value" vs `undefined` for "don't touch".
 */
const stringArray = z.array(z.string().min(1).max(120)).max(50);

export const profilePatchSchema = z.object({
  photoUrl: z.string().max(8_000_000).nullable().optional(), // data: URLs can be ~5MB
  alternateMobile: z.string().regex(/^[6-9]\d{9}$/u).nullable().optional(),

  // Current address
  currentDistrictId: z.string().max(64).nullable().optional(),
  currentTalukId: z.string().max(80).nullable().optional(),
  currentLat: z.number().min(-90).max(90).nullable().optional(),
  currentLng: z.number().min(-180).max(180).nullable().optional(),
  currentPincode: z.string().regex(/^\d{6}$/u).nullable().optional(),
  currentStreet: z.string().max(255).nullable().optional(),

  // Preferred work location
  preferredDistrictId: z.string().max(64).nullable().optional(),
  preferredTalukId: z.string().max(80).nullable().optional(),
  preferredLat: z.number().min(-90).max(90).nullable().optional(),
  preferredLng: z.number().min(-180).max(180).nullable().optional(),
  preferredPincode: z.string().regex(/^\d{6}$/u).nullable().optional(),
  preferredLocation: z.string().max(200).nullable().optional(),

  // Ambitions
  shortTermAmbition: z.string().max(500).nullable().optional(),
  longTermAmbition: z.string().max(500).nullable().optional(),

  // Type branching
  type: z.nativeEnum(CandidateType).nullable().optional(),
  internOrJob: z.nativeEnum(InternOrJob).nullable().optional(),
  field: z.nativeEnum(FieldKind).nullable().optional(),

  // Fresher branch
  itSpecialization: z.string().max(100).nullable().optional(),
  itLanguages: stringArray.nullable().optional(),
  nonItDepartments: stringArray.nullable().optional(),

  // Experienced branch
  yearsOfExperience: z.number().int().min(0).max(60).nullable().optional(),
  topSkills: stringArray.nullable().optional(),

  // Template selection
  selectedTemplateId: z.nativeEnum(TemplateId).nullable().optional(),
}).strict();

export type ProfilePatch = z.infer<typeof profilePatchSchema>;

/** Single education row inside the bulk-replace payload. */
const educationRowSchema = z.object({
  level: z.nativeEnum(EducationLevel),
  enabled: z.boolean().default(true),
  percentage: z.number().min(0).max(100).nullable().optional(),
  passedOutYear: z.number().int().min(1950).max(2100).nullable().optional(),
  thesis: z.string().max(1000).nullable().optional(),
  courseName: z.string().max(120).nullable().optional(),
  institution: z.string().max(200).nullable().optional(),
}).strict();

export const educationReplaceSchema = z.object({
  education: z.array(educationRowSchema).max(10),
});
export type EducationReplace = z.infer<typeof educationReplaceSchema>;

const experienceRowSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  // Loose date format — the frontend ships YYYY-MM, we keep it loose to allow
  // partial year ("2018") too if the UI ever simplifies.
  fromDate: z.string().min(4).max(10),
  toDate: z.string().min(4).max(10).nullable().optional(),
}).strict();

export const experiencesReplaceSchema = z.object({
  experiences: z.array(experienceRowSchema).max(30),
});
export type ExperiencesReplace = z.infer<typeof experiencesReplaceSchema>;

/* ---------- Employer profile (logo + brand metadata for Post Job wizard) ---------- */

export const employerProfilePatchSchema = z.object({
  companyName: z.string().trim().min(2).max(160).optional(),
  // Base64 data URL, capped at ~250KB for logo upload (no object storage yet).
  // Wire this to a real CDN once prod volume warrants it.
  logoUrl: z.string().max(350_000).nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  website: z.string().url().max(255).nullable().optional(),
  about: z.string().max(8000).nullable().optional(),
});

