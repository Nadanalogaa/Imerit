import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";
import { apiEnabled } from "../lib/api";
import {
  profileApi,
  type ApiCandidateProfile,
  type ApiEducation,
  type ApiEducationLevel,
  type ApiExperience,
  type ApiProfilePatch,
} from "../lib/api/profile";

export type CandidateType = "fresher" | "experienced";
export type Field = "it" | "non_it";
export type EducationLevel =
  | "10th"
  | "12th"
  | "diploma"
  | "ug"
  | "pg"
  | "mphil"
  | "phd"
  | "other";

export interface Education {
  level: EducationLevel;
  enabled: boolean;
  percentage?: number;
  passedOutYear?: number;
  thesis?: string; // phd
  courseName?: string; // other
  institution?: string;
  districtId?: string;
  pincode?: string;
}

export interface ExperienceProject {
  name: string;
  description?: string;
  skills?: string[];
  showcaseUrl?: string;
}

export interface Experience {
  company: string;
  role: string;
  fromDate: string; // YYYY-MM
  toDate: string | null; // null = present
  projects?: ExperienceProject[];
}

/** Showcase link on the candidate profile — LinkedIn / Portfolio / GitHub / etc. */
export interface ProfileLink {
  label: string;
  url: string;
}

export type TemplateId = "classic" | "modern" | "creative" | "corporate" | "tech_mono";

export interface CandidateProfile {
  userId: string;

  // personal
  photoDataUrl?: string;
  alternateMobile?: string;
  /** Legacy free-text label; kept for backward compat. */
  preferredLocation?: string;

  // Structured CURRENT location (where they live)
  currentDistrictId?: string;
  currentTalukId?: string;
  currentLat?: number;
  currentLng?: number;
  currentPincode?: string;
  currentStreet?: string; // private — never shown publicly

  /** Preferred work — multi-select list of district IDs. */
  preferredDistricts?: string[];
  // Legacy single-anchor preferred coords — mirrored from the first
  // preferredDistricts entry for the "Near preferred" matcher anchor.
  preferredDistrictId?: string;
  preferredTalukId?: string;
  preferredLat?: number;
  preferredLng?: number;
  preferredPincode?: string;

  // ambition
  shortTermAmbition?: string;
  longTermAmbition?: string;

  // type branch
  type?: CandidateType;

  // fresher
  internOrJob?: "intern" | "job";
  field?: Field;
  itSpecialization?: string;
  itLanguages?: string[];
  nonItDepartments?: string[];

  // experienced
  yearsOfExperience?: number;
  topSkills?: string[];
  experiences?: Experience[];
  /** Optional showcase links — LinkedIn / Portfolio / GitHub / etc. */
  links?: ProfileLink[];

  // education
  education: Education[];

  // template
  selectedTemplateId?: TemplateId;

  // meta
  updatedAt: string;
}

interface ProfileState {
  byUser: Record<string, CandidateProfile>;
  get: (userId: string) => CandidateProfile;
  patch: (userId: string, patch: Partial<CandidateProfile>) => void;
  setEducation: (userId: string, edu: Education[]) => void;

  /** Pull the canonical profile from the API into local state. No-op if API is off. */
  fetchMine: () => Promise<CandidateProfile | null>;
}

const STORAGE_KEY = KEYS.candidateProfiles;

const emptyProfile = (userId: string): CandidateProfile => ({
  userId,
  education: [],
  updatedAt: new Date().toISOString(),
});

/* --------------------- enum + shape conversions --------------------- */

const LEVEL_TO_API: Record<EducationLevel, ApiEducationLevel> = {
  "10th": "TENTH",
  "12th": "TWELFTH",
  diploma: "DIPLOMA",
  ug: "UG",
  pg: "PG",
  mphil: "MPHIL",
  phd: "PHD",
  other: "OTHER",
};
const LEVEL_FROM_API: Record<ApiEducationLevel, EducationLevel> = {
  TENTH: "10th",
  TWELFTH: "12th",
  DIPLOMA: "diploma",
  UG: "ug",
  PG: "pg",
  MPHIL: "mphil",
  PHD: "phd",
  OTHER: "other",
};

