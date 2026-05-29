import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";

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
}

export interface Experience {
  company: string;
  role: string;
  fromDate: string; // YYYY-MM
  toDate: string | null; // null = present
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

  // Structured PREFERRED work location (optional)
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
}

const STORAGE_KEY = KEYS.candidateProfiles;

const emptyProfile = (userId: string): CandidateProfile => ({
  userId,
  education: [],
  updatedAt: new Date().toISOString(),
});

export const useProfile = create<ProfileState>((set) => ({
  byUser: load<Record<string, CandidateProfile>>(STORAGE_KEY, {}),

  get: (userId) => {
    const all = load<Record<string, CandidateProfile>>(STORAGE_KEY, {});
    return all[userId] ?? emptyProfile(userId);
  },

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
      return { byUser };
    }),
}));

/** Convenience selector — current profile for the logged-in user. */
export function profileCompletion(p: CandidateProfile): number {
  let done = 0;
  let total = 5;
  if (p.photoDataUrl) done++;
  if (p.shortTermAmbition && p.longTermAmbition) done++;
  if (p.education.some((e) => e.enabled)) done++;
  if (p.type === "fresher" || p.type === "experienced") done++;
  if (p.selectedTemplateId) done++;
  return Math.round((done / total) * 100);
}
