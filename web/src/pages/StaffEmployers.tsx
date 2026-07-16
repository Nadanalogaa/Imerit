import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Pencil,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { allUsers, useAuth, type User } from "../store/auth";
import { useJobs } from "../store/jobs";
import { Navbar } from "../components/Navbar";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";

/**
 * Employer Master — the directory staff manages. Shows every employer on
 * the platform; the ones staff provisioned expose an inline reveal + copy
 * for the shared password + a "reset password" button.
 *
 * Self-registered employers show up too but their password column is a
 * dash — they log in via OTP, not credentials from us. Staff can still
 * post jobs on their behalf (the picker in /staff/jobs/new pulls the
 * whole list).
 */
export function StaffEmployers() {
  const me = useAuth((s) => s.currentUser)!;
  const resetEmployerPassword = useAuth((s) => s.resetEmployerPassword);
  const jobs = useJobs((s) => s.jobs);

  const [query, setQuery] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [freshCreds, setFreshCreds] = useState<{ email: string; password: string; name: string } | null>(null);
  const [tick, setTick] = useState(0);

  const employers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allUsers()
      .filter((u) => u.role === "employer")
      .filter((u) => (ownedOnly ? u.createdByStaffId === me.id : true))
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.company ?? "").toLowerCase().includes(q) ||
          (u.mobile ?? "").includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    // tick is intentionally a dep — the local state changes above (reset,
    // reveal) don't touch the store, so bumping it forces re-derive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, ownedOnly, me.id, tick]);

  const jobCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const j of jobs) out[j.employerId] = (out[j.employerId] ?? 0) + 1;
    return out;
  }, [jobs]);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1400);
    } catch {
      window.prompt("Copy manually:", text);
    }
  };

  const handleReset = (employer: User) => {
    if (!confirm(`Generate a new password for ${employer.name}? The old one will stop working.`)) {
      return;
    }
    const password = resetEmployerPassword(employer.id);
    setFreshCreds({ email: employer.email, password, name: employer.name });
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              Employer Master
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {employers.length} employer{employers.length === 1 ? "" : "s"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Pick any of them when posting a job. Passwords are visible only for accounts you
              provisioned.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/staff/employers/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
            >
              <Plus size={14} /> Add employer
            </Link>
            <Link
              to="/staff/jobs/new"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:border-brand-300 hover:text-brand-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-brand-500/40 dark:hover:text-brand-300"
            >
              <Briefcase size={14} /> Post job
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, company, mobile..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <label className="inline-flex select-none items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={(e) => setOwnedOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal-600"
            />
            Only mine
          </label>
        </div>

        {employers.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Building2 size={32} className="text-zinc-400" />
            <p className="mt-3 text-sm font-semibold">No employers match</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {query
                ? "Try a different search term."
                : "Add the first employer to start posting jobs on their behalf."}
            </p>
            {!query && (
              <Link
                to="/staff/employers/new"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                <UserPlus size={12} /> Add employer
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Employer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {employers.map((u) => {
                  const provisionedByMe = u.createdByStaffId === me.id;
                  const provisionedByStaff = !!u.sharedPassword;
                  const isRevealed = !!reveal[u.id];
                  return (
                    <tr key={u.id} className="transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {u.company ?? "—"}
                        </div>
                        {provisionedByMe && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                            Yours
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-800 dark:text-zinc-200">{u.email}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {u.mobile ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                        {jobCounts[u.id] ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {provisionedByStaff ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
                              {isRevealed ? u.sharedPassword : "••••••••••"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setReveal((r) => ({ ...r, [u.id]: !r[u.id] }))
                              }
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                              aria-label={isRevealed ? "Hide password" : "Reveal password"}
                            >
                              {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copy(u.id, u.sharedPassword!)}
                              className="text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300"
                              aria-label="Copy password"
                            >
                              {copied === u.id ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] italic text-zinc-400 dark:text-zinc-500">
                            self-registered — OTP only
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {provisionedByStaff && (
                            <button
                              type="button"
                              onClick={() => handleReset(u)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:border-amber-300 hover:text-amber-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-amber-500/40 dark:hover:text-amber-300"
                              title="Generate a new password"
                            >
                              <RotateCcw size={11} /> Reset
                            </button>
                          )}
                          <Link
                            to={`/staff/employers/${u.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-teal-500/40 dark:hover:text-teal-300"
                          >
                            <Pencil size={11} /> Edit
                          </Link>
                          <Link
                            to={`/staff/jobs/new?employerId=${u.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-teal-700"
                          >
                            <Briefcase size={11} /> Post
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {freshCreds && (
        <CredentialShareModal
          title="Password reset"
          subtitle={`New credentials for ${freshCreds.name}`}
          email={freshCreds.email}
          password={freshCreds.password}
          onClose={() => setFreshCreds(null)}
        />
      )}
    </div>
  );
}
