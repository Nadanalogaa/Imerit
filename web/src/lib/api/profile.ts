/**
 * Typed wrappers around the Phase 2 profile endpoints. The shape mirrors
 * what the Express backend emits, including the UPPERCASE enums that need to
 * be mapped to/from the lowercase frontend types — see `mapApiProfileIn` /
 * `mapApiProfileOut` in the store for the actual conversions.
 */

import { api } from "../api";

export type ApiCandidateType = "FRESHER" | "EXPERIENCED";
export type ApiFieldKind = "IT" | "NON_IT";
export type ApiInternOrJob = "INTERN" | "JOB";
export type ApiTemplateId = "CLASSIC" | "MODERN" | "CREATIVE" | "CORPORATE" | "TECH_MONO";
export type ApiEducationLevel = "TENTH" | "TWELFTH" | "DIPLOMA" | "UG" | "PG" | "MPHIL" | "PHD" | "OTHER";
export type ApiModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiEducation {
  id?: string;
  profileId?: string;
  level: ApiEducationLevel;
  enabled: boolean;
  percentage?: number | null;
  passedOutYear?: number | null;
  thesis?: string | null;
  courseName?: string | null;
  institution?: string | null;
  districtId?: string | null;
  pincode?: string | null;
  createdAt?: string;
}

export interface ApiExperienceProject {
  id?: string;
  experienceId?: string;
  name: string;
  description?: string | null;
  skills?: string[];
  showcaseUrl?: string | null;
  createdAt?: string;
}

export interface ApiExperience {
  id?: string;
  profileId?: string;
  company: string;
  role: string;
  fromDate: string;
  toDate?: string | null;
  projects?: ApiExperienceProject[];
  createdAt?: string;
}

export interface ApiProfileLink {
  label: string;
  url: string;
}

export interface ApiCandidateProfile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;

  photoUrl: string | null;
  alternateMobile: string | null;

  currentDistrictId: string | null;
  currentTalukId: string | null;
  currentLat: number | null;
  currentLng: number | null;
  currentPincode: string | null;
  currentStreet?: string | null;

  preferredDistricts?: string[] | null;
  preferredDistrictId: string | null;
  preferredTalukId: string | null;
  preferredLat: number | null;
  preferredLng: number | null;
  preferredPincode: string | null;
  preferredLocation: string | null;

  shortTermAmbition: string | null;
  longTermAmbition: string | null;

  type: ApiCandidateType | null;
  internOrJob: ApiInternOrJob | null;
  field: ApiFieldKind | null;
  itSpecialization: string | null;
  itLanguages: string[] | null;
  nonItDepartments: string[] | null;
  yearsOfExperience: number | null;
  topSkills: string[] | null;
  links?: ApiProfileLink[] | null;

  selectedTemplateId: ApiTemplateId | null;

  moderationStatus: ApiModerationStatus;
  moderationNotes: string | null;
  moderatedAt: string | null;
  moderatedById: string | null;

  education: ApiEducation[];
  experiences: ApiExperience[];
}

/** Profile patch shape — any subset of the writable fields. */
export type ApiProfilePatch = Partial<
  Pick<
    ApiCandidateProfile,
    | "photoUrl"
    | "alternateMobile"
    | "currentDistrictId"
    | "currentTalukId"
    | "currentLat"
    | "currentLng"
    | "currentPincode"
    | "currentStreet"
    | "preferredDistricts"
    | "preferredDistrictId"
    | "preferredTalukId"
    | "preferredLat"
    | "preferredLng"
    | "preferredPincode"
    | "preferredLocation"
    | "shortTermAmbition"
    | "longTermAmbition"
    | "type"
    | "internOrJob"
    | "field"
    | "itSpecialization"
    | "itLanguages"
    | "nonItDepartments"
    | "yearsOfExperience"
    | "topSkills"
    | "links"
    | "selectedTemplateId"
  >
>;

export const profileApi = {
  getMine: () =>
    api<{ profile: ApiCandidateProfile }>("/candidate/profile"),

  patch: (input: ApiProfilePatch) =>
    api<{ profile: ApiCandidateProfile }>("/candidate/profile", {
      method: "PATCH",
      json: input,
    }),

  replaceEducation: (education: ApiEducation[]) =>
    api<{ education: ApiEducation[] }>("/candidate/profile/education", {
      method: "PUT",
      json: { education },
    }),

  replaceExperiences: (experiences: ApiExperience[]) =>
    api<{ experiences: ApiExperience[] }>("/candidate/profile/experiences", {
      method: "PUT",
      json: { experiences },
    }),

  getByUserId: (userId: string) =>
    api<{ profile: ApiCandidateProfileWithUser }>(`/profiles/${encodeURIComponent(userId)}`),
};

/** Server returns the joined user record alongside the profile on /profiles/:id. */
export interface ApiCandidateProfileWithUser extends ApiCandidateProfile {
  user: {
    id: string;
    name: string;
    email: string;
    mobile: string | null;
    role: "CANDIDATE" | "EMPLOYER" | "ADMIN" | "SUPER_ADMIN";
    createdAt: string;
    lastSeenAt: string | null;
  };
}

/* ---------- Employer profile (logo + brand metadata) ---------- */

export interface ApiEmployerProfile {
  id: string;
  userId: string;
  companyName: string;
  companySize: "SME" | "LARGE";
  industry: string | null;
  website: string | null;
  about: string | null;
  logoUrl: string | null;
  districtId: string | null;
  talukId: string | null;
  lat: number | null;
  lng: number | null;
  pincode: string | null;
  moderationStatus: ApiModerationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfilePatch {
  companyName?: string;
  /** Base64 data URL (max ~250KB) until object storage is wired. */
  logoUrl?: string | null;
  industry?: string | null;
  website?: string | null;
  about?: string | null;
}

export const employerProfileApi = {
  getMine: () => api<{ profile: ApiEmployerProfile }>("/employer/profile"),
  patch: (input: EmployerProfilePatch) =>
    api<{ profile: ApiEmployerProfile }>("/employer/profile", { method: "PATCH", json: input }),
};
