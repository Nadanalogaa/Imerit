import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
 ArrowLeft,
 Trash2,
 Search,
 Users2,
 UserCog,
 Building2,
 UserRound,
 Shield,
 Crown,
 CheckSquare,
 Square,
 ChevronLeft,
 ChevronRight,
 RefreshCw,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { apiEnabled, ApiError } from "../lib/api";
import {
 adminApi,
 trashApi,
 type AdminUserListItem,
 type ApiUserRole,
} from "../lib/api/admin";

const PAGE_SIZE = 25;

type RoleFilter = "ALL" | ApiUserRole | "STAFF";

const ROLE_TABS: { key: RoleFilter; label: string; icon: React.ReactNode }[] = [
 { key: "ALL", label: "All Users", icon: <Users2 size={14} /> },
 { key: "CANDIDATE", label: "Candidates", icon: <UserRound size={14} /> },
 { key: "EMPLOYER", label: "Employers", icon: <Building2 size={14} /> },
 { key: "STAFF", label: "Staff", icon: <UserCog size={14} /> },
 { key: "ADMIN", label: "Admins", icon: <Shield size={14} /> },
 { key: "SUPER_ADMIN", label: "Super Admins", icon: <Crown size={14} /> },
];

const ROLE_BADGE: Record<string, string> = {
 CANDIDATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
 EMPLOYER: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 STAFF: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
 ADMIN: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
 SUPER_ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

export function SuperAdminUsers() {
 const [tab, setTab] = useState<RoleFilter>("ALL");
 const [search, setSearch] = useState("");
 const [searchDebounced, setSearchDebounced] = useState("");
 const [page, setPage] = useState(1);

 const [items, setItems] = useState<AdminUserListItem[]>([]);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [selected, setSelected] = useState<Set<string>>(new Set());
 const [confirmOpen, setConfirmOpen] = useState(false);
 const [busy, setBusy] = useState(false);
 const [flash, setFlash] = useState<string | null>(null);
 const [refreshTick, setRefreshTick] = useState(0);

 useEffect(() => {
 const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
 return () => clearTimeout(t);
 }, [search]);

 useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, searchDebounced]);

 useEffect(() => {
 if (!apiEnabled) return;
 let alive = true;
 setLoading(true);
 setError(null);
 adminApi
 .listUsers({
 role: tab === "ALL" ? undefined : (tab as ApiUserRole),
 search: searchDebounced || undefined,
 page,
 pageSize: PAGE_SIZE,
 })
 .then((res) => {
 if (!alive) return;
 setItems(res.items);
 setTotal(res.total);
 })
 .catch((err) => {
 if (!alive) return;
 if (err instanceof ApiError && err.status === 403) {
 setError("Only super-admins can manage users.");
 } else {
 setError(err instanceof Error ? err.message : "Failed to load users");
 }
 })
 .finally(() => alive && setLoading(false));
 return () => { alive = false; };
 }, [tab, searchDebounced, page, refreshTick]);

 const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

 const selectedItems = useMemo(
 () => items.filter((u) => selected.has(u.id)),
 [items, selected],
 );

 const allOnPageSelected = items.length > 0 && items.every((u) => selected.has(u.id));

 const toggleAll = () => {
 const next = new Set(selected);
 if (allOnPageSelected) items.forEach((u) => next.delete(u.id));
 else items.forEach((u) => next.add(u.id));
 setSelected(next);
 };

 const toggleOne = (id: string) => {
 const next = new Set(selected);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 setSelected(next);
 };

 const onConfirmDelete = async () => {
 setBusy(true);
 try {
 const ids = Array.from(selected);
 const res = ids.length === 1
 ? await trashApi.softDelete(ids[0]!).then(() => ({ succeeded: 1, failed: 0, total: 1 }))
 : await trashApi.bulkDelete(ids);
 setFlash(
 res.failed
 ? `Moved ${res.succeeded} to trash. ${res.failed} failed (already deleted or protected).`
 : `Moved ${res.succeeded} user${res.succeeded === 1 ? "" : "s"} to trash.`,
 );
 setSelected(new Set());
 setConfirmOpen(false);
 setRefreshTick((n) => n + 1);
 } catch (err) {
 const msg = err instanceof Error ? err.message : "Delete failed";
 setFlash(msg);
 } finally {
 setBusy(false);
 setTimeout(() => setFlash(null), 5000);
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
 <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500/15 to-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-300">
 <Users2 size={13} /> User Management
 </p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
 All Users
 </h1>
 <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
 Delete → sends to trash (email stays locked). Purge from trash to free the email for re-registration.
 </p>
 </div>
 <div className="flex gap-2">
 <Link
 to="/super-admin/trash"
 className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <Trash2 size={15} /> View Trash
 </Link>
 </div>
 </div>

 {/* Role tabs */}
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
 </div>

 {/* Search + refresh */}
 <div className="mb-4 flex flex-wrap items-center gap-3">
 <div className="relative flex-1 min-w-[220px]">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name or email…"
 className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
 />
 </div>
 <button
 type="button"
 onClick={() => setRefreshTick((n) => n + 1)}
 className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
 title="Refresh"
 >
 <RefreshCw size={13} /> Refresh
 </button>
 </div>

 {/* Bulk action bar */}
 {selected.size > 0 ? (
 <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 dark:border-rose-500/30 dark:bg-rose-500/10">
 <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">
 {selected.size} user{selected.size === 1 ? "" : "s"} selected
 </span>
 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => setSelected(new Set())}
 className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-200 dark:hover:bg-rose-500/20"
 >
 Clear Selection
 </button>
 <button
 type="button"
 onClick={() => setConfirmOpen(true)}
 className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
 >
 <Trash2 size={13} /> Move to Trash
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

 {/* Table */}
 <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
 <div className="overflow-x-auto">
 <table className="min-w-full text-sm">
 <thead>
 <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
 <th className="w-10 px-4 py-3">
 <button type="button" onClick={toggleAll} className="flex items-center" aria-label={allOnPageSelected ? "Deselect all" : "Select all"}>
 {allOnPageSelected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
 </button>
 </th>
 <th className="px-4 py-3">Name</th>
 <th className="px-4 py-3">Email</th>
 <th className="px-4 py-3">Role</th>
 <th className="px-4 py-3">Mobile</th>
 <th className="px-4 py-3">Registered</th>
 <th className="w-24 px-4 py-3 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
 {loading ? (
 <tr>
 <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
 Loading…
 </td>
 </tr>
 ) : items.length === 0 ? (
 <tr>
 <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
 No users match your filter.
 </td>
 </tr>
 ) : (
 items.map((u) => {
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
 <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{u.mobile ?? "—"}</td>
 <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
 {new Date(u.createdAt).toLocaleDateString()}
 </td>
 <td className="px-4 py-3 text-right">
 <button
 type="button"
 onClick={() => {
 setSelected(new Set([u.id]));
 setConfirmOpen(true);
 }}
 className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
 >
 <Trash2 size={12} /> Delete
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Pager */}
 <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs dark:border-zinc-800">
 <span className="text-zinc-500 dark:text-zinc-400">
 Showing {items.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{(page - 1) * PAGE_SIZE + items.length} of {total}
 </span>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page <= 1}
 className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ChevronLeft size={12} /> Prev
 </button>
 <span className="text-zinc-600 dark:text-zinc-300">
 Page <span className="font-semibold">{page}</span> of {totalPages}
 </span>
 <button
 type="button"
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={page >= totalPages}
 className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 Next <ChevronRight size={12} />
 </button>
 </div>
 </div>
 </div>
 </main>

 <ConfirmDialog
 open={confirmOpen}
 title="Move to trash?"
 message={
 <>
 <strong>{selectedItems.length}</strong> user{selectedItems.length === 1 ? "" : "s"} will be moved to trash. They won't be able to log in, and their email remains locked so they cannot re-register — until you purge the record from the trash.
 </>
 }
 detail="This action is reversible from the Trash page."
 items={selectedItems.map((u) => `${u.name} — ${u.email} (${u.role})`)}
 confirmLabel={busy ? "Moving…" : "Move to trash"}
 tone="warning"
 busy={busy}
 onConfirm={onConfirmDelete}
 onClose={() => (busy ? undefined : setConfirmOpen(false))}
 />
 </div>
 );
}
