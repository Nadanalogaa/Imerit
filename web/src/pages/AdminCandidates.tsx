import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
 ArrowLeft,
 FileSpreadsheet,
 FileText,
 FileType2,
 Search,
 CheckCircle2,
 Clock,
 Eye,
 XCircle,
 ChevronLeft,
 ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { ThemeToggle } from "../components/ThemeToggle";
import { exportExcel, exportWord, exportSummaryPdf } from "../lib/export";
import { apiEnabled, ApiError } from "../lib/api";
import { adminApi, type AdminProfileListItem, type AdminUserListItem, type ApiModerationStatus } from "../lib/api/admin";

const PAGE_SIZE = 20;

interface CandidateRow {
 userId: string;
 name: string;
 email: string;
 mobile: string | null;
 location: string;
 field: "it" | "non_it" | null;
 hasResume: boolean;
 status: ApiModerationStatus | "—";
 fieldLabel: string;
 type: string;
 specialization: string;
 yearsOfExperience: number | string;
 emailVerified: boolean;
 createdAt: string;
}

export function AdminCandidates() {
 const profiles = useProfile((s) => s.byUser);

 const [search, setSearch] = useState("");
 const [searchDebounced, setSearchDebounced] = useState("");
 const [statusFilter, setStatusFilter] = useState<"" | ApiModerationStatus>("");
 const [page, setPage] = useState(1);

 // API state
 const [apiRows, setApiRows] = useState<CandidateRow[]>([]);
 const [apiTotal, setApiTotal] = useState(0);
 const [apiLoading, setApiLoading] = useState(apiEnabled);
 const [apiError, setApiError] = useState<string | null>(null);

 // Debounce the search so we don't fire a request on every keystroke.
 useEffect(() => {
 const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
 return () => clearTimeout(t);
 }, [search]);

 // Reset page when filters change so we don't end up on an empty page.
 useEffect(() => { setPage(1); }, [searchDebounced, statusFilter]);

 // Fetch when filters change. Two sources:
 // - No status filter → /admin/users?role=CANDIDATE so registered-but-
 // unprofiled candidates also show.
 // - Status filter set → /admin/profiles?status=X so moderation views
 // hit the profile index directly.
 useEffect(() => {
 if (!apiEnabled) {
 setApiLoading(false);
 return;
 }
 let alive = true;
 setApiLoading(true);
 const request = statusFilter
 ? adminApi
 .listProfiles({
 status: statusFilter,
 search: searchDebounced || undefined,
 page,
 pageSize: PAGE_SIZE,
 })
 .then((res) => ({ items: res.items.map(profileToRow), total: res.total }))
 : adminApi
 .listUsers({
 role: "CANDIDATE",
 search: searchDebounced || undefined,
 page,
 pageSize: PAGE_SIZE,
 })
 .then((res) => ({ items: res.items.map(userApiToRow), total: res.total }));
 request
 .then((res) => {
 if (!alive) return;
 setApiRows(res.items);
 setApiTotal(res.total);
 setApiError(null);
 })
 .catch((err) => {
 if (!alive) return;
 if (err instanceof ApiError && err.status === 403) {
 setApiError("Your account isn't allowed to see this list. Sign in as admin.");
 } else {
 setApiError(err instanceof Error ? err.message : "Failed to load candidates");
 }
 })
 .finally(() => alive && setApiLoading(false));
 return () => { alive = false; };
 }, [page, searchDebounced, statusFilter]);

 // localStorage fallback rows — used when API is off.
 const localRows = useMemo<CandidateRow[]>(() => {
 return allUsers()
 .filter((u) => u.role === "candidate")
 .map((u) => userToRow(u, profiles[u.id]))
 .filter((r) => {
 if (!searchDebounced) return true;
 const q = searchDebounced.toLowerCase();
 return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
 })
 .filter((r) => (statusFilter ? r.status === statusFilter : true));
 }, [profiles, searchDebounced, statusFilter]);

 // Pick whichever source is authoritative.
 const rows = apiEnabled ? apiRows : localRows;
 const total = apiEnabled ? apiTotal : localRows.length;
 const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
 const visibleRows = apiEnabled ? rows : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

 // Build the export bundle from whatever's currently rendered.
 const exportRows = rows.map((r) => ({
 Name: r.name,
 Email: r.email,
 Mobile: r.mobile ?? "",
 Location: r.location,
 Field: r.fieldLabel,
 Type: r.type,
 Specialization: r.specialization,
 "Years of Experience": r.yearsOfExperience,
 Status: r.status,
 "Profile Complete": r.hasResume ? "Yes" : "No",
 "Email Verified": r.emailVerified ? "Yes" : "No",
 "Registered On": new Date(r.createdAt).toLocaleDateString(),
 }));

 const completedCount = rows.filter((r) => r.hasResume).length;

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Header title="Candidates" />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <Link to="/admin/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Dashboard
 </Link>

 <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{total} candidate{total === 1 ? "" : "s"}</h1>
 <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
 {completedCount} on this page with a completed profile
 {apiEnabled && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live</span>}
 </p>
 </div>

 <div className="flex flex-wrap gap-2">
 <ExportBtn icon={<FileSpreadsheet size={14} />} label="Excel" onClick={() => exportExcel(exportRows, "candidates", "Candidates")} color="emerald" />
 <ExportBtn icon={<FileText size={14} />} label="Word" onClick={() => exportWord("Candidates report", exportRows, "candidates")} color="sky" />
 <ExportBtn icon={<FileType2 size={14} />} label="PDF" onClick={() => exportSummaryPdf("Candidates report", exportRows, "candidates")} color="rose" />
 </div>
 </div>

 {apiError && (
 <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {apiError}
 </p>
 )}

 <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
 <div className="relative">
 <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search name, email, location…"
 className="w-full rounded-lg bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
 />
 </div>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
 className="rounded-lg bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
 >
 <option value="">All statuses</option>
 <option value="PENDING">Pending</option>
 <option value="APPROVED">Approved</option>
 <option value="REJECTED">Rejected</option>
 </select>
 </div>

 <div className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
 <tr>
 <Th>Name</Th>
 <Th>Email</Th>
 <Th>Mobile</Th>
 <Th>Location</Th>
 <Th>Field</Th>
 <Th>Status</Th>
 <Th>Action</Th>
 </tr>
 </thead>
 <tbody>
 {apiLoading ? (
 <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</td></tr>
 ) : visibleRows.length === 0 ? (
 <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No candidates match these filters.</td></tr>
 ) : visibleRows.map((r, i) => (
 <motion.tr
 key={r.userId}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.2, delay: i * 0.02 }}
 className="border-t border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
 >
 <Td><span className="font-semibold">{r.name}</span></Td>
 <Td><span className="text-zinc-600 dark:text-zinc-400">{r.email}</span></Td>
 <Td><span className="text-zinc-600 dark:text-zinc-400">{r.mobile ?? "—"}</span></Td>
 <Td><span className="text-zinc-600 dark:text-zinc-400">{r.location || "—"}</span></Td>
 <Td>
 {r.field === "it" && <Pill color="sky">IT</Pill>}
 {r.field === "non_it" && <Pill color="amber">Non-IT</Pill>}
 {!r.field && <span className="text-zinc-400">—</span>}
 </Td>
 <Td><StatusBadge status={r.status} hasResume={r.hasResume} /></Td>
 <Td>
 {r.hasResume ? (
 <Link
 to={`/admin/candidates/${r.userId}`}
 className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <Eye size={11} /> Review
 </Link>
 ) : (
 <span className="text-zinc-400">—</span>
 )}
 </Td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 text-xs dark:bg-zinc-950/30">
 <span className="text-zinc-600 dark:text-zinc-400">
 Page {page} of {totalPages} · showing {visibleRows.length} of {total}
 </span>
 <div className="flex items-center gap-1">
 <button
 disabled={page <= 1}
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ChevronLeft size={11} /> Prev
 </button>
 <button
 disabled={page >= totalPages}
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 Next <ChevronRight size={11} />
 </button>
 </div>
 </div>
 )}
 </div>
 </main>
 </div>
 );
}

