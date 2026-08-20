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
 AlertTriangle,
 ShieldCheck,
} from "lucide-react";
import { useAuth } from "../store/auth";
import { useProfile, profileCompletion } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { Navbar } from "../components/Navbar";
import { TEMPLATE_META } from "../components/templates/types";

// Note: the previous "top matches" strip + <MatchedJobCard /> helper +
// its supporting imports (useMemo, MapPin, Navigation, Bookmark, Job,
// matcher, formatDistance, MIN/MAX_MATCH constants) were pulled out
// during a UI refresh — the render section no longer references them.
// Removed here so tsc's noUnusedLocals stops complaining after the
// pull; git history has the old implementation if it needs to come
// back.

export function CandidateDashboard() {
 const user = useAuth((s) => s.currentUser)!;
 const profile = useProfile((s) => s.get)(user.id);
 const hasResume = !!profile.selectedTemplateId;
 const completion = profileCompletion(profile);
 const templateMeta = TEMPLATE_META.find((t) => t.id === profile.selectedTemplateId);
 const firstName = user.name.split(" ")[0];
 const activeSub = useSubscriptions((s) => s.activeFor)(user.id, "candidate");

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
 Welcome Aboard
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
 Account {user.emailVerified ? "Verified" : "Pending"}
 </span>
 {hasResume ? (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
 <FileCheck2 size={14} className="text-emerald-500" />
 {templateMeta?.label ?? "Custom"} Template
 </span>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 {/* Moderation status pill — tells the candidate whether their
     profile is visible to employers, still under review, or needs
     work. Only rendered when we have a status from the API. */}
 <ModerationPill status={profile.moderationStatus} notes={profile.moderationNotes} />
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
 Profile — Start Now
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
 <Eye size={14} /> View Profile
 </Link>
 <Link
 to="/candidate/profile/build"
 className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <Edit3 size={14} /> Edit Profile
 </Link>
 </div>
 ) : (
 <Link
 to="/candidate/profile/build"
 className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
 >
 Build My Profile
 <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
 </Link>
 )}
 </div>
 </div>
 </motion.div>

 {/* Quick actions grid — every tile is a real, working destination.
 The profile tile flips between Build / Update based on hasResume;
 the subscription tile flips between Choose / Manage based on the
 active plan. Nothing is marked "soon" unless it truly isn't wired. */}
 <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <ActionCard
 variants={itemVariants}
 icon={hasResume ? <Edit3 size={20} /> : <ScrollText size={20} />}
 gradient="from-brand-500 to-amber-500"
 title={hasResume ? "Update Your Profile" : "Update Your Profile"}
 desc={hasResume
 ? "Keep your profile updated — we’ll highlight new jobs as employers post them."
 : "Edit your details, Add new experience, or switch templates"}
 to="/candidate/profile/build"
 />
 <ActionCard
 variants={itemVariants}
 icon={<Briefcase size={20} />}
 gradient="from-sky-500 to-cyan-500"
 title="Browse Jobs Now"
 desc="Discover the new Job Openings"
 to="/candidate/jobs"
 />
 <ActionCard
 variants={itemVariants}
 icon={<Heart size={20} />}
 gradient="from-rose-500 to-pink-500"
 title="Saved Jobs"
 desc="Your Bookmarked Jobs — Revisit and Apply"
 to="/candidate/saved"
 />
 <ActionCard
 variants={itemVariants}
 icon={<Briefcase size={20} />}
 gradient="from-amber-500 to-orange-500"
 title="My Applications"
 desc="View the Applied Jobs"
 to="/candidate/applications"
 />
 <ActionCard
 variants={itemVariants}
 icon={<CreditCard size={20} />}
 gradient="from-emerald-500 to-teal-500"
 title={activeSub ? "Manage Subscription" : "Subscription"}
 desc={activeSub
 ? `Active plan · expires ${new Date(activeSub.expiresAt).toLocaleDateString()}`
 : "Apply for Jobs with a plan of Rs.333 / 45 days / Unlimited Access"}
 to="/candidate/subscribe"
 />
 <ActionCard
 variants={itemVariants}
 icon={<Sparkles size={20} />}
 gradient="from-indigo-500 to-purple-500"
 title="Recruiter’s Task"
 desc="Upon Subscription, Our Recruiters Will Start Searching for Suitable Jobs for You and Contact You Soon."
 soon
 />
 </motion.div>

 <motion.p variants={itemVariants} className="text-center text-xs text-zinc-500 dark:text-zinc-400">
 Job search is always free. Subscribe only when you find a suitable job from the available vacancies
 </motion.p>
 </motion.div>
 </main>
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
 Free Tier
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

/**
 * Small colored pill showing the candidate's moderation state so they
 * understand whether they're visible to employers, still waiting on
 * review, or need to update. Falls back gracefully if the status isn't
 * known yet (e.g. offline mode or a fresh signup that hasn't hit the API).
 */
function ModerationPill({
 status,
 notes,
}: {
 status?: "PENDING" | "APPROVED" | "REJECTED";
 notes?: string | null;
}) {
 if (!status) return null;
 if (status === "APPROVED") {
 return (
 <span
 className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
 title="Employers can find you in searches."
 >
 <ShieldCheck size={12} />
 Approved · Visible to Employers
 </span>
 );
 }
 if (status === "REJECTED") {
 return (
 <span
 className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
 title={notes ?? "Please review the feedback and resubmit."}
 >
 <AlertTriangle size={12} />
 Needs Update — See Email
 </span>
 );
 }
 // PENDING (default)
 return (
 <span
 className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
 title="Our team is reviewing your profile. You'll be visible to employers once approved."
 >
 <Clock size={12} />
 Under Review
 </span>
 );
}