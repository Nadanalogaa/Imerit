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

export const adminApi = {
  stats: () => api<AdminStats>("/admin/stats"),

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
