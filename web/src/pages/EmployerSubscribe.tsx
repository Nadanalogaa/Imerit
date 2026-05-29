import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, IndianRupee, ShieldCheck, Sparkles, Building2, Building } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { useSubscriptions, PLANS } from "../store/subscriptions";

export function EmployerSubscribe() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const active = useSubscriptions((s) =>
    s.activeFor(user.id, "employer_sme") ?? s.activeFor(user.id, "employer_large")
  );
  const returnTo = params.get("return") ?? "/employer/dashboard";

  const sme = PLANS.filter((p) => p.type === "employer_sme");
  const large = PLANS.filter((p) => p.type === "employer_large");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
        <Link
          to={returnTo}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Employer subscription
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Pick your plan
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Job posting is always free. Subscribe to view full candidate profiles + contact directly.
          </p>
        </header>

        {active && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">You're already subscribed</p>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">Active until {new Date(active.expiresAt).toLocaleDateString()}</p>
            </div>
            <Link to={returnTo} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Continue</Link>
          </motion.div>
        )}

        <section className="mb-10">
          <SectionHeader icon={<Building2 size={16} />} label="SME — 1 to 50 employees" badge="Most chosen" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {sme.map((p, i) => (
              <PlanCard
                key={p.id}
                planId={p.id}
                label={p.label}
                priceInr={p.priceInr}
                durationDays={p.durationDays}
                gst={p.gst}
                accent="sky"
                returnTo={returnTo}
                navigate={navigate}
                highlight={i === 0}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader icon={<Building size={16} />} label="Medium & Large — Above 50 employees" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {large.map((p) => (
              <PlanCard
                key={p.id}
                planId={p.id}
                label={p.label}
                priceInr={p.priceInr}
                durationDays={p.durationDays}
                gst={p.gst}
                accent="violet"
                returnTo={returnTo}
                navigate={navigate}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeader({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sky-600 dark:text-sky-400">{icon}</span>
      <h2 className="text-base font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{label}</h2>
      {badge && (
        <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          {badge}
        </span>
      )}
    </div>
  );
}

function PlanCard({
  planId,
  label,
  priceInr,
  durationDays,
  gst,
  accent,
  highlight,
  returnTo,
  navigate,
}: {
  planId: string;
  label: string;
  priceInr: number;
  durationDays: number;
  gst: boolean;
  accent: "sky" | "violet";
  highlight?: boolean;
  returnTo: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const gstAmt = gst ? Math.round(priceInr * 0.18) : 0;
  const grad = accent === "sky" ? "from-sky-500 to-sky-700 shadow-sky-500/30" : "from-violet-500 to-fuchsia-600 shadow-violet-500/30";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className={[
        "relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm dark:bg-zinc-900",
        highlight ? "border-sky-300 dark:border-sky-500/40" : "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      {highlight && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-md">
          <Sparkles size={10} /> Popular
        </span>
      )}
      <h3 className="text-base font-semibold tracking-tight">{label}</h3>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Active for {durationDays} days · {gst ? "+ 18% GST" : "No GST"}
      </p>
      <div className="mt-4 inline-flex items-baseline gap-0.5">
        <IndianRupee size={20} className="opacity-70" />
        <span className="text-3xl font-bold">{priceInr.toLocaleString("en-IN")}</span>
        {gst && <span className="ml-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">+ ₹{gstAmt.toLocaleString("en-IN")} GST</span>}
      </div>

      <ul className="mt-5 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
        <Bullet>Unlimited candidate searches</Bullet>
        <Bullet>Full profile visibility + contact details</Bullet>
        <Bullet>Filter by location, field, experience</Bullet>
      </ul>

      <button
        onClick={() => navigate(`/employer/payment?plan=${planId}&return=${encodeURIComponent(returnTo)}`)}
        className={["mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg", grad].join(" ")}
      >
        Subscribe — pay ₹{(priceInr + gstAmt).toLocaleString("en-IN")}
      </button>
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}
