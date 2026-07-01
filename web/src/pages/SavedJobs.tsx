import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, ChevronRight, MapPin } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { useApplications } from "../store/applications";
import { useJobs, FIELD_LABEL, relativeTime } from "../store/jobs";

const EMPTY_IDS: string[] = [];

export function SavedJobs() {
 const user = useAuth((s) => s.currentUser)!;
 // Selector returns the raw map slot — no fresh array creation. Falling
 // back to a module-level constant EMPTY_IDS keeps the reference stable
 // when nothing is saved yet; otherwise zustand loops on every render.
 const savedIds = useApplications((s) => s.saved[user.id] ?? EMPTY_IDS);
 const jobs = useJobs((s) => s.jobs);
 const items = savedIds
 .map((id) => jobs.find((j) => j.id === id))
 .filter((j): j is NonNullable<typeof j> => !!j);

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <Link
 to="/candidate/dashboard"
 className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ArrowLeft size={14} /> Dashboard
 </Link>

 <header className="mb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Saved jobs
 </p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
 {items.length} {items.length === 1 ? "job" : "jobs"} bookmarked
 </h1>
 </header>

 {items.length === 0 ? (
 <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
 <Bookmark size={32} className="text-zinc-400" />
 <p className="mt-3 text-sm font-semibold">No saved jobs yet</p>
 <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
 Tap the bookmark icon on any job to save it for later.
 </p>
 <Link
 to="/candidate/jobs"
 className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30"
 >
 Browse jobs
 </Link>
 </div>
 ) : (
 <div className="flex flex-col gap-3">
 {items.map((j, i) => (
 <motion.div
 key={j.id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25, delay: i * 0.04 }}
 >
 <Link
 to={`/candidate/jobs/${j.id}`}
 className="group flex items-center gap-4 rounded-2xl bg-white p-4 transition hover:border-brand-300 hover:shadow-md dark:bg-zinc-900 dark:hover:border-brand-500/40"
 >
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md">
 <Bookmark size={20} fill="currentColor" />
 </div>
 <div className="min-w-0 flex-1">
 <h2 className="truncate text-sm font-semibold">{j.title}</h2>
 <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
 {j.employerName} · <MapPin size={10} className="inline" /> {j.location} · {FIELD_LABEL[j.field]}
 </p>
 </div>
 <span className="hidden text-[11px] text-zinc-500 dark:text-zinc-400 sm:inline">
 {relativeTime(j.postedAt)}
 </span>
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
