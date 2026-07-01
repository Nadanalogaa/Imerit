import { useEffect, useMemo, useState } from "react";
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
 CheckCircle2,
 XCircle,
 Star,
 Calendar,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth, allUsers, type User } from "../store/auth";
import { useJobs, FIELD_LABEL, TYPE_LABEL } from "../store/jobs";
import { useApplications } from "../store/applications";
import { useProfile, type CandidateProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { matchScore, BAND_COLORS } from "../lib/matcher";
import { apiEnabled, ApiError } from "../lib/api";
import { employerJobsApi, type ApiApplicationStatus } from "../lib/api/jobs";
import { fromApiProfile } from "../store/profile";

type Applicant = { user: User; profile: CandidateProfile; appId: string; status: ApiApplicationStatus; matchScoreCached: number | null };

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

 /* ---------------- API-driven applicants ---------------- */
 const [apiApplicants, setApiApplicants] = useState<Applicant[] | null>(null);
 const [updatingId, setUpdatingId] = useState<string | null>(null);
 const [updateError, setUpdateError] = useState<string | null>(null);

 useEffect(() => {
 if (!apiEnabled || !id) return;
 let alive = true;
 employerJobsApi.applicants(id).then((res) => {
 if (!alive) return;
 const rows: Applicant[] = res.items.map((a) => {
 const u: User = {
 id: a.candidate.id, role: "candidate", name: a.candidate.name, email: a.candidate.email,
 mobile: a.candidate.mobile ?? undefined, emailVerified: true, createdAt: a.candidate.createdAt,
 };
 const p = a.profile ? fromApiProfile(a.profile as unknown as Parameters<typeof fromApiProfile>[0]) : profiles[a.candidate.id];
 return { user: u, profile: p ?? { userId: u.id, education: [], updatedAt: a.appliedAt }, appId: a.id, status: a.status, matchScoreCached: a.matchScore ?? null };
 });
 setApiApplicants(rows);
 }).catch(() => { /* fall back to local */ });
 return () => { alive = false; };
 }, [id]);

 // Local (legacy) computation in case API is off.
 const localApplicants: Applicant[] = useMemo(() => {
 if (!job) return [];
 return apps
 .filter((a) => a.jobId === job.id)
 .map((a) => {
 const user = allUsers().find((u) => u.id === a.userId);
 const profile = profiles[a.userId];
 const result = profile ? matchScore(job, profile) : null;
 if (!user || !profile) return null;
 return { user, profile, appId: a.id, status: "APPLIED" as ApiApplicationStatus, matchScoreCached: result?.score ?? null };
 })
 .filter((x): x is Applicant => !!x);
 }, [apps, profiles, job]);

 if (!job) return <Navigate to="/employer/my-jobs" replace />;
 if (job.employerId !== employer.id && !apiEnabled) return <Navigate to="/employer/dashboard" replace />;

 const list = apiApplicants ?? localApplicants;

 // Compute live match scores (or use the cached one if matcher fails).
 const applicants = list
 .map((a) => {
 const result = matchScore(job, a.profile);
 return { ...a, result };
 })
 .sort((a, b) => (b.result?.score ?? 0) - (a.result?.score ?? 0));

 const setStatus = async (appId: string, status: ApiApplicationStatus) => {
 if (!apiEnabled) return;
 setUpdatingId(appId);
 setUpdateError(null);
 try {
 await employerJobsApi.updateApplicationStatus(appId, status);
 setApiApplicants((cur) => cur?.map((a) => a.appId === appId ? { ...a, status } : a) ?? cur);
 } catch (err) {
 if (err instanceof ApiError) setUpdateError(err.message);
 else setUpdateError("Could not update status");
 } finally {
 setUpdatingId(null);
 }
 };

 const strongCount = applicants.filter((a) => a.result?.band === "high").length;
 const avgCount = applicants.filter((a) => a.result?.band === "medium").length;
 const shortlistedCount = applicants.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW" || a.status === "HIRED").length;

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <Link to="/employer/my-jobs" className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> My posted jobs
 </Link>

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 md:p-7">
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
 {apiEnabled && <Stat icon={<Star size={13} />} label="Shortlisted+" value={shortlistedCount} accent="emerald" />}
 </div>
 {updateError && (
 <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{updateError}</p>
 )}
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
 const isUpdating = updatingId === a.appId;
 return (
 <motion.div key={a.appId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }} className="flex flex-col gap-2">
 {hasSub ? (
 <Link to={`/employer/candidates/${a.user.id}`} className="block rounded-2xl bg-white p-4 transition hover:border-sky-300 hover:shadow-md dark:bg-zinc-900 dark:hover:border-sky-500/40">
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
 <div className="flex flex-wrap gap-1.5 px-1">
 {a.result.reasons.slice(0, 3).map((r, idx) => (
 <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
 ✓ {r}
 </span>
 ))}
 </div>
 )}
 {/* Pipeline status — only meaningful when API is on */}
 {apiEnabled && hasSub && (
 <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2 dark:bg-zinc-950/50">
 <StatusChip status={a.status} />
 <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Move to:</span>
 <PipeBtn label="Shortlist" status="SHORTLISTED" current={a.status} onClick={() => setStatus(a.appId, "SHORTLISTED")} disabled={isUpdating} icon={<Star size={11} />} accent="sky" />
 <PipeBtn label="Interview" status="INTERVIEW" current={a.status} onClick={() => setStatus(a.appId, "INTERVIEW")} disabled={isUpdating} icon={<Calendar size={11} />} accent="violet" />
 <PipeBtn label="Hire" status="HIRED" current={a.status} onClick={() => setStatus(a.appId, "HIRED")} disabled={isUpdating} icon={<CheckCircle2 size={11} />} accent="emerald" />
 <PipeBtn label="Reject" status="REJECTED" current={a.status} onClick={() => setStatus(a.appId, "REJECTED")} disabled={isUpdating} icon={<XCircle size={11} />} accent="rose" />
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

const STATUS_LABEL: Record<ApiApplicationStatus, string> = {
 APPLIED: "Applied",
 VIEWED: "Viewed",
 SHORTLISTED: "Shortlisted",
 INTERVIEW: "Interview",
 REJECTED: "Rejected",
 HIRED: "Hired",
 WITHDRAWN: "Withdrawn",
};
const STATUS_STYLE: Record<ApiApplicationStatus, string> = {
 APPLIED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
 VIEWED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
 SHORTLISTED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 INTERVIEW: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
 REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
 HIRED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
 WITHDRAWN: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatusChip({ status }: { status: ApiApplicationStatus }) {
 return (
 <span className={["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLE[status]].join(" ")}>
 {STATUS_LABEL[status]}
 </span>
 );
}

const PIPE_BTN_COLORS: Record<"sky" | "violet" | "emerald" | "rose", string> = {
 sky: "border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-500/30 dark:text-sky-300 dark:hover:bg-sky-500/10",
 violet: "border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-300 dark:hover:bg-violet-500/10",
 emerald: "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10",
 rose: "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10",
};

function PipeBtn({ label, status, current, onClick, disabled, icon, accent }: {
 label: string; status: ApiApplicationStatus; current: ApiApplicationStatus;
 onClick: () => void; disabled: boolean; icon: React.ReactNode; accent: keyof typeof PIPE_BTN_COLORS;
}) {
 const isCurrent = current === status;
 return (
 <button
 onClick={onClick}
 disabled={disabled || isCurrent}
 className={[
 "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40",
 isCurrent ? "border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : PIPE_BTN_COLORS[accent],
 ].join(" ")}
 >
 {icon} {label}
 </button>
 );
}
