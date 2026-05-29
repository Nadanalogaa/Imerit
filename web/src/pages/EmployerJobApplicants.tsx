import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Lock,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, allUsers } from "../store/auth";
import { useJobs, FIELD_LABEL, TYPE_LABEL } from "../store/jobs";
import { useApplications } from "../store/applications";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { matchScore, BAND_COLORS } from "../lib/matcher";

export function EmployerJobApplicants() {
  const { id } = useParams<{ id: string }>();
  const employer = useAuth((s) => s.currentUser)!;
  const job = useJobs((s) => s.byId)(id ?? "");
  const apps = useApplications((s) => s.applications);
  const profiles = useProfile((s) => s.byUser);
  const sub = useSubscriptions((s) =>
    s.activeFor(employer.id, "employer_sme") ?? s.activeFor(employer.id, "employer_large")
  );
  const hasSub = !!sub;

  if (!job) return <Navigate to="/employer/my-jobs" replace />;
  if (job.employerId !== employer.id) return <Navigate to="/employer/dashboard" replace />;

  const applicants = apps
    .filter((a) => a.jobId === job.id)
    .map((a) => {
      const user = allUsers().find((u) => u.id === a.userId);
      const profile = profiles[a.userId];
      const result = profile ? matchScore(job, profile) : null;
      return user && profile ? { user, profile, app: a, result } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => (b.result?.score ?? 0) - (a.result?.score ?? 0));

  const strongCount = applicants.filter((a) => a.result?.band === "high").length;
  const avgCount = applicants.filter((a) => a.result?.band === "medium").length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Link to="/employer/my-jobs" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> My posted jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md">
              <Briefcase size={20} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{job.title}</h1>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                <MapPin size={11} className="inline" /> {job.location} · {FIELD_LABEL[job.field]} · {TYPE_LABEL[job.type]}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <Stat icon={<Users size={13} />} label="Total applicants" value={applicants.length} />
            <Stat icon={<Sparkles size={13} />} label="Strong matches" value={strongCount} accent="emerald" />
            <Stat icon={<Sparkles size={13} />} label="Average matches" value={avgCount} accent="amber" />
          </div>
        </motion.div>

        <div className="mt-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Applicants — sorted by match
          </h2>

          {applicants.length === 0 ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <Users size={28} className="text-zinc-400" />
              <p className="mt-3 text-sm font-semibold">No applicants yet</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Candidates with matching skills will see this job in their feed sorted by fit.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {applicants.map((a, i) => {
                const initials = a.user.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
                const colors = a.result ? BAND_COLORS[a.result.band] : BAND_COLORS.low;
                const cardContent = (
                  <div className="flex items-center gap-3">
                    {a.profile.photoDataUrl ? (
                      <img src={a.profile.photoDataUrl} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-zinc-200 dark:ring-zinc-800" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-sm font-bold text-white shadow-md">
                        {initials || "—"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">{hasSub ? a.user.name : "•••••• ••••••"}</h3>
                      <p className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                        {a.profile.preferredLocation ?? "—"} · {(a.profile.itLanguages ?? a.profile.topSkills ?? []).slice(0, 3).join(" · ") || "—"}
                      </p>
                    </div>
                    <div className={["flex flex-col items-center rounded-2xl px-3 py-2 ring-1", colors.bg, colors.ring].join(" ")}>
                      <span className={["text-base font-bold", colors.text].join(" ")}>{a.result?.score ?? 0}%</span>
                      <span className={["text-[9px] font-semibold uppercase tracking-wider", colors.text].join(" ")}>match</span>
                    </div>
                    {!hasSub && <Lock size={14} className="text-amber-600 dark:text-amber-400" />}
                    {hasSub && <ChevronRight size={18} className="text-zinc-400" />}
                  </div>
                );
                return (
                  <motion.div key={a.app.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
                    {hasSub ? (
                      <Link to={`/employer/candidates/${a.user.id}`} className="block rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500/40">
                        {cardContent}
                      </Link>
                    ) : (
                      <Link to={`/employer/subscribe?return=${encodeURIComponent(`/employer/jobs/${job.id}/applicants`)}`} className="block rounded-2xl border border-amber-200 bg-amber-50/50 p-4 transition hover:border-amber-300 hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/5">
                        {cardContent}
                        <p className="mt-3 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                          Subscribe to view full profile + contact details
                        </p>
                      </Link>
                    )}
                    {a.result && a.result.reasons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5 px-1">
                        {a.result.reasons.slice(0, 3).map((r, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, accent = "zinc" }: { icon: React.ReactNode; label: string; value: number; accent?: "zinc" | "emerald" | "amber" }) {
  const cls =
    accent === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" :
    accent === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" :
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={["inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold", cls].join(" ")}>
      {icon}
      {label}: {value}
    </span>
  );
}
