import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
 ArrowLeft,
 Trash2,
 Trash,
 RotateCcw,
 Users2,
 Building2,
 UserRound,
 UserCog,
 Shield,
 Crown,
 CheckSquare,
 Square,
 RefreshCw,
 Flame,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiEnabled, ApiError } from "../lib/api";
import { trashApi, type ApiUserRole, type TrashUser } from "../lib/api/admin";

type RoleFilter = "ALL" | ApiUserRole | "STAFF";

const ROLE_TABS: { key: RoleFilter; label: string; icon: React.ReactNode }[] = [
 { key: "ALL", label: "All", icon: <Users2 size={14} /> },
 { key: "CANDIDATE", label: "Candidates", icon: <UserRound size={14} /> },
 { key: "EMPLOYER", label: "Employers", icon: <Building2 size={14} /> },
 { key: "STAFF", label: "Staff", icon: <UserCog size={14} /> },
 { key: "ADMIN", label: "Admins", icon: <Shield size={14} /> },
 { key: "SUPER_ADMIN", label: "Super admins", icon: <Crown size={14} /> },
];

const ROLE_BADGE: Record<string, string> = {
 CANDIDATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
 EMPLOYER: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 STAFF: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
 ADMIN: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
 SUPER_ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

type Modal = null | "restore" | "purge" | "empty";

export function SuperAdminTrash() {
 const [tab, setTab] = useState<RoleFilter>("ALL");
 const [items, setItems] = useState<TrashUser[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [modal, setModal] = useState<Modal>(null);
 const [busy, setBusy] = useState(false);
 const [flash, setFlash] = useState<string | null>(null);
 const [refreshTick, setRefreshTick] = useState(0);

 useEffect(() => { setSelected(new Set()); }, [tab]);

 useEffect(() => {
 if (!apiEnabled) return;
 let alive = true;
 setLoading(true);
 setError(null);
 trashApi
 .list(tab === "ALL" ? undefined : (tab as ApiUserRole | "STAFF"))
 .then((res) => { if (alive) setItems(res.items); })
 .catch((err) => {
 if (!alive) return;
 if (err instanceof ApiError && err.status === 403) {
 setError("Only super-admins can view the trash.");
 } else {
 setError(err instanceof Error ? err.message : "Failed to load trash");
 }
 })
 .finally(() => alive && setLoading(false));
 return () => { alive = false; };
 }, [tab, refreshTick]);

 const selectedItems = useMemo(
 () => items.filter((u) => selected.has(u.id)),
 [items, selected],
 );

 const allSelected = items.length > 0 && items.every((u) => selected.has(u.id));

 const toggleAll = () => {
 const next = new Set(selected);
 if (allSelected) items.forEach((u) => next.delete(u.id));
 else items.forEach((u) => next.add(u.id));
 setSelected(next);
 };

 const toggleOne = (id: string) => {
 const next = new Set(selected);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 setSelected(next);
 };

 const doRestore = async () => {
 setBusy(true);
 try {
 const ids = Array.from(selected);
 const res = ids.length === 1
 ? await trashApi.restore(ids[0]!).then(() => ({ succeeded: 1, failed: 0 }))
 : await trashApi.bulkRestore(ids);
 setFlash(`Restored ${res.succeeded} user${res.succeeded === 1 ? "" : "s"}${res.failed ? ` · ${res.failed} failed` : ""}.`);
 setSelected(new Set());
 setModal(null);
 setRefreshTick((n) => n + 1);
 } catch (err) {
 setFlash(err instanceof Error ? err.message : "Restore failed");
 } finally {
 setBusy(false);
 setTimeout(() => setFlash(null), 5000);
 }
 };

 const doPurge = async () => {
 setBusy(true);
 try {
 const ids = Array.from(selected);
 const res = ids.length === 1
 ? await trashApi.purge(ids[0]!).then(() => ({ succeeded: 1, failed: 0 }))
 : await trashApi.bulkPurge(ids);
 setFlash(`Permanently deleted ${res.succeeded} user${res.succeeded === 1 ? "" : "s"}${res.failed ? ` · ${res.failed} failed` : ""}. Emails are now free for re-registration.`);
 setSelected(new Set());
 setModal(null);
 setRefreshTick((n) => n + 1);
 } catch (err) {
 setFlash(err instanceof Error ? err.message : "Purge failed");
 } finally {
 setBusy(false);
 setTimeout(() => setFlash(null), 7000);
 }
 };

 const doEmpty = async () => {
 setBusy(true);
 try {
 const res = await trashApi.emptyTrash();
 setFlash(`Emptied trash · ${res.succeeded} permanently deleted${res.failed ? ` · ${res.failed} failed` : ""}.`);
 setSelected(new Set());
 setModal(null);
 setRefreshTick((n) => n + 1);
 } catch (err) {
 setFlash(err instanceof Error ? err.message : "Empty trash failed");
 } finally {
 setBusy(false);
 setTimeout(() => setFlash(null), 7000);
 }
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-10">
 <Link
 to="/super-admin/dashboard"
 className="mb-4 inline-flex items-center gap-2 text-lg font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
 >
 <ArrowLeft size={20} /> Dashboard
 </Link>

 <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
 <div>
 <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-zinc-500/15 to-zinc-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
 <Trash2 size={13} /> Recycle Bin
 </p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Trash</h1>
 <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
 Users here can't log in and their email is locked. Restore to bring them back, or purge to permanently delete and free the email.
 </p>
 </div>
 <div className="flex gap-2">
 <Link
 to="/super-admin/users"
 className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <Users2 size={15} /> Manage Users
 </Link>
 <button
 type="button"
 onClick={() => setModal("empty")}
 disabled={items.length === 0}
 className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
 >
 <Flame size={15} /> Empty Trash
 </button>
 </div>
 </div>

 <div className="mb-4 flex flex-wrap gap-1.5">
 {ROLE_TABS.map((t) => (
 <button
 key={t.key}
 type="button"
 onClick={() => setTab(t.key)}
 className={[
 "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
 tab === t.key
 ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
 : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
 ].join(" ")}
 >
 {t.icon}
 {t.label}
 </button>
 ))}
 <button
 type="button"
 onClick={() => setRefreshTick((n) => n + 1)}
 className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
 title="Refresh"
 >
 <RefreshCw size={13} /> Refresh
 </button>
 </div>

 {selected.size > 0 ? (
 <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
 <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
 {selected.size} selected
 </span>
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => setSelected(new Set())}
 className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-200 dark:hover:bg-amber-500/20"
 >
 Clear
 </button>
 <button
 type="button"
 onClick={() => setModal("restore")}
 className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
 >
 <RotateCcw size={13} /> Restore
 </button>
 <button
 type="button"
 onClick={() => setModal("purge")}
 className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
 >
 <Trash size={13} /> Purge Forever
 </button>
 </div>
 </div>
 ) : null}

 {flash ? (
 <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
 {flash}
 </div>
 ) : null}

 {error ? (
 <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
 {error}
 </div>
 ) : null}

 <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
 <div className="overflow-x-auto">
 <table className="min-w-full text-sm">
 <thead>
 <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
 <th className="w-10 px-4 py-3">
 <button type="button" onClick={toggleAll} aria-label="Select all">
 {allSelected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
 </button>
 </th>
 <th className="px-4 py-3">Name</th>
 <th className="px-4 py-3">Email</th>
 <th className="px-4 py-3">Role</th>
 <th className="px-4 py-3">Deleted</th>
 <th className="w-40 px-4 py-3 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
 {loading ? (
 <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">Loading…</td></tr>
 ) : items.length === 0 ? (
 <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">The trash is empty.</td></tr>
 ) : items.map((u) => {
 const isSel = selected.has(u.id);
 return (
 <tr key={u.id} className={isSel ? "bg-rose-50/40 dark:bg-rose-500/5" : ""}>
 <td className="px-4 py-3">
 <button type="button" onClick={() => toggleOne(u.id)} aria-label="Select row">
 {isSel ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} className="text-zinc-400" />}
 </button>
 </td>
 <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
 {u.name}
 {u.employerProfile?.companyName ? (
 <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
 · {u.employerProfile.companyName}
 </span>
 ) : null}
 </td>
 <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{u.email}</td>
 <td className="px-4 py-3">
 <span className={["inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider", ROLE_BADGE[u.role] ?? "bg-zinc-100 text-zinc-700"].join(" ")}>
 {u.role.replace("_", " ")}
 </span>
 </td>
 <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
 {new Date(u.deletedAt).toLocaleString()}
 </td>
 <td className="px-4 py-3 text-right">
 <div className="inline-flex gap-1">
 <button
 type="button"
 onClick={() => { setSelected(new Set([u.id])); setModal("restore"); }}
 className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-300 dark:hover:bg-emerald-500/10"
 >
 <RotateCcw size={12} /> Restore
 </button>
 <button
 type="button"
 onClick={() => { setSelected(new Set([u.id])); setModal("purge"); }}
 className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
 >
 <Trash size={12} /> Purge
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </main>

 <ConfirmDialog
 open={modal === "restore"}
 title="Restore users?"
 message={<><strong>{selectedItems.length}</strong> user{selectedItems.length === 1 ? "" : "s"} will be restored and can log in again.</>}
 items={selectedItems.map((u) => `${u.name} — ${u.email} (${u.role})`)}
 confirmLabel={busy ? "Restoring…" : "Restore"}
 tone="neutral"
 busy={busy}
 onConfirm={doRestore}
 onClose={() => (busy ? undefined : setModal(null))}
 />

 <ConfirmDialog
 open={modal === "purge"}
 title="Permanently delete?"
 message={
 <>
 This <strong>cannot be undone</strong>. <strong>{selectedItems.length}</strong> user{selectedItems.length === 1 ? "" : "s"} plus all their profiles, jobs, applications, subscriptions, and other data will be permanently removed.
 </>
 }
 detail="After purge, the email is freed and can be used to register a fresh account."
 items={selectedItems.map((u) => `${u.name} — ${u.email} (${u.role})`)}
 confirmLabel={busy ? "Purging…" : "Delete forever"}
 tone="danger"
 requireTyped="DELETE"
 busy={busy}
 onConfirm={doPurge}
 onClose={() => (busy ? undefined : setModal(null))}
 />

 <ConfirmDialog
 open={modal === "empty"}
 title="Empty trash?"
 message={
 <>
 Everything in the trash — <strong>{items.length}</strong> user{items.length === 1 ? "" : "s"} — will be <strong>permanently deleted</strong> along with all cascaded data.
 </>
 }
 detail="This cannot be undone. All associated emails will be freed for re-registration."
 confirmLabel={busy ? "Emptying…" : "Empty trash"}
 tone="danger"
 requireTyped="EMPTY"
 busy={busy}
 onConfirm={doEmpty}
 onClose={() => (busy ? undefined : setModal(null))}
 />
 </div>
 );
}
