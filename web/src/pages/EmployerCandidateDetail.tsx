import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldAlert, Sparkles, Mail, Phone } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { RenderTemplate } from "../components/templates";

export function EmployerCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const employer = useAuth((s) => s.currentUser)!;
  const sub = useSubscriptions((s) =>
    s.activeFor(employer.id, "employer_sme") ?? s.activeFor(employer.id, "employer_large")
  );
  const profiles = useProfile((s) => s.byUser);

  const candidate = allUsers().find((u) => u.id === id);
  const profile = id ? profiles[id] : undefined;

  if (!candidate || candidate.role !== "candidate" || !profile?.selectedTemplateId) {
    return <Navigate to="/employer/candidates" replace />;
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
          <Link to="/employer/candidates" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <ArrowLeft size={14} /> Back to candidates
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-10 text-center shadow-2xl shadow-amber-500/10 dark:border-amber-500/30 dark:from-amber-500/10 dark:via-orange-500/5 dark:to-zinc-900"
          >
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/40">
              <Lock size={32} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
              This profile is locked
            </h1>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Subscribe to unlock full candidate profiles, contact details, and direct outreach.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/employer/candidates"
                className="rounded-2xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Back to list
              </Link>
              <Link
                to={`/employer/subscribe?return=${encodeURIComponent(`/employer/candidates/${candidate.id}`)}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30"
              >
                <Sparkles size={14} /> See plans
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <header className="sticky top-16 z-30 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/60 bg-zinc-50/80 px-5 py-3 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
          <Link to="/employer/candidates" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <ArrowLeft size={14} /> Candidates
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            <ShieldAlert size={11} /> Subscription active
          </div>
          <div className="flex items-center gap-2">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Mail size={12} /> Email
              </a>
            )}
            {candidate.mobile && (
              <a
                href={`tel:+91${candidate.mobile}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-700 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-500/30"
              >
                <Phone size={12} /> Call
              </a>
            )}
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/40 dark:border-zinc-800 dark:shadow-black/50"
        >
          <RenderTemplate id={profile.selectedTemplateId} user={candidate} profile={profile} />
        </motion.div>

        <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          One-page format. Auto-fits to a single PDF on export.
        </p>
      </main>
    </div>
  );
}
