import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  IndianRupee,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { planById, useSubscriptions, gstAmount } from "../store/subscriptions";
import { useApplications } from "../store/applications";
import { payForPlan } from "../lib/razorpay";
import { apiEnabled } from "../lib/api";

/**
 * Payment screen for candidate subscriptions. Real Razorpay checkout
 * when apiEnabled; falls back to the older localStorage "fake" flow
 * in offline dev.
 *
 * The UI is intentionally minimal — no card form. Razorpay's own
 * modal handles card / UPI / netbanking / wallet, and it's the
 * only PCI-safe way to accept card data anyway (their SDK never
 * lets card numbers touch our page).
 */
export function PaymentScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const addSub = useSubscriptions((s) => s.add);
  const apply = useApplications((s) => s.apply);

  const planId = params.get("plan") ?? "plan_cand_45";
  const returnTo = params.get("return") ?? "/candidate/dashboard";
  const applyJob = params.get("apply");
  const plan = planById(planId);

  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidRef, setPaidRef] = useState<string | null>(null);

  if (!plan) {
    navigate("/candidate/dashboard", { replace: true });
    return null;
  }

  const gst = gstAmount(plan.priceInr, plan.gst);
  const total = plan.priceInr + gst;

  const onPay = async () => {
    setError(null);
    setProcessing(true);
    if (!apiEnabled) {
      // Offline / dev — keep the fake flow so demos still work.
      setTimeout(() => {
        const now = new Date();
        const exp = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        addSub({
          id: "sub_" + Math.random().toString(36).slice(2, 10),
          userId: user.id,
          planId: plan.id,
          type: plan.type,
          priceInr: plan.priceInr,
          durationDays: plan.durationDays,
          startedAt: now.toISOString(),
          expiresAt: exp.toISOString(),
          paymentRef: "OFFLINE_" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        });
        if (applyJob) apply(user.id, applyJob);
        setProcessing(false);
        setSuccess(true);
        setPaidRef("OFFLINE-DEMO");
        setTimeout(
          () => navigate(applyJob ? `/candidate/jobs/${applyJob}` : returnTo, { replace: true }),
          1700,
        );
      }, 800);
      return;
    }
    await payForPlan({
      planId: plan.id,
      planLabel: plan.label,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.mobile ?? undefined,
      },
      onSuccess: (subscription) => {
        // Mirror the paid subscription into local state so the app's
        // existing "am I subscribed?" checks (still localStorage-based)
        // continue to work while we finish the mobile port etc.
        addSub({
          id: subscription.id,
          userId: user.id,
          planId: plan.id,
          type: plan.type,
          priceInr: plan.priceInr,
          durationDays: plan.durationDays,
          startedAt: subscription.startedAt,
          expiresAt: subscription.expiresAt,
          paymentRef: subscription.invoiceNumber ?? subscription.id,
        });
        if (applyJob) apply(user.id, applyJob);
        setProcessing(false);
        setSuccess(true);
        setPaidRef(subscription.invoiceNumber ?? subscription.id);
        setTimeout(
          () => navigate(applyJob ? `/candidate/jobs/${applyJob}` : returnTo, { replace: true }),
          1900,
        );
      },
      onDismiss: () => {
        // User closed the Razorpay modal — treat as "not paid, retry
        // available". No error banner: dismissing is intentional.
        setProcessing(false);
      },
      onError: (msg) => {
        setProcessing(false);
        setError(msg);
      },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-6 md:py-10">
        <Link
          to={`/candidate/subscribe?return=${encodeURIComponent(returnTo)}${applyJob ? `&apply=${applyJob}` : ""}`}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Back to plans
        </Link>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-12 text-center shadow-2xl shadow-emerald-500/10 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
                className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/40"
              >
                <CheckCircle2 size={42} strokeWidth={2.5} />
              </motion.div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">Payment successful</h2>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                Your {plan.label.toLowerCase()} is active. {applyJob ? "Submitting your application..." : "Redirecting..."}
              </p>
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Invoice: <span className="font-mono">{paidRef ?? "—"}</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                A copy of your tax invoice has been emailed to {user.email}.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-[1fr_280px]"
            >
              {/* Left — payment CTA (no card form; Razorpay owns that) */}
              <div className="order-2 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:bg-zinc-900 dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] md:order-1 md:p-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-600 dark:text-brand-400" />
                  <h2 className="text-lg font-semibold tracking-tight">Complete payment</h2>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  You'll be redirected to Razorpay's secure checkout to complete the payment.
                  We support UPI, cards (credit / debit), netbanking, and popular wallets.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <PayMethod label="UPI" />
                  <PayMethod label="Cards" />
                  <PayMethod label="Netbanking" />
                  <PayMethod label="Wallets" />
                </div>

                <button
                  type="button"
                  onClick={onPay}
                  disabled={processing}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 disabled:opacity-70"
                >
                  {processing ? (
                    <>
                      <Spinner /> Opening checkout…
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      Pay ₹{total.toLocaleString("en-IN")}
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    {error}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <ShieldCheck size={12} />
                  Payments processed by Razorpay · PCI-DSS compliant
                </div>
                <div className="mt-2 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  By continuing you agree to our{" "}
                  <Link to="/legal/terms" className="underline">Terms</Link>{" "}
                  and{" "}
                  <Link to="/legal/refund" className="underline">Refund Policy</Link>.
                </div>
              </div>

              {/* Right — order summary */}
              <aside className="order-1 rounded-3xl bg-gradient-to-br from-brand-50 to-amber-50 p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:from-brand-500/10 dark:to-amber-500/5 dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] md:order-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  Order summary
                </p>
                <h3 className="mt-2 text-base font-semibold tracking-tight">{plan.label}</h3>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  Active for {plan.durationDays} days from payment
                </p>

                <dl className="mt-5 space-y-2 text-sm">
                  <Row label="Plan" value={`₹${plan.priceInr.toLocaleString("en-IN")}`} />
                  {plan.gst && <Row label="GST (18%)" value={`₹${gst.toLocaleString("en-IN")}`} />}
                  <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />
                  <Row
                    label={<span className="font-bold">Total</span>}
                    value={
                      <span className="inline-flex items-baseline gap-0.5 font-bold text-zinc-900 dark:text-zinc-100">
                        <IndianRupee size={14} />
                        {total.toLocaleString("en-IN")}
                      </span>
                    }
                  />
                </dl>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PayMethod({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
