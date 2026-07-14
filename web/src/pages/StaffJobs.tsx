import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Plus, Search, MapPin, ExternalLink, Timer, RotateCcw } from "lucide-react";
import { allUsers, useAuth } from "../store/auth";
import { useJobs, isExpired, daysUntilExpiry } from "../store/jobs";
import { StaffTopBar } from "./StaffDashboard";

/**
 * Jobs staff has posted — the readback lane. "Posted by me" isn't a
 * first-class field on Job yet (would need `postedByStaffId`), so we
 * approximate: any job whose employer was provisioned by this staff
 * user, plus jobs the staff explicitly created via /staff/jobs/new (also
 * caught by the employer filter since they had to pick one).
 *
 * This is one place where the localStorage-first design leaks — a real
 * backend should stamp `postedByStaffId` on Job creation. Filed as a
 * follow-up when the backend endpoints land.
 */
export function StaffJobs() {
  const me = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logout);
  const jobs = useJobs((s) => s.jobs);
  const [query, setQuery] = useState("");

  const myEmployerIds = useMemo(
    () => new Set(allUsers().filter((u) => u.createdByStaffId === me.id).map((u) => u.id)),
    [me.id],
  );

  const mine = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => myEmployerIds.has(j.employerId))
      .filter((j) => {
        if (!q) return true;
        return (
          j.title.toLowerCase().includes(q) ||
          j.employerName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [jobs, myEmployerIds, query]);

  const active = mine.filter((j) => !isExpired(j));
  const expired = mine.filter((j) => isExpired(j));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StaffTopBar name={me.name} onLogout={logout} />
      <main className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              Jobs I've posted
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {mine.length} job{mine.length === 1 ? "" : "s"} across{" "}
              {new Set(mine.map((j) => j.employerId)).size} employer
              {new Set(mine.map((j) => j.employerId)).size === 1 ? "" : "s"}
            </h1>
            {active.length !== mine.length && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {active.length} active · {expired.length} expired
              </p>
            )}
          </div>
          <Link
            to="/staff/jobs/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
          >
            <Plus size={14} /> Post job
          </Link>
        </div>

        <div className="mb-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, employer, location..."
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        {mine.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Briefcase size={32} className="text-zinc-400" />
            <p className="mt-3 text-sm font-semibold">Nothing posted yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Post a job on behalf of an employer to see it here.
            </p>
            <Link
              to="/staff/jobs/new"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              <Plus size={12} /> Post your first job
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {mine.map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JobRow({ job }: { job: ReturnType<typeof useJobs.getState>["jobs"][number] }) {
  const dLeft = daysUntilExpiry(job);
  const expired = isExpired(job);
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
        <Briefcase size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{job.title}</h3>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">· {job.employerName}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} /> {job.location}
          </span>
          <span>·</span>
          <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
          {dLeft != null && (
            <>
              <span>·</span>
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  expired
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : dLeft <= 5
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                ].join(" ")}
              >
                <Timer size={10} /> {expired ? "Expired" : `${dLeft}d left`}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {expired && (
          <Link
            to={`/employer/my-jobs`}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-emerald-500/40"
            title="Reposting is done from the employer's own my-jobs page"
          >
            <RotateCcw size={11} /> Repost
          </Link>
        )}
        <Link
          to={`/employer/jobs/${job.id}/applicants`}
          className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-teal-700"
        >
          <ExternalLink size={11} /> Applicants
        </Link>
      </div>
    </div>
  );
}
