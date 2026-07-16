/**
 * Staff module API client. Two flavours:
 *   - superAdminStaffApi — super-admin only. Manages STAFF accounts.
 *   - staffApi           — staff only. Manages EMPLOYER accounts they
 *                          provisioned + posts jobs on behalf of them.
 *
 * Kept thin so the backend routes remain the source of truth for shape
 * and validation.
 */

import { api } from "../api";
import type { ApiJob } from "./jobs";

// ----------------------------------------------------------------
// Shared shapes — mirror the backend `staffSelect` / `employerSelect`.
// ----------------------------------------------------------------

export interface ApiStaff {
  id: string;
  role: "STAFF";
  name: string;
  email: string;
  mobile: string | null;
  sharedPassword: string | null;
  deactivated: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface ApiEmployerRowForStaff {
  id: string;
  role: "EMPLOYER";
  name: string;
  email: string;
  mobile: string | null;
  sharedPassword: string | null;
  deactivated: boolean;
  createdByStaffId: string | null;
  createdAt: string;
  /** Populated from the employer profile join server-side. */
  company: string | null;
  /** True when THIS staff user provisioned the employer. Used to filter
   *  or badge rows in the staff employer master UI. */
  provisionedByMe: boolean;
}

// ----------------------------------------------------------------
// Super-admin — staff CRUD
// ----------------------------------------------------------------

export const superAdminStaffApi = {
  list: () => api<{ items: ApiStaff[] }>("/super-admin/staff"),

  create: (input: { name: string; email: string; mobile?: string }) =>
    api<{ user: ApiStaff; password: string }>("/super-admin/staff", {
      method: "POST",
      json: input,
    }),

  /** Auto-generate a fresh random password. */
  resetPassword: (id: string) =>
    api<{ user: ApiStaff; password: string }>(`/super-admin/staff/${id}/reset-password`, {
      method: "PATCH",
    }),

  /** Set an explicit password (super-admin typed it in). */
  setPassword: (id: string, password: string) =>
    api<{ user: ApiStaff }>(`/super-admin/staff/${id}/set-password`, {
      method: "PATCH",
      json: { password },
    }),

  setDeactivated: (id: string, deactivated: boolean) =>
    api<{ user: ApiStaff }>(`/super-admin/staff/${id}/deactivate`, {
      method: "PATCH",
      json: { deactivated },
    }),
};

// ----------------------------------------------------------------
// Staff — employer master + job posting on behalf of
// ----------------------------------------------------------------

export const staffApi = {
  listEmployers: () => api<{ items: ApiEmployerRowForStaff[] }>("/staff/employers"),

  /** Jobs THIS staff user posted, across every employer. Same job shape
   *  as /employer/jobs so it flows through the existing fromApiJob(). */
  listJobs: () =>
    api<{ items: (ApiJob & { _count: { applications: number } })[] }>("/staff/jobs"),

  createEmployer: (input: { name: string; email: string; mobile?: string; company?: string }) =>
    api<{ user: ApiEmployerRowForStaff; password: string }>("/staff/employers", {
      method: "POST",
      json: input,
    }),

  updateEmployer: (id: string, patch: { name?: string; mobile?: string | null; company?: string | null }) =>
    api<{ user: ApiEmployerRowForStaff }>(`/staff/employers/${id}`, {
      method: "PATCH",
      json: patch,
    }),

  resetEmployerPassword: (id: string) =>
    api<{ user: ApiEmployerRowForStaff; password: string }>(`/staff/employers/${id}/reset-password`, {
      method: "PATCH",
    }),

  /**
   * Post a job on behalf of an employer. The employerId travels in the
   * body (NOT derived from the JWT — the JWT belongs to the staff user,
   * not the employer). Same job schema as /employer/jobs otherwise.
   */
  createJob: (input: {
    employerId: string;
    title: string;
    description: string;
    location: string;
    districtId?: string;
    talukId?: string;
    lat?: number;
    lng?: number;
    pincode?: string;
    street?: string;
    field: "IT" | "NON_IT";
    type:
      | "INTERNSHIP_TRAINING" | "APPRENTICE" | "FULL_TIME" | "PART_TIME"
      | "GIG_DELIVERY" | "CONTRACT" | "CONSULTANT" | "FREELANCER";
    experience: "FRESHER" | "EXPERIENCED" | "ANY";
    yearsMin?: number;
    yearsMax?: number;
    salaryRange?: string;
    skills: string[];
    benefits?: string[];
    contactEmail?: string;
  }) =>
    api<{ job: ApiJob }>("/staff/jobs", { method: "POST", json: input }),
};
