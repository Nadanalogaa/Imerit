/**
 * Subscription plan API — the only endpoint that's public (GET /plans);
 * everything else is super-admin only.
 *
 * Prices live in PAISE on the wire; convert in/out at the form boundary.
 */

import { api } from "../api";

export type ApiPlanAudience = "CANDIDATE" | "EMPLOYER_SME" | "EMPLOYER_LARGE";

export interface ApiPlan {
  id: string;
  key: string;
  label: string;
  audience: ApiPlanAudience;
  durationDays: number;
  priceInPaise: number;
  gstApplies: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanInput {
  key: string;
  label: string;
  audience: ApiPlanAudience;
  durationDays: number;
  priceInPaise: number;
  gstApplies: boolean;
  sortOrder?: number;
}

export type UpdatePlanInput = Partial<{
  label: string;
  durationDays: number;
  priceInPaise: number;
  gstApplies: boolean;
  sortOrder: number;
  active: boolean;
}>;

export const plansApi = {
  /** Public — used by the subscribe pages. Active plans only. */
  listActive: () => api<{ plans: ApiPlan[] }>("/plans"),

  /** Super-admin — includes deactivated plans. */
  listAll: () => api<{ plans: ApiPlan[] }>("/super-admin/plans"),

  create: (input: CreatePlanInput) =>
    api<{ plan: ApiPlan }>("/super-admin/plans", { method: "POST", json: input }),

  update: (id: string, patch: UpdatePlanInput) =>
    api<{ plan: ApiPlan }>(`/super-admin/plans/${encodeURIComponent(id)}`, { method: "PATCH", json: patch }),

  deactivate: (id: string) =>
    api<{ plan: ApiPlan }>(`/super-admin/plans/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
