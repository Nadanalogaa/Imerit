import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Code2,
  Building2,
  Clock,
  Sparkles,
  IndianRupee,
  CheckCircle2,
  Bookmark,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useJobs, FIELD_LABEL, TYPE_LABEL, relativeTime } from "../store/jobs";
import { useAuth } from "../store/auth";
import { useApplications } from "../store/applications";
import { useSubscriptions } from "../store/subscriptions";

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const job = useJobs((s) => s.byId)(id ?? "");
  const fetchById = useJobs((s) => s.fetchById);
  const user = useAuth((s) => s.currentUser)!;
  const applyAsync = useApplications((s) => s.applyAsync);
  const toggleSaveAsync = useApplications((s) => s.toggleSaveAsync);
  const hasApplied = useApplications((s) => s.hasApplied)(user.id, id ?? "");
  const isSaved = useApplications((s) => s.isSaved)(user.id, id ?? "");
  const activeSub = useSubscriptions((s) => s.activeFor)(user.id, "candidate");

  const [showApplied, setShowApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Cold-start path: if the cache doesn't have the job (deep link or new tab),
  // pull it from the API. fetchById is a no-op when the job is already cached.
  useEffect(() => {
    if (!id || job) return;
    let alive = true;
    void fetchById(id).then((j) => {
      if (alive && !j) setNotFound(true);
    });
    return () => { alive = false; };
  }, [id, job, fetchById]);

  if (notFound) return <Navigate to="/candidate/jobs" replace />;
  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading job…</main>
      </div>
    );
  }

  const initials = job.employerName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const onApply = async () => {
    if (hasApplied) return;
    if (!activeSub) {
      navigate(
        `/candidate/subscribe?return=${encodeURIComponent(`/candidate/jobs/${job.id}`)}&apply=${job.id}`,
      );
      return;
    }
    setErrorMsg(null);
    setApplying(true);
    try {
      await applyAsync(user.id, job.id);
      setShowApplied(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not submit application. Try again.");
    } finally {
      setApplying(false);
    }
  };

  const onToggleSave = () => {
    void toggleSaveAsync(user.id, job.id).catch((err) => {
      setErrorMsg(err instanceof Error ? err.message : "Could not update saved jobs.");
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/candidate/jobs"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={14} /> Back to jobs
          </Link>
          <button
            onClick={onToggleSave}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              isSaved
                ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8"
        >
          <div className="flex items-start gap-4">
            <div
              className={[
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-base font-bold text-white shadow-lg",
                job.field === "it"
                  ? "bg-gradient-to-br from-sky-500 to-sky-700 shadow-sky-500/30"
                  : "bg-gradient-to-br from-brand-500 to-brand-700 shadow-brand-500/30",
              ].join(" ")}
            >
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{job.title}</h1>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{job.employerName}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Pill icon={<MapPin size={12} />}>{job.location}</Pill>
            <Pill icon={job.field === "it" ? <Code2 size={12} /> : <Building2 size={12} />}>
              {FIELD_LABEL[job.field]}
            </Pill>
            <Pill icon={<Briefcase size={12} />}>{TYPE_LABEL[job.type]}</Pill>
            {job.experience === "fresher" && <Pill icon={<Sparkles size={12} />}>Freshers welcome</Pill>}
            {job.experience === "experienced" && job.yearsMin && (
              <Pill icon={<Briefcase size={12} />}>{job.yearsMin}+ years</Pill>
            )}
            <Pill icon={<Clock size={12} />}>Posted {relativeTime(job.postedAt)}</Pill>
          </div>

          {job.salaryRange && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:from-emerald-500/10 dark:to-teal-500/5 dark:text-emerald-400">
              <IndianRupee size={14} /> {job.salaryRange}
            </div>
          )}

          <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              About the role
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {job.description}
            </p>
          </div>

          {job.skills.length > 0 && (
            <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Required skills
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.article>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="sticky bottom-4 mt-6"
        >
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-zinc-200 bg-white/90 p-5 shadow-2xl shadow-zinc-300/40 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/40 sm:flex-row sm:justify-between">
            <div>
              {hasApplied ? (
                <>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={15} /> You've applied to this job
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Track it in <Link to="/candidate/applications" className="underline">My Applications</Link>.
                  </p>
                </>
              ) : activeSub ? (
                <>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                    Subscription active
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Until {new Date(activeSub.expiresAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Ready to apply?</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Apply unlocks with the ₹333 / 45-day plan.
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onApply}
              disabled={hasApplied || applying}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {applying ? "Applying…" : hasApplied ? "Applied" : activeSub ? "Apply now" : "Subscribe & apply"}
            </button>
          </div>
          {errorMsg && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{errorMsg}</p>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {showApplied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5 backdrop-blur"
            onClick={() => setShowApplied(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
                className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40"
              >
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </motion.div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">Application submitted!</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Your application for <strong>{job.title}</strong> at {job.employerName} is on its way.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => setShowApplied(false)}
                  className="flex-1 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Stay here
                </button>
                <Link
                  to="/candidate/applications"
                  className="flex-1 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  My applications
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {icon}
      {children}
    </span>
  );
}
