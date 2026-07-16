import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
 ArrowLeft,
 UserPlus,
 Trash2,
 Crown,
 Shield,
 AlertTriangle,
 Users2,
 ShieldOff,
 ShieldCheck as ShieldCheckIcon,
 RotateCcw,
 Eye,
 EyeOff,
 Copy,
 Check,
 KeyRound,
 X,
} from "lucide-react";
import { allUsers, useAuth, type User } from "../store/auth";
import { Navbar } from "../components/Navbar";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";
import { ApiError } from "../lib/api";
import { superAdminApi, type AdminAccount } from "../lib/api/admin";

/** Invite dropdown options. STAFF is routed locally (localStorage-first
 *  + CredentialShareModal); ADMIN / SUPER_ADMIN keep going through the
 *  server-side API. */
type InviteRole = "ADMIN" | "SUPER_ADMIN" | "STAFF";

/**
 * Super-admin-only page for managing the privileged accounts: list every
 * ADMIN + SUPER_ADMIN, invite a new one (the email gets a normal OTP on next
 * login), or revoke access (soft delete). Self-deletion is blocked server-side.
 */
export function SuperAdminAdmins() {
 // Sign-out + brand nav live in <Navbar />; this page just needs auth
 // context for the me?.id row-highlight check below.
 const me = useAuth((s) => s.currentUser);

 const createStaff = useAuth((s) => s.createStaff);
 const setDeactivated = useAuth((s) => s.setDeactivated);
 const resetSharedPassword = useAuth((s) => s.resetSharedPassword);
 const setSharedPassword = useAuth((s) => s.setSharedPassword);

 // Per-row reveal + copy state for the staff password. Keyed by user id
 // so revealing one row doesn't show every password on the page.
 const [revealedPwd, setRevealedPwd] = useState<Record<string, boolean>>({});
 const [copiedId, setCopiedId] = useState<string | null>(null);

 // Change-password modal state. `staffId` targets the row; `nextPwd` is
 // the working text; a fresh preview password auto-generates on open.
 const [changeTarget, setChangeTarget] = useState<User | null>(null);
 const [nextPwd, setNextPwd] = useState("");
 const [showNextPwd, setShowNextPwd] = useState(false);
 const [changeError, setChangeError] = useState<string | null>(null);

 const copyPwd = async (id: string, text: string) => {
   try {
     await navigator.clipboard.writeText(text);
     setCopiedId(id);
     setTimeout(() => setCopiedId(null), 1400);
   } catch {
     window.prompt("Copy manually:", text);
   }
 };

 const [items, setItems] = useState<AdminAccount[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 // Local staff list (localStorage-first; no server-side staff API yet).
 // Bumping `staffTick` after create/deactivate forces the derived list to
 // re-read from storage.
 const [staffTick, setStaffTick] = useState(0);
 const staffAccounts = useMemo(
   () => allUsers().filter((u): u is User => u.role === "staff"),
   // eslint-disable-next-line react-hooks/exhaustive-deps
   [staffTick],
 );

 // New admin/staff form state
 const [newName, setNewName] = useState("");
 const [newEmail, setNewEmail] = useState("");
 const [newMobile, setNewMobile] = useState("");
 const [newRole, setNewRole] = useState<InviteRole>("ADMIN");
 const [creating, setCreating] = useState(false);
 const [createError, setCreateError] = useState<string | null>(null);
 const [createSuccess, setCreateSuccess] = useState<string | null>(null);

 // Fresh staff credentials — populated after a STAFF invite OR a reset
 // so the same CredentialShareModal handles both flows. `flavor` toggles
 // the copy so a reset says "Password reset" instead of "Staff invited".
 const [freshStaffCreds, setFreshStaffCreds] = useState<{
   email: string;
   password: string;
   name: string;
   flavor: "invite" | "reset";
 } | null>(null);

 const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
 const [deleting, setDeleting] = useState<string | null>(null);
 const [deleteError, setDeleteError] = useState<string | null>(null);

 const refresh = async () => {
 setLoading(true);
 try {
 const { items } = await superAdminApi.listAdmins();
 setItems(items);
 setLoadError(null);
 } catch (err) {
 setLoadError(err instanceof Error ? err.message : "Failed to load admins");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { void refresh(); }, []);

 const onCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreateError(null);
 setCreateSuccess(null);
 if (!newName.trim()) return setCreateError("Name is required");
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return setCreateError("Enter a valid email");

 setCreating(true);
 try {
 if (newRole === "STAFF") {
   // Staff creation now hits the server — hashes the password (for
   // login) and stores plaintext (for reveal). Fresh creds come back
   // so we pop the one-time CredentialShareModal for hand-off.
   const { user, password } = await createStaff({
     name: newName.trim(),
     email: newEmail.trim(),
     mobile: newMobile.trim() || undefined,
   });
   setFreshStaffCreds({ email: user.email, password, name: user.name, flavor: "invite" });
   setCreateSuccess(`Invited staff ${user.email}. Copy the credentials from the sheet to hand off.`);
   setNewName("");
   setNewEmail("");
   setNewMobile("");
   setNewRole("ADMIN");
   setStaffTick((t) => t + 1);
   return;
 }
 const { user } = await superAdminApi.createAdmin({
 email: newEmail.trim(),
 name: newName.trim(),
 role: newRole,
 });
 setCreateSuccess(`Created ${user.role === "SUPER_ADMIN" ? "super admin" : "admin"} ${user.email}. They can now log in via the admin sign-in page.`);
 setNewName("");
 setNewEmail("");
 setNewMobile("");
 setNewRole("ADMIN");
 await refresh();
 } catch (err) {
 if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
 setCreateError("A user with that email already exists.");
 } else {
 setCreateError(err instanceof Error ? err.message : "Could not create admin.");
 }
 } finally {
 setCreating(false);
 }
 };

 const onDelete = async (id: string) => {
 setDeleting(id);
 setDeleteError(null);
 try {
 await superAdminApi.deleteAdmin(id);
 setConfirmingDelete(null);
 await refresh();
 } catch (err) {
 if (err instanceof ApiError && err.code === "CANNOT_DELETE_SELF") {
 setDeleteError("You can't delete your own account.");
 } else {
 setDeleteError(err instanceof Error ? err.message : "Could not delete admin.");
 }
 } finally {
 setDeleting(null);
 }
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <div className="mb-5 flex items-center justify-between gap-3">
 <Link to="/super-admin/dashboard" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Dashboard
 </Link>
 </div>

 <div className="mb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Privileged accounts</p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Admins & super admins</h1>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 Create new admin accounts here. They sign in via the same one-time email code flow as candidates — no separate password is set or shared.
 </p>
 </div>

 {/* Create form */}
 <motion.section
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-8 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900"
 >
 <div className="mb-4 flex items-center gap-2">
 <UserPlus size={16} className="text-violet-600 dark:text-violet-400" />
 <h2 className="text-base font-semibold tracking-tight">Invite an admin</h2>
 </div>
 <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
 <div>
 <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Full name</label>
 <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Priya Iyer" className="w-full rounded-lg bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800" />
 </div>
 <div>
 <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Email</label>
 <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="priya@yourcompany.com" inputMode="email" className="w-full rounded-lg bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800" />
 </div>
 <div>
 <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Role</label>
 <select value={newRole} onChange={(e) => setNewRole(e.target.value as InviteRole)} className="w-full rounded-lg bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
 <option value="ADMIN">Admin</option>
 <option value="SUPER_ADMIN">Super admin</option>
 <option value="STAFF">Staff (post jobs for employers)</option>
 </select>
 </div>
 <div className="flex items-end">
 <button type="submit" disabled={creating} className="inline-flex h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:shadow-lg disabled:opacity-60">
 <UserPlus size={14} /> {creating ? "Creating…" : "Invite"}
 </button>
 </div>
 </form>

 {/* Extra optional field: mobile — only relevant for staff invites,
     since admin auth is OTP-only and their mobile isn't used yet. */}
 {newRole === "STAFF" && (
 <div className="mt-3">
 <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
 Mobile (optional — for sharing credentials over the phone)
 </label>
 <input
   value={newMobile}
   onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
   placeholder="9876543210"
   inputMode="tel"
   className="w-full rounded-lg bg-white px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 />
 </div>
 )}
 {createError && (
 <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{createError}</p>
 )}
 {createSuccess && (
 <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">{createSuccess}</p>
 )}
 {newRole === "SUPER_ADMIN" && (
 <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
 <AlertTriangle size={12} className="mt-0.5 shrink-0" />
 <span>Super admins can create + delete other admins, including you. Only invite people you fully trust.</span>
 </div>
 )}
 {newRole === "STAFF" && (
 <div className="mt-3 flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-[11px] text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400">
 <Users2 size={12} className="mt-0.5 shrink-0" />
 <span>Staff post jobs on behalf of employers and manage the Employer Master. Sign-in is password-based (no OTP) — you'll see the password once and can share it manually.</span>
 </div>
 )}
 </motion.section>

 {/* Staff accounts (localStorage-first — no server-side staff API yet) */}
 <motion.section
   initial={{ opacity: 0, y: 10 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: 0.08 }}
   className="mb-8 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900"
 >
 <div className="mb-4 flex items-center gap-2">
 <Users2 size={16} className="text-teal-600 dark:text-teal-400" />
 <h2 className="text-base font-semibold tracking-tight">Staff accounts ({staffAccounts.length})</h2>
 </div>
 {staffAccounts.length === 0 ? (
 <p className="text-xs text-zinc-500 dark:text-zinc-400">
 No staff invited yet. Pick <strong>Staff</strong> in the role dropdown above to add one.
 </p>
 ) : (
 <ul className="flex flex-col gap-2">
 {staffAccounts.map((s) => {
   const revealed = !!revealedPwd[s.id];
   const copied = copiedId === s.id;
   return (
 <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-50/40 p-3 dark:bg-zinc-950/30">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
 <Users2 size={14} />
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{s.name}</p>
 <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{s.email}{s.mobile ? ` · ${s.mobile}` : ""}</p>
 {/* Password reveal + copy — inline on the row so super-admin
     can verify the current credential without having to Reset
     first (which was the "nothing changed" perception). */}
 {s.sharedPassword && (
 <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] shadow-sm dark:bg-zinc-950">
 <KeyRound size={10} className="text-zinc-400" />
 <span className={["font-mono text-[11px] tabular-nums", revealed ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 tracking-widest"].join(" ")}>
 {revealed ? s.sharedPassword : "••••••••••"}
 </span>
 <button
   type="button"
   onClick={() => setRevealedPwd((r) => ({ ...r, [s.id]: !r[s.id] }))}
   className="rounded p-0.5 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-300"
   title={revealed ? "Hide password" : "Reveal password"}
 >
   {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
 </button>
 <button
   type="button"
   onClick={() => copyPwd(s.id, s.sharedPassword!)}
   className="rounded p-0.5 text-zinc-400 transition hover:text-teal-600 dark:hover:text-teal-300"
   title="Copy password"
 >
   {copied ? <Check size={11} className="text-teal-600" /> : <Copy size={11} />}
 </button>
 </div>
 )}
 </div>
 <span className={[
   "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
   s.deactivated
     ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
     : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
 ].join(" ")}>
 {s.deactivated ? "Deactivated" : "Active"}
 </span>
 <button
   onClick={() => {
     setChangeTarget(s);
     // Prefill with the current password so the super-admin sees what
     // it is and can either type over it, or clear + type fresh.
     setNextPwd(s.sharedPassword ?? "");
     setChangeError(null);
     setShowNextPwd(true);
   }}
   title="Type a specific new password"
   className="inline-flex items-center gap-1.5 rounded-full border border-teal-300 px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-500/40 dark:text-teal-300 dark:hover:bg-teal-500/10"
 >
 <KeyRound size={11} /> Change
 </button>
 <button
   onClick={async () => {
     if (!confirm(`Generate a new password for ${s.name}? The old one stops working immediately, and their live session (if any) is dropped.`)) return;
     try {
       const password = await resetSharedPassword(s.id);
       setFreshStaffCreds({ email: s.email, password, name: s.name, flavor: "reset" });
       setStaffTick((t) => t + 1);
     } catch (err) {
       alert(err instanceof Error ? err.message : "Could not reset password.");
     }
   }}
   title="Auto-generate a fresh password and pop the share sheet"
   className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
 >
 <RotateCcw size={11} /> Reset
 </button>
 <button
   onClick={async () => {
     try {
       await setDeactivated(s.id, !s.deactivated);
       setStaffTick((t) => t + 1);
     } catch (err) {
       alert(err instanceof Error ? err.message : "Could not toggle account.");
     }
   }}
   title={s.deactivated ? "Reactivate this staff account" : "Deactivate — they can't sign in and their live session drops"}
   className={[
     "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
     s.deactivated
       ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
       : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10",
   ].join(" ")}
 >
 {s.deactivated ? <><ShieldCheckIcon size={11} /> Reactivate</> : <><ShieldOff size={11} /> Deactivate</>}
 </button>
 </li>
   );
 })}
 </ul>
 )}
 </motion.section>

 {/* Current admins */}
 <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className="mb-4 flex items-center justify-between gap-3">
 <h2 className="text-base font-semibold tracking-tight">Current admin accounts ({items.length})</h2>
 </div>

 {loadError && (
 <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{loadError}</p>
 )}
 {deleteError && (
 <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{deleteError}</p>
 )}

 {loading ? (
 <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
 ) : items.length === 0 ? (
 <p className="text-xs text-zinc-500 dark:text-zinc-400">No admin accounts yet. Invite one above.</p>
 ) : (
 <ul className="flex flex-col gap-2">
 {items.map((a) => {
 const isMe = a.id === me?.id;
 return (
 <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-50/40 p-3 dark:bg-zinc-950/30">
 <div className={["flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md", a.role === "SUPER_ADMIN" ? "bg-gradient-to-br from-violet-600 to-fuchsia-600" : "bg-gradient-to-br from-zinc-700 to-zinc-900"].join(" ")}>
 {a.role === "SUPER_ADMIN" ? <Crown size={14} /> : <Shield size={14} />}
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
 {a.name}
 {isMe && <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">You</span>}
 </p>
 <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{a.email}</p>
 </div>
 <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", a.role === "SUPER_ADMIN" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"].join(" ")}>
 {a.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
 </span>
 <p className="hidden text-[10px] text-zinc-500 dark:text-zinc-400 md:block">
 {a.lastSeenAt ? `Last seen ${new Date(a.lastSeenAt).toLocaleDateString()}` : "Never signed in"}
 </p>
 <button
 onClick={() => setConfirmingDelete(a.id)}
 disabled={isMe || deleting === a.id}
 title={isMe ? "You can't delete your own account" : "Revoke access"}
 className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
 >
 <Trash2 size={11} />
 </button>
 </li>
 );
 })}
 </ul>
 )}
 </motion.section>
 </main>

 {/* Change-password modal — super-admin types the exact password. */}
 <AnimatePresence>
 {changeTarget && (
 <motion.div
   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
   className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
   onClick={() => setChangeTarget(null)}
 >
 <motion.div
   initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
   onClick={(e) => e.stopPropagation()}
   className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
 >
 <div className="mb-4 flex items-start gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">
 <KeyRound size={16} />
 </div>
 <div className="min-w-0 flex-1">
 <h3 className="text-lg font-semibold tracking-tight">Change password</h3>
 <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">for {changeTarget.name} · {changeTarget.email}</p>
 </div>
 <button
   type="button"
   onClick={() => setChangeTarget(null)}
   className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
   aria-label="Close"
 >
 <X size={15} />
 </button>
 </div>
 <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">New password</label>
 <div className="relative">
 <input
   type={showNextPwd ? "text" : "password"}
   value={nextPwd}
   onChange={(e) => setNextPwd(e.target.value)}
   placeholder="Type a memorable password"
   autoFocus
   className="w-full rounded-lg bg-white px-4 py-3 pr-11 text-sm font-mono placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
 />
 <button
   type="button"
   onClick={() => setShowNextPwd((v) => !v)}
   className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
   aria-label={showNextPwd ? "Hide password" : "Show password"}
 >
 {showNextPwd ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
 Minimum 6 characters. This exact string becomes the sign-in password — no hashing, no email. Share it manually.
 </p>
 {changeError && (
 <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {changeError}
 </p>
 )}
 <div className="mt-5 flex justify-end gap-2">
 <button
   type="button"
   onClick={() => setChangeTarget(null)}
   className="rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 Cancel
 </button>
 <button
   type="button"
   onClick={async () => {
     const pwd = nextPwd.trim();
     if (pwd.length < 6) {
       setChangeError("Password must be at least 6 characters");
       return;
     }
     try {
       await setSharedPassword(changeTarget.id, pwd);
       const target = changeTarget;
       setChangeTarget(null);
       setNextPwd("");
       setStaffTick((t) => t + 1);
       // Pop the same share modal so super-admin has the copy-both
       // affordance for handing off to the staff member.
       setFreshStaffCreds({ email: target.email, password: pwd, name: target.name, flavor: "reset" });
     } catch (err) {
       setChangeError(err instanceof Error ? err.message : "Could not set password.");
     }
   }}
   className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
 >
 <Check size={14} /> Save password
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* One-time credential share — same modal for invite + reset flows, copy switches on flavor */}
 {freshStaffCreds && (
 <CredentialShareModal
   title={freshStaffCreds.flavor === "reset" ? "Password reset" : "Staff invited"}
   subtitle={
     freshStaffCreds.flavor === "reset"
       ? `New credentials for ${freshStaffCreds.name}`
       : `${freshStaffCreds.name} can now sign in at /staff/login`
   }
   email={freshStaffCreds.email}
   password={freshStaffCreds.password}
   onClose={() => setFreshStaffCreds(null)}
 />
 )}

 {/* Delete confirmation modal */}
 <AnimatePresence>
 {confirmingDelete && (
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
 onClick={() => setConfirmingDelete(null)}
 >
 <motion.div
 initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
 >
 <h3 className="text-lg font-semibold tracking-tight">Revoke admin access?</h3>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 The user keeps their account data but can no longer sign in to the admin panel. You can re-invite them with a fresh email later if needed.
 </p>
 <div className="mt-5 flex justify-end gap-2">
 <button onClick={() => setConfirmingDelete(null)} className="rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 Cancel
 </button>
 <button
 disabled={deleting === confirmingDelete}
 onClick={() => onDelete(confirmingDelete)}
 className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/30 disabled:opacity-60"
 >
 <Trash2 size={14} /> {deleting === confirmingDelete ? "Revoking…" : "Revoke access"}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
