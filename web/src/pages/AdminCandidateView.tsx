import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, FileType2, Mail, Phone, XCircle, Clock, NotebookPen } from "lucide-react";
import { allUsers, type User } from "../store/auth";
import { fromApiProfile, useProfile, type CandidateProfile } from "../store/profile";
import { RenderTemplate } from "../components/templates";
import { Header } from "./AdminCandidates";
import { apiEnabled, ApiError } from "../lib/api";
import { profileApi } from "../lib/api/profile";
import { adminApi } from "../lib/api/admin";

type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ApiBundle {
 user: User;
 profile: CandidateProfile;
 moderationStatus: ModerationStatus;
 moderationNotes: string | null;
}

export function AdminCandidateView() {
 const { id } = useParams<{ id: string }>();
 const profiles = useProfile((s) => s.byUser);

 const localCandidate = allUsers().find((u) => u.id === id);
 const localProfile = id ? profiles[id] : undefined;

 const [apiData, setApiData] = useState<ApiBundle | null>(null);
 const [loading, setLoading] = useState<boolean>(apiEnabled);
 const [loadError, setLoadError] = useState<string | null>(null);
 const [moderating, setModerating] = useState(false);
 const [modSuccess, setModSuccess] = useState<string | null>(null);
 const [modError, setModError] = useState<string | null>(null);
 const [confirmModal, setConfirmModal] = useState<null | "APPROVED" | "REJECTED">(null);
 const [notesDraft, setNotesDraft] = useState("");

 useEffect(() => {
 if (!apiEnabled || !id) return;
 let alive = true;
 setLoading(true);
 profileApi
 .getByUserId(id)
 .then(({ profile }) => {
 if (!alive) return;
 const user: User = {
 id: profile.user.id,
 role: profile.user.role.toLowerCase() as User["role"],
 name: profile.user.name,
 email: profile.user.email,
 mobile: profile.user.mobile ?? undefined,
 emailVerified: true,
 createdAt: profile.user.createdAt,
 };
 setApiData({
 user,
 profile: fromApiProfile(profile),
 moderationStatus: profile.moderationStatus,
 moderationNotes: profile.moderationNotes,
 });
 setLoadError(null);
 })
 .catch((err) => {
 if (!alive) return;
 if (err instanceof ApiError && err.status === 404) setLoadError("Profile not found on the server.");
 else setLoadError(err instanceof Error ? err.message : "Failed to load profile");
 })
 .finally(() => {
 if (alive) setLoading(false);
 });
 return () => { alive = false; };
 }, [id]);

 // Pick the best available source — API trumps local cache.
 const candidate = apiData?.user ?? localCandidate;
 const profile = apiData?.profile ?? localProfile;
 const moderationStatus: ModerationStatus = apiData?.moderationStatus ?? "PENDING";

 if (apiEnabled && loading) {
 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Header title="Candidate" />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
 Loading profile from the server…
 </main>
 </div>
 );
 }
 if (apiEnabled && loadError) {
 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Header title="Candidate" />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-10 text-center">
 <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{loadError}</p>
 <Link to="/admin/candidates" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
 <ArrowLeft size={12} /> Back to candidates
 </Link>
 </main>
 </div>
 );
 }
 if (!candidate || candidate.role !== "candidate" || !profile?.selectedTemplateId) {
 return <Navigate to="/admin/candidates" replace />;
 }

 const printPdf = () => window.print();

 const openConfirm = (status: "APPROVED" | "REJECTED") => {
 setNotesDraft(apiData?.moderationNotes ?? "");
 setModError(null);
 setModSuccess(null);
 setConfirmModal(status);
 };

 const submitModeration = async () => {
 if (!apiEnabled || !id || !confirmModal) return;
 const status = confirmModal;
 const notes = notesDraft.trim();
 if (status === "REJECTED" && !notes) {
 setModError("Add a short reason — rejection notes are required so the candidate can fix the issue.");
 return;
 }
 setModerating(true);
 setModError(null);
 try {
 await adminApi.moderateProfile(id, { status, notes: notes || undefined });
 setApiData((cur) => cur ? { ...cur, moderationStatus: status, moderationNotes: notes || null } : cur);
 setModSuccess(status === "APPROVED" ? "Profile approved." : "Profile rejected.");
 setConfirmModal(null);
 } catch (err) {
 if (err instanceof ApiError && err.status === 403) {
 setModError("Only ADMIN or SUPER_ADMIN can moderate. Sign in as admin.");
 } else {
 setModError(err instanceof Error ? err.message : "Moderation failed.");
 }
 } finally {
 setModerating(false);
 }
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Header title="Candidate" />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
 <div className="flex items-center gap-2">
 <Link to="/admin/candidates" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Candidates
 </Link>
 <StatusBadge status={moderationStatus} />
 </div>
 <div className="flex flex-wrap gap-2">
 {candidate.email && (
 <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <Mail size={12} /> Email
 </a>
 )}
 {candidate.mobile && (
 <a href={`tel:+91${candidate.mobile}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <Phone size={12} /> Call
 </a>
 )}
 <button onClick={printPdf} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-500/30">
 <FileType2 size={12} /> Print / Save as PDF
 </button>
 </div>
 </div>

 {apiEnabled && (
 <div className="mb-5 rounded-2xl bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 print:hidden">
 <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
 <div className="text-xs text-zinc-600 dark:text-zinc-400">
 {moderationStatus === "PENDING" ? "Awaiting moderation." : `Moderation status: ${moderationStatus}.`}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <button
 disabled={moderating || moderationStatus === "APPROVED"}
 onClick={() => openConfirm("APPROVED")}
 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg disabled:opacity-60"
 >
 <CheckCircle2 size={12} /> Approve
 </button>
 <button
 disabled={moderating || moderationStatus === "REJECTED"}
 onClick={() => openConfirm("REJECTED")}
 className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-500/30 transition hover:shadow-lg disabled:opacity-60"
 >
 <XCircle size={12} /> Reject
 </button>
 </div>
 </div>
 {apiData?.moderationNotes && (
 <div className="border-t border-zinc-200 px-4 py-3 ">
 <div className="flex items-start gap-2">
 <NotebookPen size={12} className="mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Moderation notes</p>
 <p className="mt-0.5 text-xs italic text-zinc-700 dark:text-zinc-300">{apiData.moderationNotes}</p>
 </div>
 </div>
 </div>
 )}
 </div>
 )}
 {modSuccess && (
 <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 print:hidden dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
 {modSuccess}
 </p>
 )}
 {modError && (
 <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 print:hidden dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {modError}
 </p>
 )}

 <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-200/40 print:shadow-none dark:shadow-black/50">
 <RenderTemplate id={profile.selectedTemplateId} user={candidate} profile={profile} />
 </motion.div>
 </main>

 {/* Approve / Reject confirmation modal */}
 <AnimatePresence>
 {confirmModal && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden"
 onClick={() => !moderating && setConfirmModal(null)}
 >
 <motion.div
 initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
 >
 <div className="mb-3 flex items-center gap-2">
 {confirmModal === "APPROVED" ? (
 <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
 <CheckCircle2 size={16} />
 </span>
 ) : (
 <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
 <XCircle size={16} />
 </span>
 )}
 <h3 className="text-lg font-semibold tracking-tight">
 {confirmModal === "APPROVED" ? "Approve this profile?" : "Reject this profile?"}
 </h3>
 </div>
 <p className="text-sm text-zinc-600 dark:text-zinc-400">
 {confirmModal === "APPROVED"
 ? "The candidate will be visible to employers searching for this skill set."
 : "The candidate will see your notes so they can fix the issue and resubmit."}
 </p>

 <label className="mt-4 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
 Moderation notes {confirmModal === "REJECTED" ? <span className="text-rose-600 dark:text-rose-400">(required)</span> : <span className="text-zinc-500">(optional)</span>}
 </label>
 <textarea
 value={notesDraft}
 onChange={(e) => setNotesDraft(e.target.value)}
 rows={3}
 placeholder={
 confirmModal === "APPROVED"
 ? "e.g. Verified by HR; clear profile."
 : "e.g. Photo is too small / education year missing."
 }
 className="mt-1 w-full rounded-lg bg-white p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 />

 {modError && (
 <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {modError}
 </p>
 )}

 <div className="mt-5 flex justify-end gap-2">
 <button
 onClick={() => !moderating && setConfirmModal(null)}
 disabled={moderating}
 className="rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 Cancel
 </button>
 <button
 onClick={submitModeration}
 disabled={moderating}
 className={[
 "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white shadow-md transition disabled:opacity-60",
 confirmModal === "APPROVED"
 ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30"
 : "bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30",
 ].join(" ")}
 >
 {confirmModal === "APPROVED" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
 {moderating ? "Saving…" : confirmModal === "APPROVED" ? "Approve" : "Reject"}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

function StatusBadge({ status }: { status: ModerationStatus }) {
 const cfg = {
 PENDING: { Icon: Clock, label: "Pending", bg: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", ring: "ring-amber-300/40" },
 APPROVED: { Icon: CheckCircle2, label: "Approved", bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", ring: "ring-emerald-300/40" },
 REJECTED: { Icon: XCircle, label: "Rejected", bg: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", ring: "ring-rose-300/40" },
 }[status];
 return (
 <span className={["inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1", cfg.bg, cfg.ring].join(" ")}>
 <cfg.Icon size={10} /> {cfg.label}
 </span>
 );
}
