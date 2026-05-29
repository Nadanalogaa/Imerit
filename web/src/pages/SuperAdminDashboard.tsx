import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Building2,
  CreditCard,
  Crown,
  ArrowRight,
  LogOut,
  TrendingUp,
  IndianRupee,
  ScrollText,
  Briefcase,
} from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions, PLANS } from "../store/subscriptions";
import { useApplications } from "../store/applications";
import { useJobs } from "../store/jobs";
import { ThemeToggle } from "../components/ThemeToggle";

export function SuperAdminDashboard() {
  const user = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const profilesMap = useProfile((s) => s.byUser);
  const subs = useSubscriptions((s) => s.subscriptions);
  const apps = useApplications((s) => s.applications);
  const jobs = useJobs((s) => s.jobs);

  const candidates = allUsers().filter((u) => u.role === "candidate");
  const employers = allUsers().filter((u) => u.role === "employer");
  const completedProfiles = candidates.filter((c) => profilesMap[c.id]?.selectedTemplateId).length;
  const totalRevenue = subs.reduce((s, x) => s + x.priceInr, 0);
  const activeSubs = subs.filter((s) => new Date(s.expiresAt) > new Date()).length;
  const subsByType = {
    candidate: subs.filter((s) => s.type === "candidate").length,
    employer_sme: subs.filter((s) => s.type === "employer_sme").length,
    employer_large: subs.filter((s) => s.type === "employer_large").length,
  };

  const itemV: Variants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
  const containerV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-5 py-3 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-900 shadow-md">
              <Crown size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Super Admin</p>
              <p className="text-[10px] text-zinc-400">{user.name} · {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => { logout(); navigate("/"); }} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10">
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <motion.div variants={containerV} initial="hidden" animate="visible" className="flex flex-col gap-6">
          <motion.div variants={itemV}>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              <Crown size={13} /> System overview
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">i-Tamil Recruit · all systems</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Platform-wide metrics, plan management, and payment monitoring.
            </p>
          </motion.div>

          {/* Top metrics */}
          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat variants={itemV} icon={<Users size={20} />} label="Candidates" value={candidates.length} sub={`${completedProfiles} with CV`} accent="from-brand-500 to-amber-500" />
            <Stat variants={itemV} icon={<Building2 size={20} />} label="Employers" value={employers.length} sub="registered" accent="from-sky-500 to-cyan-500" />
            <Stat variants={itemV} icon={<Briefcase size={20} />} label="Jobs" value={jobs.length} sub={`${apps.length} applications`} accent="from-violet-500 to-fuchsia-500" />
            <Stat variants={itemV} icon={<TrendingUp size={20} />} label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} sub={`${activeSubs} active subs`} accent="from-emerald-500 to-teal-500" />
          </motion.div>

          {/* Subscription mix */}
          <motion.div variants={itemV} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              <CreditCard size={14} /> Subscriptions by type
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <SubStat color="bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" label="Candidate" count={subsByType.candidate} desc="₹333 / 45 days" />
              <SubStat color="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" label="Employer SME" count={subsByType.employer_sme} desc="₹1,701 – ₹6,804" />
              <SubStat color="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" label="Employer Large" count={subsByType.employer_large} desc="₹13,608 – ₹54,432" />
            </div>
          </motion.div>

          {/* Plan list (read-only) */}
          <motion.div variants={itemV} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              <ScrollText size={14} /> Plan catalogue
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2">Plan ID</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Days</th>
                    <th className="px-3 py-2">GST</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((p) => (
                    <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="px-3 py-2 font-mono text-[12px]">{p.id}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{p.type}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        <span className="inline-flex items-baseline gap-0.5"><IndianRupee size={11} />{p.priceInr.toLocaleString("en-IN")}</span>
                      </td>
                      <td className="px-3 py-2 text-right">{p.durationDays}</td>
                      <td className="px-3 py-2">{p.gst ? <span className="text-emerald-600">+ 18%</span> : <span className="text-zinc-400">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-3">
            <Tile variants={itemV} icon={<Users size={20} />} gradient="from-brand-500 to-amber-500" title="Candidates" desc="View all + export" to="/admin/candidates" />
            <Tile variants={itemV} icon={<Building2 size={20} />} gradient="from-sky-500 to-cyan-500" title="Employers" desc="View all + export" to="/admin/employers" />
            <Tile variants={itemV} icon={<CreditCard size={20} />} gradient="from-emerald-500 to-teal-500" title="Subscriptions" desc="Payment monitoring" to="/admin/subscriptions" />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value, sub, accent, variants }: { icon: React.ReactNode; label: string; value: number | string; sub: string; accent: string; variants: Variants }) {
  return (
    <motion.div variants={variants} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={["mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", accent].join(" ")}>{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>
    </motion.div>
  );
}

function SubStat({ color, label, count, desc }: { color: string; label: string; count: number; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <span className={["inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", color].join(" ")}>{label}</span>
      <p className="mt-2 text-2xl font-bold">{count}</p>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{desc}</p>
    </div>
  );
}

function Tile({ icon, gradient, title, desc, to, variants }: { icon: React.ReactNode; gradient: string; title: string; desc: string; to: string; variants: Variants }) {
  return (
    <motion.div variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link to={to} className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className={["mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient].join(" ")}>{icon}</div>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
          Open <ArrowRight size={12} />
        </span>
      </Link>
    </motion.div>
  );
}
