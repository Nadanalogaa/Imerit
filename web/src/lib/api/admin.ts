/**
 * Typed wrappers around the Phase 6 admin endpoints. All require an ADMIN or
 * SUPER_ADMIN session cookie — the API enforces that, so call sites just have
 * to handle the 403 case gracefully.
 */

import { api } from "../api";
import type { ApiCandidateProfile } from "./profile";

export type ApiUserRole = "CANDIDATE" | "EMPLOYER" | "ADMIN" | "SUPER_ADMIN";
export type ApiModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminStats {
  users: { total: number; candidates: number; employers: number; admins: number };
  profiles: { pending: number; approved: number; rejected: number; total: number };
  jobs: { active: number };
  signupsLast7d: number;
}

export interface AdminActivityItem {
  id: string;
  actorId: string | null;
  actor: { id: string; name: string; email: string; role: ApiUserRole } | null;
  actorRole: ApiUserRole | null;
  action: string; // backend AuditAction enum, kept loose so new actions don't break the UI
  targetType: string | null;
  targetId: string | null;
  payload: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminUserListItem {
  id: string;
  role: ApiUserRole;
  name: string;
  email: string;
  mobile: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  candidateProfile?: { moderationStatus: ApiModerationStatus; selectedTemplateId: string | null } | null;
  employerProfile?: { companyName: string; moderationStatus: ApiModerationStatus } | null;
}

export interface AdminProfileListItem extends ApiCandidateProfile {
  user: { id: string; name: string; email: string; mobile: string | null; createdAt: string; lastSeenAt: string | null };
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface ListUsersQuery {
  role?: ApiUserRole;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface ListProfilesQuery {
  status?: ApiModerationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function qs(args: object): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export interface AdminAccount {
  id: string;
  role: "ADMIN" | "SUPER_ADMIN";
  name: string;
  email: string;
  mobile: string | null;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface AdminTrends {
  days: string[]; // 7 ISO dates
  candidateSignups: number[];
  employerSignups: number[];
  jobsPosted: number[];
  applications: number[];
}

export const adminApi = {
  stats: () => api<AdminStats>("/admin/stats"),

  trends: () => api<AdminTrends>("/admin/trends"),

  activity: (limit = 50) =>
    api<{ items: AdminActivityItem[] }>(`/admin/activity${qs({ limit })}`),

  listUsers: (args: ListUsersQuery = {}) =>
    api<ListResponse<AdminUserListItem>>(`/admin/users${qs(args)}`),

  listProfiles: (args: ListProfilesQuery = {}) =>
    api<ListResponse<AdminProfileListItem>>(`/admin/profiles${qs(args)}`),

  moderateProfile: (userId: string, input: { status: "APPROVED" | "REJECTED"; notes?: string }) =>
    api<{ profile: ApiCandidateProfile }>(`/admin/profiles/${encodeURIComponent(userId)}/moderate`, {
      method: "PATCH",
      json: input,
    }),

  /**
   * Admin/super-admin patch of an employer's identity — currently used to
   * correct the company name from the SUPER_ADMIN "Employers" table.
   * Backend accepts any subset of {name, mobile, company}; send only what
   * you want to change. Pass `mobile: null` / `company: null` to clear.
   */
  updateEmployer: (
    employerId: string,
    patch: { name?: string; mobile?: string | null; company?: string | null },
  ) =>
    api<{ user: AdminUserListItem }>(`/admin/employers/${encodeURIComponent(employerId)}`, {
      method: "PATCH",
      json: patch,
    }),
};

/** Super-admin only — manage other admins. */
export const superAdminApi = {
  listAdmins: () => api<{ items: AdminAccount[] }>("/super-admin/admins"),

  createAdmin: (input: { email: string; name: string; role: "ADMIN" | "SUPER_ADMIN" }) =>
    api<{ user: AdminAccount }>("/super-admin/admins", { method: "POST", json: input }),

  deleteAdmin: (id: string) =>
    api<{ user: { id: string; role: string; email: string; deletedAt: string | null } }>(
      `/super-admin/admins/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
};

/* --------------------- Super-admin trash (recycle bin) --------------------- */

export interface TrashUser {
  id: string;
  role: ApiUserRole | "STAFF";
  name: string;
  email: string;
  mobile: string | null;
  emailVerified: boolean;
  createdAt: string;
  deletedAt: string;
  employerProfile?: { companyName: string } | null;
  candidateProfile?: { moderationStatus: ApiModerationStatus } | null;
}

export interface BulkResult {
  total: number;
  succeeded: number;
  failed: number;
  results: { id: string; ok: boolean; error?: string }[];
}

export const trashApi = {
  list: (role?: ApiUserRole | "STAFF") =>
    api<{ items: TrashUser[] }>(`/super-admin/trash${qs({ role })}`),

  softDelete: (id: string) =>
    api<{ user: { id: string; role: string; email: string; deletedAt: string | null; name: string } }>(
      `/super-admin/users/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),

  bulkDelete: (ids: string[]) =>
    api<BulkResult>("/super-admin/users/bulk-delete", { method: "POST", json: { ids } }),

  restore: (id: string) =>
    api<{ user: { id: string; role: string; email: string; deletedAt: string | null } }>(
      `/super-admin/users/${encodeURIComponent(id)}/restore`,
      { method: "POST" },
    ),

  bulkRestore: (ids: string[]) =>
    api<BulkResult>("/super-admin/users/bulk-restore", { method: "POST", json: { ids } }),

  purge: (id: string) =>
    api<{ user: { id: string; email: string; role: string } }>(
      `/super-admin/users/${encodeURIComponent(id)}/permanent`,
      { method: "DELETE" },
    ),

  bulkPurge: (ids: string[]) =>
    api<BulkResult>("/super-admin/users/bulk-purge", { method: "POST", json: { ids } }),

  emptyTrash: () =>
    api<BulkResult>("/super-admin/trash/empty", { method: "POST" }),
};
