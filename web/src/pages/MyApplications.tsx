import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, ChevronRight, Clock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { useApplications } from "../store/applications";
import { useJobs, FIELD_LABEL, TYPE_LABEL, relativeTime } from "../store/jobs";

export function MyApplications() {
 const user = useAuth((s) => s.currentUser)!;
 // Subscribe to the whole applications slice (stable reference from
 // zustand), then derive the per-user filter with useMemo. Filtering
 // inside the selector returns a fresh array every render, which trips
 // zustand's snapshot check and infinite-loops.
 const allApps = useApplications((s) => s.applications);
 const apps = useMemo(
 () => allApps.filter((a) => a.userId === user.id),
 [allApps, user.id],
 );
 const jobs = useJobs((s) => s.jobs);

 const enriched = apps
 .map((a) => ({ ...a, job: jobs.find((j) => j.id === a.jobId) }))
 .filter((x) => x.job);

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-4xl px-5 py-6 md:py-6 md:py-10">
 <Link
 to="/candidate/dashboard"
 className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ArrowLeft size={14} /> Dashboard
 </Link>

 <header className="mb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 My applications
 </p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
 {enriched.length} {enriched.length === 1 ? "application" : "applications"}
 </h1>
 </header>

 {enriched.length === 0 ? (
 <EmptyState />
 ) : (
 <div className="flex flex-col gap-3">
 {enriched.map((a, i) => (
 <motion.div
 key={a.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25, delay: i * 0.04 }}
 >
 <Link
 to={`/candidate/jobs/${a.jobId}`}
 className="group flex items-center gap-4 rounded-2xl bg-white p-4 transition hover:border-brand-300 hover:shadow-md dark:bg-zinc-900 dark:hover:border-brand-500/40"
 >
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
 <Briefcase size={20} />
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="truncate text-sm font-semibold">{a.job!.title}</h2>
 <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
 {a.job!.employerName} · {a.job!.location} · {FIELD_LABEL[a.job!.field]} · {TYPE_LABEL[a.job!.type]}
 </p>
 </div>
 <div className="hidden flex-col items-end gap-1 text-right sm:flex">
 <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
 Submitted
 </span>
 <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
 <Clock size={10} /> Applied {relativeTime(a.appliedAt)}
 </span>
 </div>
 <ChevronRight size={18} className="shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
 </Link>
 </motion.div>
 ))}
 </div>
 )}
 </main>
 </div>
 );
}

function EmptyState() {
 return (
 <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
 <Briefcase size={32} className="text-zinc-400" />
 <p className="mt-3 text-sm font-semibold">You haven't applied to any jobs yet</p>
 <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
 Browse openings and tap Apply on any role you like.
 </p>
 <Link
 to="/candidate/jobs"
 className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30"
 >
 Browse jobs
 </Link>
 </div>
 );
}
