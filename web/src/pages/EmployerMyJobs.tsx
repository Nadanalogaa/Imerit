import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Briefcase,
  MapPin,
  Users,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { useJobs, FIELD_LABEL, TYPE_LABEL, relativeTime, type Job } from "../store/jobs";
import { useApplications } from "../store/applications";
import { apiEnabled } from "../lib/api";
import { employerJobsApi } from "../lib/api/jobs";

export function EmployerMyJobs() {
  const user = useAuth((s) => s.currentUser)!;
  const localMyJobs = useJobs((s) => s.postedBy)(user.id);
  const deleteJob = useJobs((s) => s.deleteJob);
  const apps = useApplications((s) => s.applications);

  // Live data from the API when available; counts come straight from the
  // server's _count aggregate so it stays accurate cross-device.
  const [apiJobs, setApiJobs] = useState<Job[] | null>(null);
  const [apiCounts, setApiCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    employerJobsApi.list()
      .then((res) => {
        if (!alive) return;
        const local: Job[] = res.items.map((j) => ({
          id: j.id,
          employerId: j.employerId,
          employerName: j.employerName,
          title: j.title,
          description: j.description,
          location: j.location,
          districtId: j.districtId ?? undefined,
          talukId: j.talukId ?? undefined,
          lat: j.lat ?? undefined,
          lng: j.lng ?? undefined,
          pincode: j.pincode ?? undefined,
          field: j.field === "IT" ? "it" : "non_it",
          type: j.type === "INTERNSHIP" ? "internship" : j.type === "FULL_TIME" ? "full_time" : j.type === "PART_TIME" ? "part_time" : "contract",
          experience: j.experience === "FRESHER" ? "fresher" : j.experience === "EXPERIENCED" ? "experienced" : "any",
          yearsMin: j.yearsMin ?? undefined,
          yearsMax: j.yearsMax ?? undefined,
          salaryRange: j.salaryRange ?? undefined,
          skills: j.skills,
          postedAt: j.postedAt,
        }));
        setApiJobs(local);
        setApiCounts(Object.fromEntries(res.items.map((j) => [j.id, j._count.applications])));
      })
      .catch(() => { /* fall back to localStorage */ });
    return () => { alive = false; };
  }, []);

  const myJobs = apiJobs ?? localMyJobs;
  const countApps = (jobId: string) => apiCounts[jobId] ?? apps.filter((a) => a.jobId === jobId).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link to="/employer/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">My posted jobs</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{myJobs.length} {myJobs.length === 1 ? "job" : "jobs"}</h1>
          </div>
          <Link to="/employer/jobs/new" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/30">
            <Plus size={14} /> Post new job
          </Link>
        </div>

        {myJobs.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Briefcase size={32} className="text-zinc-400" />
            <p className="mt-3 text-sm font-semibold">You haven't posted any jobs yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Job posting is always free.</p>
            <Link to="/employer/jobs/new" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-sky-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/30">
              <Plus size={14} /> Post your first job
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myJobs.map((job, i) => {
              const n = countApps(job.id);
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.04 }} className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-500/40">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md">
                    <Briefcase size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/employer/jobs/${job.id}/applicants`} className="block">
                      <h2 className="truncate text-sm font-semibold tracking-tight">{job.title}</h2>
                      <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                        <MapPin size={10} className="inline" /> {job.location} · {FIELD_LABEL[job.field]} · {TYPE_LABEL[job.type]} · Posted {relativeTime(job.postedAt)}
                      </p>
                    </Link>
                  </div>
                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <Users size={12} /> {n} {n === 1 ? "applicant" : "applicants"}
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
                        if (apiEnabled) {
                          try { await employerJobsApi.remove(job.id); }
                          catch (err) {
                            // eslint-disable-next-line no-console
                            console.warn("[employer.delete] API call failed", err);
                          }
                        }
                        deleteJob(job.id);
                        setApiJobs((cur) => cur?.filter((j) => j.id !== job.id) ?? null);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <Link to={`/employer/jobs/${job.id}/applicants`} className="ml-1">
                    <ChevronRight size={18} className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