function toApiProfilePatch(p: Partial<CandidateProfile>): ApiProfilePatch {
  const out: ApiProfilePatch = {};
  if ("photoDataUrl" in p) out.photoUrl = p.photoDataUrl ?? null;
  if ("alternateMobile" in p) out.alternateMobile = p.alternateMobile ?? null;
  if ("currentDistrictId" in p) out.currentDistrictId = p.currentDistrictId ?? null;
  if ("currentTalukId" in p) out.currentTalukId = p.currentTalukId ?? null;
  if ("currentLat" in p) out.currentLat = p.currentLat ?? null;
  if ("currentLng" in p) out.currentLng = p.currentLng ?? null;
  if ("currentPincode" in p) out.currentPincode = p.currentPincode ?? null;
  if ("currentStreet" in p) out.currentStreet = p.currentStreet ?? null;
  if ("preferredDistricts" in p) out.preferredDistricts = p.preferredDistricts ?? null;
  if ("preferredDistrictId" in p) out.preferredDistrictId = p.preferredDistrictId ?? null;
  if ("preferredTalukId" in p) out.preferredTalukId = p.preferredTalukId ?? null;
  if ("preferredLat" in p) out.preferredLat = p.preferredLat ?? null;
  if ("preferredLng" in p) out.preferredLng = p.preferredLng ?? null;
  if ("preferredPincode" in p) out.preferredPincode = p.preferredPincode ?? null;
  if ("preferredLocation" in p) out.preferredLocation = p.preferredLocation ?? null;
  if ("shortTermAmbition" in p) out.shortTermAmbition = p.shortTermAmbition ?? null;
  if ("longTermAmbition" in p) out.longTermAmbition = p.longTermAmbition ?? null;
  if ("type" in p) out.type = p.type ? (p.type.toUpperCase() as ApiProfilePatch["type"]) : null;
  if ("internOrJob" in p) out.internOrJob = p.internOrJob ? (p.internOrJob.toUpperCase() as ApiProfilePatch["internOrJob"]) : null;
  if ("field" in p) out.field = p.field ? (p.field.toUpperCase() as ApiProfilePatch["field"]) : null;
  if ("itSpecialization" in p) out.itSpecialization = p.itSpecialization ?? null;
  if ("itLanguages" in p) out.itLanguages = p.itLanguages ?? null;
  if ("nonItDepartments" in p) out.nonItDepartments = p.nonItDepartments ?? null;
  if ("yearsOfExperience" in p) out.yearsOfExperience = p.yearsOfExperience ?? null;
  if ("topSkills" in p) out.topSkills = p.topSkills ?? null;
  if ("links" in p) out.links = p.links ?? null;
  if ("selectedTemplateId" in p) {
    out.selectedTemplateId = p.selectedTemplateId
      ? (p.selectedTemplateId.toUpperCase() as ApiProfilePatch["selectedTemplateId"])
      : null;
  }
  return out;
}

export function fromApiProfile(api: ApiCandidateProfile): CandidateProfile {
  return {
    userId: api.userId,
    photoDataUrl: api.photoUrl ?? undefined,
    alternateMobile: api.alternateMobile ?? undefined,
    preferredLocation: api.preferredLocation ?? undefined,
    currentDistrictId: api.currentDistrictId ?? undefined,
    currentTalukId: api.currentTalukId ?? undefined,
    currentLat: api.currentLat ?? undefined,
    currentLng: api.currentLng ?? undefined,
    currentPincode: api.currentPincode ?? undefined,
    currentStreet: api.currentStreet ?? undefined,
    preferredDistricts: api.preferredDistricts ?? undefined,
    preferredDistrictId: api.preferredDistrictId ?? undefined,
    preferredTalukId: api.preferredTalukId ?? undefined,
    preferredLat: api.preferredLat ?? undefined,
    preferredLng: api.preferredLng ?? undefined,
    preferredPincode: api.preferredPincode ?? undefined,
    shortTermAmbition: api.shortTermAmbition ?? undefined,
    longTermAmbition: api.longTermAmbition ?? undefined,
    type: api.type ? (api.type.toLowerCase() as CandidateType) : undefined,
    internOrJob: api.internOrJob ? (api.internOrJob.toLowerCase() as "intern" | "job") : undefined,
    field: api.field ? (api.field === "NON_IT" ? "non_it" : "it") : undefined,
    itSpecialization: api.itSpecialization ?? undefined,
    itLanguages: api.itLanguages ?? undefined,
    nonItDepartments: api.nonItDepartments ?? undefined,
    yearsOfExperience: api.yearsOfExperience ?? undefined,
    topSkills: api.topSkills ?? undefined,
    experiences: api.experiences.map((e) => ({
      company: e.company,
      role: e.role,
      fromDate: e.fromDate,
      toDate: e.toDate ?? null,
      projects: (e.projects ?? []).map((p) => ({
        name: p.name,
        description: p.description ?? undefined,
        skills: p.skills ?? undefined,
        showcaseUrl: p.showcaseUrl ?? undefined,
      })),
    })),
    links: api.links ?? undefined,
    education: api.education.map((e) => ({
      level: LEVEL_FROM_API[e.level],
      enabled: e.enabled,
      percentage: e.percentage ?? undefined,
      passedOutYear: e.passedOutYear ?? undefined,
      thesis: e.thesis ?? undefined,
      courseName: e.courseName ?? undefined,
      institution: e.institution ?? undefined,
      districtId: e.districtId ?? undefined,
      pincode: e.pincode ?? undefined,
    })),
    selectedTemplateId: api.selectedTemplateId
      ? (api.selectedTemplateId.toLowerCase() as TemplateId)
      : undefined,
    updatedAt: api.updatedAt,
  };
}

