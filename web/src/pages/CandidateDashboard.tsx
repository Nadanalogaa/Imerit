import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
 CheckCircle2,
 Clock,
 Sparkles,
 ArrowRight,
 ScrollText,
 Briefcase,
 CreditCard,
 Heart,
 Eye,
 Edit3,
 FileCheck2,
 MapPin,
 Navigation,
 Target,
 Bookmark,
} from "lucide-react";
import { useAuth } from "../store/auth";
import { useProfile, profileCompletion } from "../store/profile";
import { useJobs, FIELD_LABEL, type Job } from "../store/jobs";
import { useSubscriptions } from "../store/subscriptions";
import { useApplications } from "../store/applications";
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
 const activeSub = useSubscriptions((s) => s.activeFor)(user.id, "candidate");

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

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">

 {/* Single unified banner — greeting + identity + status + actions in
 one card. Replaces the previous duplicate (welcome card + my-resume
 card both restating "100% complete · view/edit profile"). */}
 <motion.div
 variants={itemVariants}
 className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-brand-50/40 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:from-zinc-900 dark:via-zinc-900 dark:to-brand-500/5 md:p-6"
 >
 <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-brand-400/20 to-amber-400/10 blur-3xl" />

 <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
 {/* LEFT — greeting + identity + status rail + progress bar */}
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500/10 to-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:text-brand-300">
 <Sparkles size={11} />
 Welcome aboard
 </span>
 </div>

 <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
 Hi {firstName}
 <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: 1, repeatDelay: 1 }} className="inline-block">👋</motion.span>
 </h1>

 {/* Status rail — varies by hasResume state */}
 <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
 <span className={["inline-flex items-center gap-1.5 font-semibold", user.emailVerified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"].join(" ")}>
 {user.emailVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
 Account {user.emailVerified ? "verified" : "pending"}
 </span>
 {hasResume ? (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
 <FileCheck2 size={14} className="text-emerald-500" />
 {templateMeta?.label ?? "Custom"} template
 </span>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="text-zinc-500 dark:text-zinc-400">
 Updated {new Date(profile.updatedAt).toLocaleDateString()}
 </span>
 </>
 ) : (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <Link
 to="/candidate/profile/build"
 className="inline-flex items-center gap-1.5 font-semibold text-brand-600 underline-offset-2 transition hover:underline dark:text-brand-400"
 >
 <ScrollText size={14} />
 Profile — start now
 <ArrowRight size={13} />
 </Link>
 </>
 )}
 </div>

 {/* Progress bar — only when there's any progress to show. Sits below
 the rail so it reads as the visual answer to "how complete is my
 profile" without restating it in another card. */}
 {hasResume && (
 <div className="mt-3 flex items-center gap-3">
 <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${completion}%` }}
 transition={{ duration: 0.7, ease: "easeOut" }}
 className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
 />
 </div>
 <span className="text-[11px] font-bold tabular-nums text-zinc-600 dark:text-zinc-400">
 {completion}%
 </span>
 </div>
 )}
 </div>

 {/* RIGHT — subscription pill (top) + action buttons (below) */}
 <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
 <SubscriptionBadge activeLabel={activeSub?.planId.replace("plan_", "")} />
 {hasResume ? (
 <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
 <Link
 to="/candidate/profile/preview"
 className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:shadow-md"
 >
 <Eye size={14} /> View profile
 </Link>
 <Link
 to="/candidate/profile/build"
 className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <Edit3 size={14} /> Edit profile
 </Link>
 </div>
 ) : (
 <Link
 to="/candidate/profile/build"
 className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
 >
 Build my profile
 <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
 </Link>
 )}
 </div>
 </div>
 </motion.div>

 {/* Top matches — only when profile exists */}
 {hasResume && (
 <motion.section
 variants={itemVariants}
 className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 md:p-6"
 >
 <div className="relative">
 {/* Compact section header — eyebrow + count inline, View all
 anchored right on every breakpoint. */}
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/30">
 <Target size={14} />
 </span>
 <div>
 <h2 className="text-base font-semibold tracking-tight md:text-lg">
 Matched for you
 </h2>
 <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
 {topMatches.length > 0
 ? `${topMatches.length} ranked by skills, location, and experience fit.`
 : "Keep your profile updated — we'll surface jobs as employers post them."}
 </p>
 </div>
 </div>
 {topMatches.length > 0 && (
 <Link
 to="/candidate/jobs"
 className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-brand-500/10"
 >
 View all <ArrowRight size={12} />
 </Link>
 )}
 </div>

 {topMatches.length > 0 ? (
 <ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
 {topMatches.map(({ job, result, distance }) => (
 <li key={job.id}>
 <MatchedJobCard job={job} score={result.score} band={result.band} distance={distance} />
 </li>
 ))}
 </ul>
 ) : (
 <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-5 text-center dark:border-zinc-700 dark:bg-zinc-950/50">
 <Briefcase size={20} className="mx-auto text-zinc-400" />
 <p className="mt-2 text-[13px] text-zinc-600 dark:text-zinc-400">
 No strong matches yet. Browse all openings and your scores will refine as employers post.
 </p>
 <Link
 to="/candidate/jobs"
 className="mt-3 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm"
 >
 Browse all jobs <ArrowRight size={12} />
 </Link>
 </div>
 )}
 </div>
 </motion.section>
 )}

 {/* Quick actions grid — every tile is a real, working destination.
 The profile tile flips between Build / Update based on hasResume;
 the subscription tile flips between Choose / Manage based on the
 active plan. Nothing is marked "soon" unless it truly isn't wired. */}
 <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <ActionCard
 variants={itemVariants}
 icon={hasResume ? <Edit3 size={20} /> : <ScrollText size={20} />}
 gradient="from-brand-500 to-amber-500"
 title={hasResume ? "Update profile" : "Build your profile"}
 desc={hasResume
 ? "Refresh your details, add new experience, or switch templates."
 : "Add your education, skills, and ambitions. No CV needed."}
 to="/candidate/profile/build"
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
 icon={<Briefcase size={20} />}
 gradient="from-amber-500 to-orange-500"
 title="My applications"
 desc="See all the roles you've applied for."
 to="/candidate/applications"
 />
 <ActionCard
 variants={itemVariants}
 icon={<CreditCard size={20} />}
 gradient="from-emerald-500 to-teal-500"
 title={activeSub ? "Manage subscription" : "Subscription"}
 desc={activeSub
 ? `Active plan · expires ${new Date(activeSub.expiresAt).toLocaleDateString()}`
 : "Apply for jobs with a ₹333 / 45-day plan."}
 to="/candidate/subscribe"
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
 const user = useAuth((s) => s.currentUser);
 const isSaved = useApplications((s) =>
 user ? (s.saved[user.id] ?? []).includes(job.id) : false,
 );
 const toggleSaveAsync = useApplications((s) => s.toggleSaveAsync);
 const onToggleSave = (e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (!user) return;
 void toggleSaveAsync(user.id, job.id).catch(() => { /* toast handled inside */ });
 };

 return (
 <div className="relative">
 <Link
 to={`/candidate/jobs/${job.id}`}
 className={[
 "group flex h-full flex-col rounded-xl border bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950/40",
 isSaved
 ? "border-rose-300 hover:border-rose-400 hover:shadow-rose-500/10 dark:border-rose-500/40"
 : "border-zinc-200 hover:border-brand-300 hover:shadow-brand-500/10 dark:border-zinc-800 dark:hover:border-brand-500/40",
 ].join(" ")}
 >
 {/* Header — logo + title/employer + match badge */}
 <div className="flex items-start gap-3">
 <div
 className={[
 "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold text-white shadow-sm",
 job.field === "it"
 ? "bg-gradient-to-br from-sky-500 to-sky-700"
 : "bg-gradient-to-br from-brand-500 to-brand-700",
 ].join(" ")}
 >
 {initials}
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
 {job.title}
 </h3>
 <p className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
 {job.employerName}
 </p>
 </div>
 <div className={["inline-flex shrink-0 items-baseline gap-0.5 rounded-md px-2 py-1", colors.bg].join(" ")}>
 <span className={["text-[13px] font-bold leading-none", colors.text].join(" ")}>{score}</span>
 <span className={["text-[10px] font-bold leading-none", colors.text].join(" ")}>%</span>
 </div>
 </div>

 {/* Meta rail — location, field, distance. Bigger icons, neutral text. */}
 <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-600 dark:text-zinc-400">
 <span className="inline-flex items-center gap-1">
 <MapPin size={12} className="text-zinc-400" />
 <span className="truncate">{job.location}</span>
 </span>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
 {FIELD_LABEL[job.field]}
 </span>
 {distance != null && (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
 <Navigation size={11} />
 {formatDistance(distance)}
 </span>
 </>
 )}
 </div>

 {/* Footer — salary (when present) + CTA */}
 <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
 <span className="truncate text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
 {job.salaryRange ?? "Salary not disclosed"}
 </span>
 <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 transition group-hover:gap-1.5 dark:text-brand-400">
 View
 <ArrowRight size={12} />
 </span>
 </div>
 </Link>
 {user && (
 <button
 type="button"
 onClick={onToggleSave}
 aria-pressed={isSaved}
 aria-label={isSaved ? "Remove from saved" : "Save this job"}
 title={isSaved ? "Click to remove from your saved list" : "Save this job for later"}
 className={[
 "absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90",
 isSaved
 ? "bg-rose-500 text-white shadow-sm shadow-rose-500/40 hover:bg-rose-600"
 : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-rose-500 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700",
 ].join(" ")}
 >
 <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 2.5 : 2} />
 </button>
 )}
 </div>
 );
}

/**
 * Subscription chip in the hero card's top-right. Free tier shows a faded
 * pill with an "Upgrade" CTA; active subscribers see a solid emerald pill
 * with the plan name and a "Manage" link.
 */
function SubscriptionBadge({ activeLabel }: { activeLabel?: string }) {
 if (activeLabel) {
 return (
 <Link
 to="/candidate/subscribe"
 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
 >
 <CreditCard size={12} />
 {activeLabel}
 <ArrowRight size={11} />
 </Link>
 );
 }
 return (
 <Link
 to="/candidate/subscribe"
 className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 dark:border-brand-500/30 dark:bg-zinc-900 dark:text-brand-300 dark:hover:bg-brand-500/10"
 >
 <CreditCard size={12} />
 Free tier
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="text-brand-600 dark:text-brand-400 group-hover:underline">Upgrade</span>
 <ArrowRight size={11} />
 </Link>
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
 className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:shadow-xl dark:bg-zinc-900"
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
 className="group flex flex-col rounded-3xl bg-white p-5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:shadow-xl disabled:cursor-not-allowed dark:bg-zinc-900"
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
