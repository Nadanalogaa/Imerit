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

  // Preferred work location — multi-select of district IDs. The legacy
  // single-anchor fields below are still accepted for backward compat but
  // the new UI writes preferredDistricts only.
  preferredDistricts: z.array(z.string().max(64)).max(20).nullable().optional(),
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

  // Naukri-style industry + department taxonomy — shared by both
  // fresher + experienced branches. Free-text at the schema layer so
  // the UI's option list can evolve without a migration.
  industry: z.string().trim().max(120).nullable().optional(),
  department: z.string().trim().max(120).nullable().optional(),

  // Uploaded CV. Base64 data URL, capped at 5 MB (same ballpark as
  // employer logo, higher to fit a rich-formatted PDF). Client-side
  // MIME check restricts to PDF/DOC/DOCX; server-side we only bound
  // the byte count so a stricter check can land later without a
  // schema change.
  cvUrl: z.string().max(7_500_000).nullable().optional(),
  cvFileName: z.string().trim().max(255).nullable().optional(),

  // Showcase links — optional, max 10 entries of { label, url }.
  links: z.array(z.object({
    label: z.string().trim().min(1).max(40),
    url: z.string().trim().url().max(500),
  })).max(10).nullable().optional(),

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
  degreeName: z.string().trim().max(160).nullable().optional(),
  specialization: z.string().trim().max(160).nullable().optional(),
  institution: z.string().max(200).nullable().optional(),
  districtId: z.string().max(64).nullable().optional(),
  pincode: z.string().regex(/^\d{6}$/u).nullable().optional(),
}).strict();

export const educationReplaceSchema = z.object({
  education: z.array(educationRowSchema).max(10),
});
export type EducationReplace = z.infer<typeof educationReplaceSchema>;

const experienceProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  showcaseUrl: z.string().trim().url().max(500).nullable().optional(),
}).strict();

const experienceRowSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  // Loose date format — the frontend ships YYYY-MM, we keep it loose to allow
  // partial year ("2018") too if the UI ever simplifies.
  fromDate: z.string().min(4).max(10),
  toDate: z.string().min(4).max(10).nullable().optional(),
  projects: z.array(experienceProjectSchema).max(15).default([]),
}).strict();

export const experiencesReplaceSchema = z.object({
  experiences: z.array(experienceRowSchema).max(30),
});
export type ExperiencesReplace = z.infer<typeof experiencesReplaceSchema>;

/* ---------- Candidate personal projects (fresher + experienced) ---------- */

const candidateProjectRowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  role: z.string().trim().max(120).nullable().optional(),
  showcaseUrl: z.string().trim().url().max(500).nullable().optional(),
  startedAt: z.string().trim().max(10).nullable().optional(),
  endedAt: z.string().trim().max(10).nullable().optional(),
}).strict();

export const candidateProjectsReplaceSchema = z.object({
  projects: z.array(candidateProjectRowSchema).max(20),
});
export type CandidateProjectsReplace = z.infer<typeof candidateProjectsReplaceSchema>;

/* ---------- Certifications ---------- */

const certificationRowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  issuer: z.string().trim().max(200).nullable().optional(),
  issuedYear: z.number().int().min(1950).max(2100).nullable().optional(),
  expiryYear: z.number().int().min(1950).max(2100).nullable().optional(),
  credentialId: z.string().trim().max(160).nullable().optional(),
  credentialUrl: z.string().trim().url().max(500).nullable().optional(),
}).strict();

export const certificationsReplaceSchema = z.object({
  certifications: z.array(certificationRowSchema).max(30),
});
export type CertificationsReplace = z.infer<typeof certificationsReplaceSchema>;

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

