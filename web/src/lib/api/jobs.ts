/**
 * Phase 3 — jobs / applications / saved-jobs API client.
 *
 * Backend enums are UPPERCASE; we keep mapping helpers near the call sites
 * that need them (see the jobs store) rather than scattering toUpperCase /
 * toLowerCase across every function here.
 */

import { api } from "../api";

export type ApiJobField = "IT" | "NON_IT";
export type ApiJobType = "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT";
export type ApiJobExperience = "FRESHER" | "EXPERIENCED" | "ANY";
export type ApiJobStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
export type ApiApplicationStatus = "APPLIED" | "VIEWED" | "SHORTLISTED" | "INTERVIEW" | "REJECTED" | "HIRED" | "WITHDRAWN";

export interface ApiJob {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  location: string;
  districtId: string | null;
  talukId: string | null;
  lat: number | null;
  lng: number | null;
  pincode: string | null;
  field: ApiJobField;
  type: ApiJobType;
  experience: ApiJobExperience;
  yearsMin: number | null;
  yearsMax: number | null;
  salaryRange: string | null;
  skills: string[];
  status: ApiJobStatus;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  postedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiApplication {
  id: string;
  jobId: string;
  candidateId: string;
  profileId: string | null;
  status: ApiApplicationStatus;
  matchScore: number | null;
  coverNote: string | null;
  appliedAt: string;
  updatedAt: string;
  job?: ApiJob;
}

export interface ApiSavedJob {
  id: string;
  candidateId: string;
  jobId: string;
  savedAt: string;
  job: ApiJob;
}

export interface CreateJobInput {
  title: string;
  description: string;
  location: string;
  districtId?: string;
  talukId?: string;
  lat?: number;
  lng?: number;
  pincode?: string;
  field: ApiJobField;
  type: ApiJobType;
  experience: ApiJobExperience;
  yearsMin?: number;
  yearsMax?: number;
  salaryRange?: string;
  skills: string[];
}

interface ListResponse<T> { items: T[]; total: number; page: number; pageSize: number }

interface BrowseQuery {
  field?: ApiJobField;
  type?: ApiJobType;
  experience?: ApiJobExperience;
  districtId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function qs(args: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const jobsApi = {
  /** Public list — anyone can hit this; auth is optional. */
  list: (args: BrowseQuery = {}) =>
    api<ListResponse<ApiJob>>(`/jobs${qs(args)}`),

  byId: (id: string) =>
    api<{ job: ApiJob }>(`/jobs/${encodeURIComponent(id)}`),

  apply: (id: string, input: { matchScore?: number; coverNote?: string } = {}) =>
    api<{ application: ApiApplication }>(`/jobs/${encodeURIComponent(id)}/apply`, {
      method: "POST",
      json: input,
    }),

  myApplications: () =>
    api<{ items: ApiApplication[] }>("/candidate/applications"),

  mySavedJobs: () =>
    api<{ items: ApiSavedJob[] }>("/candidate/saved-jobs"),

  save: (jobId: string) =>
    api<{ saved: ApiSavedJob }>(`/candidate/saved-jobs/${encodeURIComponent(jobId)}`, { method: "POST" }),

  unsave: (jobId: string) =>
    api<{ ok: true }>(`/candidate/saved-jobs/${encodeURIComponent(jobId)}`, { method: "DELETE" }),
};

/* ----------------------- Employer candidate search ----------------------- */

export type ApiCandidateType = "FRESHER" | "EXPERIENCED";
export type ApiFieldKind = "IT" | "NON_IT";

export interface EmployerCandidateRow {
  id: string;
  userId: string;
  photoUrl: string | null;
  field: ApiFieldKind | null;
  type: ApiCandidateType | null;
  itSpecialization: string | null;
  itLanguages: string[] | null;
  nonItDepartments: string[] | null;
  topSkills: string[] | null;
  yearsOfExperience: number | null;
  preferredLocation: string | null;
  preferredLat: number | null;
  preferredLng: number | null;
  currentLat: number | null;
  currentLng: number | null;
  selectedTemplateId: string | null;
  moderationStatus: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string;
  user: { id: string; name: string; email: string; mobile: string | null; createdAt: string };
}

interface CandidateSearchQuery {
  field?: ApiFieldKind;
  type?: ApiCandidateType;
  districtId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const employerCandidatesApi = {
  search: (args: CandidateSearchQuery = {}) =>
    api<ListResponse<EmployerCandidateRow>>(`/employer/candidates${qs(args)}`),
};

export const employerJobsApi = {
  list: () => api<{ items: (ApiJob & { _count: { applications: number; savedBy: number } })[] }>("/employer/jobs"),

  create: (input: CreateJobInput) =>
    api<{ job: ApiJob }>("/employer/jobs", { method: "POST", json: input }),

  update: (id: string, patch: Partial<CreateJobInput> & { status?: ApiJobStatus }) =>
    api<{ job: ApiJob }>(`/employer/jobs/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }),

  remove: (id: string) =>
    api<{ ok: true }>(`/employer/jobs/${encodeURIComponent(id)}`, { method: "DELETE" }),

  applicants: (id: string) =>
    api<{
      items: (ApiApplication & {
        candidate: { id: string; name: string; email: string; mobile: string | null; createdAt: string };
        // The backend joins the candidate's full profile too — we type as
        // unknown here so the page can call fromApiProfile() to normalise it.
        profile: unknown | null;
      })[];
    }>(`/employer/jobs/${encodeURIComponent(id)}/applicants`),

  updateApplicationStatus: (applicationId: string, status: ApiApplicationStatus) =>
    api<{ application: ApiApplication }>(`/employer/applications/${encodeURIComponent(applicationId)}`, {
      method: "PATCH",
      json: { status },
    }),
};
