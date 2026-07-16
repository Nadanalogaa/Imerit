import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Briefcase, Plus, ArrowRight, Users2 } from "lucide-react";
import { allUsers, useAuth } from "../store/auth";
import { useJobs, isExpired } from "../store/jobs";
import { Navbar } from "../components/Navbar";

/**
 * Staff landing page. Reads only from local state (no separate staff API
 * yet) — surfaces the two counters that matter (employers in the master,
 * jobs I've posted) and quick jumps into the two workflows I actually
 * spend time on: add employer, post job.
 */
export function StaffDashboard() {
  const me = useAuth((s) => s.currentUser)!;
  const jobs = useJobs((s) => s.jobs);

  const stats = useMemo(() => {
    const employers = allUsers().filter((u) => u.role === "employer");
    const myProvisioned = employers.filter((u) => u.createdByStaffId === me.id);
    // Any job whose employer was provisioned by me — a rough "jobs I posted"
    // signal until we add explicit `postedByStaffId` on the job row.
    const providedEmployerIds = new Set(myProvisioned.map((u) => u.id));
    const myJobs = jobs.filter((j) => providedEmployerIds.has(j.employerId));
    const activeJobs = myJobs.filter((j) => !isExpired(j));
    return {
      employerCount: employers.length,
      myEmployerCount: myProvisioned.length,
      jobsPosted: myJobs.length,
      activeJobs: activeJobs.length,
    };
  }, [me.id, jobs]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Staff · post jobs on behalf of employers
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Hi {me.name.split(" ")[0]}, ready to publish?
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add employers to the master, pick one, and post a job. Credentials get generated
            automatically — hand them to the employer so they can sign in through the employer
            portal.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Employers in master" value={stats.employerCount} icon={<Building2 size={18} />} tone="sky" />
          <StatTile label="Provisioned by me" value={stats.myEmployerCount} icon={<Users2 size={18} />} tone="teal" />
          <StatTile label="Jobs I've posted" value={stats.jobsPosted} icon={<Briefcase size={18} />} tone="violet" />
          <StatTile label="Active jobs" value={stats.activeJobs} icon={<Briefcase size={18} />} tone="emerald" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ActionCard
            to="/staff/jobs/new"
            title="Post a job"
            body="Pick an employer from the master (or create one on the fly) and publish a role."
            cta="Start posting"
            tone="brand"
            icon={<Plus size={20} />}
          />
          <ActionCard
            to="/staff/employers"
            title="Employer Master"
            body="Add, edit, or reset passwords for the employers you manage."
            cta="Open master"
            tone="sky"
            icon={<Building2 size={20} />}
          />
        </div>
      </main>
    </div>
  );
}

const TONE: Record<string, string> = {
  sky:     "from-sky-500 to-sky-700 shadow-sky-500/30",
  teal:    "from-teal-500 to-emerald-600 shadow-emerald-500/30",
  violet:  "from-violet-500 to-purple-600 shadow-violet-500/30",
  emerald: "from-emerald-500 to-emerald-700 shadow-emerald-500/30",
  brand:   "from-brand-500 to-brand-700 shadow-brand-500/30",
};

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: keyof typeof TONE;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className={["flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", TONE[tone]].join(" ")}>
        {icon}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
    </motion.div>
  );
}

function ActionCard({
  to,
  title,
  body,
  cta,
  tone,
  icon,
}: {
  to: string;
  title: string;
  body: string;
  cta: string;
  tone: keyof typeof TONE;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className={["mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", TONE[tone]].join(" ")}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-700 group-hover:gap-2 dark:text-zinc-300">
        {cta} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

