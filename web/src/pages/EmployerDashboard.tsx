import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
 Sparkles,
 Search,
 Briefcase,
 CreditCard,
 CheckCircle2,
 Clock,
 Building2,
 ShieldCheck,
 ArrowRight,
 AlertTriangle,
} from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { useJobs, daysUntilExpiry, isExpired } from "../store/jobs";
import { Navbar } from "../components/Navbar";

export function EmployerDashboard() {
 const user = useAuth((s) => s.currentUser)!;
 const allProfiles = useProfile((s) => s.byUser);
 const totalCandidates = Object.values(allProfiles).filter((p) => p.selectedTemplateId).length;
 const totalRegistered = allUsers().filter((u) => u.role === "candidate").length;
 const sub = useSubscriptions((s) =>
 s.activeFor(user.id, "employer_sme") ?? s.activeFor(user.id, "employer_large")
 );
 const myJobs = useJobs((s) => s.postedBy)(user.id);
 const firstName = user.name.split(" ")[0];

 // Aggregate posting stats — active count + soonest-expiring live job.
 const activeJobs = myJobs.filter((j) => !isExpired(j));
 const expiredJobs = myJobs.length - activeJobs.length;
 const soonest = activeJobs
 .map((j) => ({ job: j, days: daysUntilExpiry(j) }))
 .filter((x): x is { job: typeof x.job; days: number } => x.days !== null)
 .sort((a, b) => a.days - b.days)[0];

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
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-6">

 {/* Unified compact banner — mirrors the candidate dashboard's
 style (small eyebrow, one-line status rail, subscription pill
 top-right, action buttons on the right). Sky tone instead of
 brand orange so employers and candidates stay visually distinct. */}
 <motion.div
 variants={itemVariants}
 className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-sky-50/40 p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:from-zinc-900 dark:via-zinc-900 dark:to-sky-500/5 md:p-6"
 >
 <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-sky-400/20 to-cyan-400/10 blur-3xl" />

 <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
 {/* LEFT — greeting + identity + status rail */}
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500/10 to-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
 <Sparkles size={11} />
 Employer dashboard
 </span>
 </div>

 <h1 className="mt-1.5 flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-3xl">
 Hello {firstName}
 <motion.span animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }} transition={{ duration: 1.5, ease: "easeInOut", repeat: 1, repeatDelay: 1 }} className="inline-block">👋</motion.span>
 </h1>

 {/* Status rail — Account · Company · Jobs · Soonest expiry */}
 <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
 <span className={["inline-flex items-center gap-1.5 font-semibold", user.emailVerified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"].join(" ")}>
 {user.emailVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
 Account {user.emailVerified ? "verified" : "pending"}
 </span>
 {user.company && (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
 <Building2 size={14} className="text-sky-500" />
 {user.company}
 </span>
 </>
 )}
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 {myJobs.length === 0 ? (
 <Link
 to="/employer/jobs/new"
 className="inline-flex items-center gap-1.5 font-semibold text-sky-600 underline-offset-2 transition hover:underline dark:text-sky-400"
 >
 <Briefcase size={14} />
 Post your first job
 <ArrowRight size={13} />
 </Link>
 ) : (
 <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-200">
 <Briefcase size={14} className="text-emerald-500" />
 {activeJobs.length} live {activeJobs.length === 1 ? "job" : "jobs"}
 {expiredJobs > 0 && <span className="text-zinc-400"> · {expiredJobs} expired</span>}
 </span>
 )}
 {soonest && soonest.days <= 7 && (
 <>
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
 <AlertTriangle size={14} />
 {soonest.job.title} expires in {soonest.days}d
 </span>
 </>
 )}
 </div>
 </div>

 {/* RIGHT — subscription pill (top) + primary action buttons */}
 <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
 <EmployerSubscriptionBadge activeLabel={sub?.planId.replace("plan_", "")} expiresAt={sub?.expiresAt} />
 <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
 <Link
 to="/employer/jobs/new"
 className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-700 px-4 py-2 text-[13px] font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:shadow-md"
 >
 <Briefcase size={14} /> Post a job
 </Link>
 <Link
 to="/employer/my-jobs"
 className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 My jobs
 </Link>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Quick actions */}
 <motion.div variants={containerVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <ActionCard
 variants={itemVariants}
 icon={<Search size={20} />}
 gradient="from-sky-500 to-cyan-500"
 title="Search candidates"
 desc={sub ? `Browse all ${totalRegistered} profiles + view full CVs.` : `Browse ${totalCandidates} profiles. Subscribe to view full CVs.`}
 to="/employer/candidates"
 />
 <ActionCard
 variants={itemVariants}
 icon={<Briefcase size={20} />}
 gradient="from-violet-500 to-fuchsia-500"
 title="Post a job"
 desc="Job posting is always free. Listing stays live for 45 days."
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

/**
 * Compact subscription pill — mirrors the candidate dashboard's badge style.
 * Free tier shows a soft brand outline with "Upgrade" call-to-action;
 * an active subscription shows a solid emerald pill with the plan name and
 * days remaining, matching the candidate variant's visual language.
 */
function EmployerSubscriptionBadge({ activeLabel, expiresAt }: { activeLabel?: string; expiresAt?: string }) {
 if (activeLabel && expiresAt) {
 const daysLeft = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
 return (
 <Link
 to="/employer/subscribe"
 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
 >
 <CreditCard size={12} />
 {activeLabel}
 <span className="text-white/80">· {daysLeft}d left</span>
 </Link>
 );
 }
 return (
 <Link
 to="/employer/subscribe"
 className="group inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 dark:border-sky-500/30 dark:bg-zinc-900 dark:text-sky-300 dark:hover:bg-sky-500/10"
 >
 <CreditCard size={12} />
 Free tier
 <span className="text-zinc-300 dark:text-zinc-700">·</span>
 <span className="text-sky-600 dark:text-sky-400 group-hover:underline">Upgrade</span>
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
 <Link to={to} className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:shadow-xl dark:bg-zinc-900">
 {inner}
 </Link>
 </motion.div>
 );
 }
 return (
 <motion.button variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} disabled={soon} className="group flex flex-col rounded-3xl bg-white p-5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:shadow-xl disabled:cursor-not-allowed dark:bg-zinc-900">
 {inner}
 </motion.button>
 );
}
