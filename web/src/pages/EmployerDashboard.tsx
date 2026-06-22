import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles,
  Search,
  Users,
  Briefcase,
  CreditCard,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { Navbar } from "../components/Navbar";

export function EmployerDashboard() {
  const user = useAuth((s) => s.currentUser)!;
  const allProfiles = useProfile((s) => s.byUser);
  const totalCandidates = Object.values(allProfiles).filter((p) => p.selectedTemplateId).length;
  const totalRegistered = allUsers().filter((u) => u.role === "candidate").length;
  const sub = useSubscriptions((s) =>
    s.activeFor(user.id, "employer_sme") ?? s.activeFor(user.id, "employer_large")
  );
  const firstName = user.name.split(" ")[0];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-10 md:py-14">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">
          {/* Hero */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-white to-sky-50/50 p-8 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-500/5">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/30 to-cyan-400/10 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                <Sparkles size={13} /> Employer dashboard
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Hello {firstName}
              </h1>
              {user.company && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <Building2 size={14} /> {user.company}
                </p>
              )}
              <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                Post jobs free, then subscribe to discover and reach the {totalCandidates > 0 ? `${totalCandidates} ` : ""}candidate{totalCandidates === 1 ? "" : "s"} who match your roles.
              </p>

              <motion.div variants={containerVariants} className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat
                  icon={user.emailVerified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  label="Account"
                  value={user.emailVerified ? "Verified" : "Pending"}
                  ok={user.emailVerified}
                />
                <Stat icon={<Users size={18} />} label="Candidates available" value={String(totalRegistered)} ok={totalRegistered > 0} />
                <Stat
                  icon={<CreditCard size={18} />}
                  label="Subscription"
                  value={sub ? `Until ${new Date(sub.expiresAt).toLocaleDateString()}` : "Inactive"}
                  ok={!!sub}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              variants={itemVariants}
              icon={<Search size={20} />}
              gradient="from-sky-500 to-cyan-500"
              title="Search candidates"
              desc={sub ? "Browse all profiles + view full CVs." : "Browse profiles. Subscribe to view full CVs."}
              to="/employer/candidates"
            />
            <ActionCard
              variants={itemVariants}
              icon={<Briefcase size={20} />}
              gradient="from-violet-500 to-fuchsia-500"
              title="Post a job"
              desc="Job posting is always free. List a new role in 2 minutes."
              to="/employer/jobs/new"
            />
            <ActionCard
              variants={itemVariants}
              icon={<ShieldCheck size={20} />}
              gradient="from-brand-500 to-amber-500"
              title="My posted jobs"
              desc="Track your postings + see ranked applicants."
              to="/employer/my-jobs"
            />
            <ActionCard
              variants={itemVariants}
              icon={<CreditCard size={20} />}
              gradient="from-emerald-500 to-teal-500"
              title="Subscription"
              desc={sub ? `Active · expires ${new Date(sub.expiresAt).toLocaleDateString()}` : "Choose an SME or Enterprise plan."}
              to="/employer/subscribe"
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <span className={ok ? "text-emerald-500" : "text-zinc-400"}>{icon}</span>
        {label}
      </div>
      <p className={["mt-1.5 text-base font-semibold", ok ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"].join(" ")}>{value}</p>
    </motion.div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  desc: string;
  soon?: boolean;
  to?: string;
  variants: Variants;
}

function ActionCard({ icon, gradient, title, desc, soon, to, variants }: ActionCardProps) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div className={["inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient].join(" ")}>
          {icon}
        </div>
        {soon && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Soon</span>}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
      {to && !soon && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
          Open <ArrowRight size={12} />
        </span>
      )}
    </>
  );
  if (to && !soon) {
    return (
      <motion.div variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
        <Link to={to} className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {inner}
        </Link>
      </motion.div>
    );
  }
  return (
    <motion.button variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} disabled={soon} className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:shadow-xl disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900">
      {inner}
    </motion.button>
  );
}
