import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";

export type SubscriberType = "candidate" | "employer_sme" | "employer_large";

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  type: SubscriberType;
  priceInr: number;
  durationDays: number;
  startedAt: string;
  expiresAt: string;
  paymentRef: string;
}

export interface Plan {
  id: string;
  type: SubscriberType;
  label: string;
  priceInr: number;
  durationDays: number;
  gst: boolean;
  benefits: string[];
}

export const PLANS: Plan[] = [
  {
    id: "plan_cand_45",
    type: "candidate",
    label: "Candidate · 45 days",
    priceInr: 333,
    durationDays: 45,
    gst: false,
    benefits: [
      "Unlimited applications for 45 days",
      "Direct visibility to subscribed employers",
      "Profile boosted in candidate searches",
      "Cancel anytime",
    ],
  },
  // (Employer plans listed for completeness — used in Milestone 5)
  { id: "plan_sme_9",   type: "employer_sme",   label: "SME · 9 days",   priceInr: 1701,  durationDays: 9,   gst: true, benefits: [] },
  { id: "plan_sme_18",  type: "employer_sme",   label: "SME · 18 days",  priceInr: 3402,  durationDays: 18,  gst: true, benefits: [] },
  { id: "plan_sme_27",  type: "employer_sme",   label: "SME · 27 days",  priceInr: 6804,  durationDays: 27,  gst: true, benefits: [] },
  { id: "plan_lg_54",   type: "employer_large", label: "Large · 54 days",  priceInr: 13608, durationDays: 54,  gst: true, benefits: [] },
  { id: "plan_lg_108",  type: "employer_large", label: "Large · 108 days", priceInr: 27216, durationDays: 108, gst: true, benefits: [] },
  { id: "plan_lg_216",  type: "employer_large", label: "Large · 216 days", priceInr: 54432, durationDays: 216, gst: true, benefits: [] },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);

interface SubsState {
  subscriptions: Subscription[];
  add: (s: Subscription) => void;
  activeFor: (userId: string, type: SubscriberType) => Subscription | null;
}

const KEY = KEYS.subscriptions;

export const useSubscriptions = create<SubsState>((set, get) => ({
  subscriptions: load<Subscription[]>(KEY, []),

  add: (s) => {
    const next = [s, ...get().subscriptions];
    save(KEY, next);
    set({ subscriptions: next });
  },

  activeFor: (userId, type) => {
    const now = Date.now();
    return (
      get().subscriptions.find(
        (s) =>
          s.userId === userId &&
          s.type === type &&
          new Date(s.expiresAt).getTime() > now
      ) ?? null
    );
  },
}));

export function gstAmount(priceInr: number, applies: boolean): number {
  return applies ? Math.round(priceInr * 0.18) : 0;
}