/* ------------------------- shape conversions ------------------------- */

function profileToRow(p: AdminProfileListItem): CandidateRow {
 const fieldLabel = p.field === "IT" ? "IT" : p.field === "NON_IT" ? "Non-IT" : "";
 return {
 userId: p.user.id,
 name: p.user.name,
 email: p.user.email,
 mobile: p.user.mobile,
 location: p.preferredLocation ?? "",
 field: p.field === "IT" ? "it" : p.field === "NON_IT" ? "non_it" : null,
 hasResume: !!p.selectedTemplateId,
 status: p.moderationStatus,
 fieldLabel,
 type: p.type?.toLowerCase() ?? "",
 specialization: p.itSpecialization ?? p.nonItDepartments?.[0] ?? "",
 yearsOfExperience: p.yearsOfExperience ?? "",
 emailVerified: true, // listed candidates are always emailVerified
 createdAt: p.user.createdAt,
 };
}

function userApiToRow(u: AdminUserListItem): CandidateRow {
 return {
 userId: u.id,
 name: u.name,
 email: u.email,
 mobile: u.mobile,
 location: "",
 field: null,
 hasResume: !!u.candidateProfile?.selectedTemplateId,
 status: u.candidateProfile?.moderationStatus ?? "—",
 fieldLabel: "",
 type: "",
 specialization: "",
 yearsOfExperience: "",
 emailVerified: u.emailVerified,
 createdAt: u.createdAt,
 };
}

