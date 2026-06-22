import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ScrollText,
  LayoutDashboard,
  Briefcase,
  CreditCard,
  Heart,
  Eye,
  Edit3,
  FileCheck2,
  MapPin,
  Navigation,
  Target,
} from "lucide-react";
import { useAuth } from "../store/auth";
import { useProfile, profileCompletion } from "../store/profile";
import { useJobs, FIELD_LABEL, type Job } from "../store/jobs";
import { matchScore, jobDistanceKm, BAND_COLORS } from "../lib/matcher";
import { formatDistance } from "../lib/distance";
import { Navbar } from "../components/Navbar";
import { TEMPLATE_META } from "../components/templates/types";

const MIN_MATCH_SCORE = 30;
const MAX_MATCHES = 5;

export function CandidateDashboard() {
  const user = useAuth((s) => s.currentUser)!;
  const profile = useProfile((s) => s.get)(user.id);
  const jobs = useJobs((s) => s.jobs);
  const hasResume = !!profile.selectedTemplateId;
  const completion = profileCompletion(profile);
  const templateMeta = TEMPLATE_META.find((t) => t.id === profile.selectedTemplateId);
  const firstName = user.name.split(" ")[0];

  // Top matches — same scoring engine as JobBrowse, ranked desc by score with
  // distance as a tiebreaker. Hidden below MIN_MATCH_SCORE so we never surface
  // irrelevant noise on what should feel like a personalized shortlist.
  const topMatches = useMemo(() => {
    if (!hasResume) return [];
    return jobs
      .map((job) => {
        const result = matchScore(job, profile);
        const distance = jobDistanceKm(job, profile);
        return { job, result, distance };
      })
      .filter((x) => x.result.score >= MIN_MATCH_SCORE)
      .sort((a, b) => {
        if (b.result.score !== a.result.score) return b.result.score - a.result.score;
        return (a.distance ?? Infinity) - (b.distance ?? Infinity);
      })
      .slice(0, MAX_MATCHES);
  }, [jobs, profile, hasResume]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
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

          {/* Hero card */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-white to-brand-50/50 p-8 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-brand-500/5">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand-400/30 to-amber-400/10 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/10 to-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700 dark:text-brand-300">
                <Sparkles size={13} />
                Welcome aboard
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Hi {firstName} <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: 1, repeatDelay: 1 }} className="inline-block">👋</motion.span>
              </h1>
              <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
                Your account is verified. Next up: build your profile, pick a template, and start browsing jobs across Tamil Nadu.
              </p>

              <motion.div variants={containerVariants} className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat
                  icon={user.emailVerified ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  label="Account"
                  value={user.emailVerified ? "Verified" : "Pending"}
                  ok={user.emailVerified}
                />
                <Stat
                  icon={hasResume ? <FileCheck2 size={18} /> : <ScrollText size={18} />}
                  label="Profile"
                  value={hasResume ? `${completion}% complete` : "Not started"}
                  ok={hasResume}
                />
                <Stat icon={<CreditCard size={18} />} label="Subscription" value="Free tier" ok={false} />
              </motion.div>

              {!hasResume && (
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/candidate/profile/build"
                    className="group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
                  >
                    Build my profile
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Back to home
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* My Resume section — only when profile exists */}
          {hasResume && (
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8"
            >
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-400/5 blur-3xl" />
              <div className="relative grid items-center gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <FileCheck2 size={13} />
                    My Resume
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                    {user.name} · <span className="text-zinc-500 dark:text-zinc-400">{templateMeta?.label ?? "Custom"}</span>
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {completion}% complete · Last updated {new Date(profile.updatedAt).toLocaleDateString()}
                  </p>

                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <Link
                    to="/candidate/profile/preview"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
                  >
                    <Eye size={16} />
                    View profile
                  </Link>
                  <Link
                    to="/candidate/profile/build"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <Edit3 size={16} />
                    Edit profile
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Top matches — only when profile exists */}
          {hasResume && (
            <motion.section
              variants={itemVariants}
              className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8"
            >
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-brand-400/20 to-amber-400/5 blur-3xl" />
              <div className="relative">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <Target size={13} /> Matched for you
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                      {topMatches.length > 0
                        ? `Your top ${topMatches.length} match${topMatches.length === 1 ? "" : "es"}`
                        : "No strong matches yet"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {topMatches.length > 0
                        ? "Ranked by skills, field, location, and experience fit."
                        : "Keep your profile updated — we'll surface jobs as employers post them."}
                    </p>
                  </div>
                  {topMatches.length > 0 && (
                    <Link
                      to="/candidate/jobs"
                      className="hidden shrink-0 items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 md:inline-flex"
                    >
                      View all <ArrowRight size={12} />
                    </Link>
                  )}
                </div>

                {topMatches.length > 0 ? (
                  <ul className="mt-5 grid gap-3 md:grid-cols-2">
                    {topMatches.map(({ job, result, distance }) => (
                      <li key={job.id}>
                        <MatchedJobCard job={job} score={result.score} band={result.band} distance={distance} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-6 text-center dark:border-zinc-700 dark:bg-zinc-950/50">
                    <Briefcase size={22} className="mx-auto text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Try browsing all openings — your match score will refine as more jobs are posted.
                    </p>
                    <Link
                      to="/candidate/jobs"
                      className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                    >
                      Browse all jobs <ArrowRight size={12} />
                    </Link>
                  </div>
                )}

                {topMatches.length > 0 && (
                  <Link
                    to="/candidate/jobs"
                    className="mt-4 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 md:hidden"
                  >
                    View all matches <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            </motion.section>
          )}

          {/* Quick actions grid */}
          <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              variants={itemVariants}
              icon={<ScrollText size={20} />}
              gradient="from-brand-500 to-amber-500"
              title="Build your profile"
              desc="Add your education, skills, and ambitions. No CV needed."
              soon
            />
            <ActionCard
              variants={itemVariants}
              icon={<LayoutDashboard size={20} />}
              gradient="from-violet-500 to-fuchsia-500"
              title="Pick a template"
              desc="Choose from 5 stunning single-page profile designs."
              soon
            />
            <ActionCard
              variants={itemVariants}
              icon={<Briefcase size={20} />}
              gradient="from-sky-500 to-cyan-500"
              title="Browse jobs"
              desc="Discover openings across Tamil Nadu — IT and non-IT."
              to="/candidate/jobs"
            />
            <ActionCard
              variants={itemVariants}
              icon={<Heart size={20} />}
              gradient="from-rose-500 to-pink-500"
              title="Saved jobs"
              desc="Bookmark roles to revisit and apply later."
              to="/candidate/saved"
            />
            <ActionCard
              variants={itemVariants}
              icon={<CreditCard size={20} />}
              gradient="from-emerald-500 to-teal-500"
              title="Subscription"
              desc="Apply for jobs with a ₹333 / 45-day plan."
              to="/candidate/subscribe"
            />
            <ActionCard
              variants={itemVariants}
              icon={<Briefcase size={20} />}
              gradient="from-amber-500 to-orange-500"
              title="My applications"
              desc="See all the roles you've applied for."
              to="/candidate/applications"
            />
            <ActionCard
              variants={itemVariants}
              icon={<Sparkles size={20} />}
              gradient="from-indigo-500 to-purple-500"
              title="Get matched"
              desc="Our team will reach out with relevant openings."
              soon
            />
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            Subscribe to apply to any of these jobs · Job browsing is always free.
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}

function MatchedJobCard({
  job,
  score,
  band,
  distance,
}: {
  job: Job;
  score: number;
  band: "high" | "medium" | "low";
  distance: number | null;
}) {
  const initials = job.employerName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const colors = BAND_COLORS[band];

  return (
    <Link
      to={`/candidate/jobs/${job.id}`}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-brand-500/40"
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm",
            job.field === "it"
              ? "bg-gradient-to-br from-sky-500 to-sky-700"
              : "bg-gradient-to-br from-brand-500 to-brand-700",
          ].join(" ")}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {job.title}
          </h3>
          <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
            {job.employerName}
          </p>
        </div>
        <div className={["shrink-0 rounded-xl px-2 py-0.5 text-center ring-1", colors.bg, colors.ring].join(" ")}>
          <div className={["text-sm font-bold leading-tight", colors.text].join(" ")}>{score}%</div>
          <div className={["text-[8px] font-semibold uppercase tracking-wider", colors.text].join(" ")}>match</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <MapPin size={9} /> {job.location}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {FIELD_LABEL[job.field]}
        </span>
        {distance != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <Navigation size={9} /> {formatDistance(distance)}
          </span>
        )}
      </div>
    </Link>
  );
}

function Stat({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
      className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <span className={ok ? "text-emerald-500" : "text-zinc-400"}>{icon}</span>
        {label}
      </div>
      <p
        className={[
          "mt-1.5 text-base font-semibold",
          ok ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100",
        ].join(" ")}
      >
        {value}
      </p>
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
        {soon && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
    </>
  );

  if (to && !soon) {
    return (
      <motion.div
        variants={variants}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          to={to}
          className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      variants={variants}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      disabled={soon}
      className="group flex flex-col rounded-3xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:shadow-xl disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between">
        <div className={["inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient].join(" ")}>
          {icon}
        </div>
        {soon && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Soon
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
    </motion.button>
  );
}
