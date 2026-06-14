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
  createdAt?: string;
}

export interface ApiExperience {
  id?: string;
  profileId?: string;
  company: string;
  role: string;
  fromDate: string;
  toDate?: string | null;
  createdAt?: string;
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
    api<{ profile: ApiCandidateProfile }>(`/profiles/${encodeURIComponent(userId)}`),
};