function userToRow(u: { id: string; name: string; email: string; mobile?: string; emailVerified: boolean; createdAt: string }, profile?: import("../store/profile").CandidateProfile): CandidateRow {
 const fieldLabel = profile?.field === "it" ? "IT" : profile?.field === "non_it" ? "Non-IT" : "";
 return {
 userId: u.id,
 name: u.name,
 email: u.email,
 mobile: u.mobile ?? null,
 location: profile?.preferredLocation ?? "",
 field: profile?.field ?? null,
 hasResume: !!profile?.selectedTemplateId,
 status: "—", // localStorage has no moderation state
 fieldLabel,
 type: profile?.type ?? "",
 specialization: profile?.itSpecialization ?? profile?.nonItDepartments?.[0] ?? "",
 yearsOfExperience: profile?.yearsOfExperience ?? "",
 emailVerified: u.emailVerified,
 createdAt: u.createdAt,
 };
}

/* ------------------------- UI bits ------------------------- */

function StatusBadge({ status, hasResume }: { status: ApiModerationStatus | "—"; hasResume: boolean }) {
 if (status === "APPROVED") {
 return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><CheckCircle2 size={10} /> Approved</span>;
 }
 if (status === "REJECTED") {
 return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"><XCircle size={10} /> Rejected</span>;
 }
 if (status === "PENDING") {
 return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Clock size={10} /> Pending</span>;
 }
 // localStorage / no API
 return hasResume ? (
 <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={13} /> Complete</span>
 ) : (
 <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock size={13} /> In progress</span>
 );
}

export function Header({ title }: { title: string }) {
 return (
 <header className="border-b border-zinc-200 bg-white px-5 py-3 dark:bg-zinc-900">
 <div className="mx-auto flex max-w-7xl items-center justify-between">
 <div className="flex items-center gap-2.5">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-md dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
 <span className="text-xs font-bold">A</span>
 </div>
 <p className="text-sm font-semibold tracking-tight">Admin · {title}</p>
 </div>
 <ThemeToggle />
 </div>
 </header>
 );
}

const COLORS = {
 emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
 sky: "from-sky-500 to-sky-700 shadow-sky-500/30",
 rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
} as const;

function ExportBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: keyof typeof COLORS }) {
 return (
 <button
 onClick={onClick}
 className={["inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg", COLORS[color]].join(" ")}
 >
 {icon} Export {label}
 </button>
 );
}

const PILL_COLORS = {
 sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

function Pill({ children, color }: { children: React.ReactNode; color: keyof typeof PILL_COLORS }) {
 return <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", PILL_COLORS[color]].join(" ")}>{children}</span>;
}

function Th({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-4 py-3">{children}</td>; }
