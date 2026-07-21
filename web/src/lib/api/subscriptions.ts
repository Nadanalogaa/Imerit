/**
 * Typed wrappers around /subscriptions/*. Same skeleton as the
 * other API clients — one method per backend route, thin.
 */

import { api } from "../api";

export interface ApiOrder {
  orderId: string;
  amount: number;      // paise
  currency: string;    // "INR"
  key: string;         // Razorpay key_id — safe to expose
  subscriptionId: string;
}

export interface ApiSubscription {
  id: string;
  userId: string;
  planId: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amountInPaise: number;
  gstInPaise: number;
  totalInPaise: number;
  startedAt: string;
  expiresAt: string;
  paidAt: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  plan?: {
    id: string;
    label: string;
    durationDays: number;
    priceInPaise: number;
    audience: "CANDIDATE" | "EMPLOYER_SME" | "EMPLOYER_LARGE";
  };
}

export const subscriptionsApi = {
  /** Step 1: create a Razorpay Order for a plan. */
  createOrder: (planId: string) =>
    api<ApiOrder>("/subscriptions/order", { method: "POST", json: { planId } }),

  /** Step 2: hand Razorpay's post-checkout tokens to the server for
   *  HMAC verification + activation. Same-user check is enforced
   *  server-side (compares against JWT sub). */
  verify: (input: { orderId: string; paymentId: string; signature: string }) =>
    api<{ subscription: ApiSubscription }>("/subscriptions/verify", {
      method: "POST",
      json: input,
    }),

  /** User's subscription history. */
  mine: () => api<{ items: ApiSubscription[] }>("/subscriptions/me"),

  /** Admin — trigger a refund. */
  adminRefund: (id: string, reason: string) =>
    api<{ subscription: ApiSubscription }>(`/admin/subscriptions/${id}/refund`, {
      method: "POST",
      json: { reason },
    }),
};
