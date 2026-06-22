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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { allUsers } from "../store/auth";
import { useSubscriptions } from "../store/subscriptions";
import { Header } from "./AdminCandidates";
import { exportExcel, exportWord, exportSummaryPdf } from "../lib/export";
import { apiEnabled, ApiError } from "../lib/api";
import { adminApi, type AdminUserListItem } from "../lib/api/admin";

const PAGE_SIZE = 20;

interface EmployerRow {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  company: string;
  emailVerified: boolean;
  createdAt: string;
}

export function AdminEmployers() {
  const subs = useSubscriptions((s) => s.subscriptions);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [page, setPage] = useState(1);

  const [apiRows, setApiRows] = useState<EmployerRow[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiLoading, setApiLoading] = useState(apiEnabled);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [searchDebounced]);

  useEffect(() => {
    if (!apiEnabled) {
      setApiLoading(false);
      return;
    }
    let alive = true;
    setApiLoading(true);
    adminApi
      .listUsers({
        role: "EMPLOYER",
        search: searchDebounced || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (!alive) return;
        setApiRows(res.items.map(userApiToRow));
        setApiTotal(res.total);
        setApiError(null);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 403) {
          setApiError("Your account isn't allowed to see this list. Sign in as admin.");
        } else {
          setApiError(err instanceof Error ? err.message : "Failed to load employers");
        }
      })
      .finally(() => alive && setApiLoading(false));
    return () => { alive = false; };
  }, [page, searchDebounced]);

  const localRows = useMemo<EmployerRow[]>(() => {
    return allUsers()
      .filter((u) => u.role === "employer")
      .map<EmployerRow>((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile ?? null,
        company: u.company ?? "",
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
      }))
      .filter((r) => {
        if (!searchDebounced) return true;
        const q = searchDebounced.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.company.toLowerCase().includes(q);
      });
  }, [searchDebounced]);

  const rows = apiEnabled ? apiRows : localRows;
  const total = apiEnabled ? apiTotal : localRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleRows = apiEnabled ? rows : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportRows = rows.map((u) => {
    const sub = subs.find((s) => s.userId === u.id && new Date(s.expiresAt) > new Date());
    return {
      Name: u.name,
      Company: u.company,
      Email: u.email,
      Mobile: u.mobile ?? "",
      "Email Verified": u.emailVerified ? "Yes" : "No",
      "Active Plan": sub ? sub.planId : "—",
      "Plan Expires": sub ? new Date(sub.expiresAt).toLocaleDateString() : "—",
      "Registered On": new Date(u.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header title="Employers" />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link to="/admin/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{total} employer{total === 1 ? "" : "s"}</h1>
            {apiEnabled && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn icon={<FileSpreadsheet size={14} />} label="Excel" onClick={() => exportExcel(exportRows, "employers", "Employers")} color="emerald" />
            <Btn icon={<FileText size={14} />} label="Word" onClick={() => exportWord("Employers report", exportRows, "employers")} color="sky" />
            <Btn icon={<FileType2 size={14} />} label="PDF" onClick={() => exportSummaryPdf("Employers report", exportRows, "employers")} color="rose" />
          </div>
        </div>

        {apiError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
            {apiError}
          </p>
        )}

        <div className="mb-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">Loading…</td></tr>
                ) : visibleRows.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No employers match.</td></tr>
                ) : visibleRows.map((u, i) => {
                  const sub = subs.find((s) => s.userId === u.id && new Date(s.expiresAt) > new Date());
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.company || "—"}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.mobile ?? "—"}</td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{sub.planId.replace("plan_", "")}</span>
                        ) : (
                          <span className="text-zinc-400">No plan</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Clock size={13} /> Pending
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
              <span className="text-zinc-600 dark:text-zinc-400">
                Page {page} of {totalPages} · showing {visibleRows.length} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft size={11} /> Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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

function userApiToRow(u: AdminUserListItem): EmployerRow {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    company: u.employerProfile?.companyName ?? "",
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
  };
}

const COLORS = {
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  sky: "from-sky-500 to-sky-700 shadow-sky-500/30",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
} as const;

function Btn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: keyof typeof COLORS }) {
  return (
    <button
      onClick={onClick}
      className={["inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg", COLORS[color]].join(" ")}
    >
      {icon} Export {label}
    </button>
  );
}
