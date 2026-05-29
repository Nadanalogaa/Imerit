import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, IndianRupee, ShieldCheck, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { planById } from "../store/subscriptions";
import { useAuth } from "../store/auth";
import { useSubscriptions } from "../store/subscriptions";

export function SubscriptionPlans() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const active = useSubscriptions((s) => s.activeFor)(user.id, "candidate");
  const returnTo = params.get("return") ?? "/candidate/dashboard";
  const applyJob = params.get("apply");

  const plan = planById("plan_cand_45")!;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <Link
          to={returnTo}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Candidate subscription
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            One simple plan to apply
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Posting your profile is always free. Subscribe only when you're ready to apply to jobs.
          </p>
        </header>

        {active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10"
          >
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                You're already subscribed
              </p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                Active until {new Date(active.expiresAt).toLocaleDateString()}
              </p>
            </div>
            <Link
              to={returnTo}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Continue
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-8 shadow-2xl shadow-brand-500/10 dark:border-brand-500/40 dark:from-brand-500/10 dark:via-zinc-900 dark:to-amber-500/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                <Sparkles size={12} />
                Most popular
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">{plan.label}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">No GST · No hidden fees</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-baseline gap-0.5 text-zinc-900 dark:text-zinc-100">
                <IndianRupee size={20} className="opacity-70" />
                <span className="text-4xl font-bold">{plan.priceInr}</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">for {plan.durationDays} days</p>
            </div>
          </div>

          <ul className="mt-6 space-y-2.5">
            {plan.benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              const url = new URL(window.location.origin + "/candidate/payment");
              url.searchParams.set("plan", plan.id);
              url.searchParams.set("return", returnTo);
              if (applyJob) url.searchParams.set("apply", applyJob);
              navigate(url.pathname + url.search);
            }}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
          >
            Subscribe — pay ₹{plan.priceInr}
          </button>

          <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            Secure payment · Cancel anytime
          </p>
        </motion.div>
      </main>
    </div>
  );
}