function toApiEducation(rows: Education[]): ApiEducation[] {
  return rows.map((e) => ({
    level: LEVEL_TO_API[e.level],
    enabled: e.enabled,
    percentage: e.percentage ?? null,
    passedOutYear: e.passedOutYear ?? null,
    thesis: e.thesis ?? null,
    courseName: e.courseName ?? null,
    institution: e.institution ?? null,
    districtId: e.districtId ?? null,
    pincode: e.pincode ?? null,
  }));
}

function toApiExperiences(rows: Experience[]): ApiExperience[] {
  return rows.map((e) => ({
    company: e.company,
    role: e.role,
    fromDate: e.fromDate,
    toDate: e.toDate ?? null,
  }));
}

/* ----------------------------- store ----------------------------- */

export const useProfile = create<ProfileState>((set) => ({
  byUser: load<Record<string, CandidateProfile>>(STORAGE_KEY, {}),

  get: (userId) => {
    const all = load<Record<string, CandidateProfile>>(STORAGE_KEY, {});
    return all[userId] ?? emptyProfile(userId);
  },

  /**
   * Optimistic update: local state is set synchronously so the multi-step
   * builder feels snappy. When the API is configured, we mirror the patch
   * to the backend in the background; education + experiences are bulk
   * arrays so we PUT them on their own endpoints.
   */
  patch: (userId, patch) =>
    set((s) => {
      const current = s.byUser[userId] ?? emptyProfile(userId);
      const next: CandidateProfile = {
        ...current,
        ...patch,
        userId,
        updatedAt: new Date().toISOString(),
      };
      const byUser = { ...s.byUser, [userId]: next };
      save(STORAGE_KEY, byUser);

      if (apiEnabled) {
        // Strip experiences out of the scalar patch — they have their own
        // bulk endpoint. Education is the same story but isn't sent via
        // patch() in the current form code; it goes through setEducation.
        const { experiences, education: _education, ...scalar } = patch;
        if (Object.keys(scalar).length > 0) {
          void profileApi.patch(toApiProfilePatch(scalar)).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn("[profile.patch] API mirror failed", err);
          });
        }
        if (experiences) {
          void profileApi.replaceExperiences(toApiExperiences(experiences)).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn("[profile.experiences] API mirror failed", err);
          });
        }
      }

      return { byUser };
    }),

  setEducation: (userId, edu) =>
    set((s) => {
      const current = s.byUser[userId] ?? emptyProfile(userId);
      const next: CandidateProfile = {
        ...current,
        education: edu,
        userId,
        updatedAt: new Date().toISOString(),
      };
      const byUser = { ...s.byUser, [userId]: next };
      save(STORAGE_KEY, byUser);

      if (apiEnabled) {
        void profileApi.replaceEducation(toApiEducation(edu)).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[profile.education] API mirror failed", err);
        });
      }

      return { byUser };
    }),

  fetchMine: async () => {
    if (!apiEnabled) return null;
    try {
      const { profile } = await profileApi.getMine();
      const local = fromApiProfile(profile);
      set((s) => {
        const byUser = { ...s.byUser, [local.userId]: local };
        save(STORAGE_KEY, byUser);
        return { byUser };
      });
      return local;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[profile.fetchMine] failed", err);
      return null;
    }
  },
}));

/** Convenience selector — current profile for the logged-in user. */
export function profileCompletion(p: CandidateProfile): number {
  let done = 0;
  const total = 5;
  if (p.photoDataUrl) done++;
  if (p.shortTermAmbition && p.longTermAmbition) done++;
  if (p.education.some((e) => e.enabled)) done++;
  if (p.type === "fresher" || p.type === "experienced") done++;
  if (p.selectedTemplateId) done++;
  return Math.round((done / total) * 100);
}
