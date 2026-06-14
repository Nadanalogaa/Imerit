import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Building2,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  LogOut,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  XCircle,
  UserPlus,
  LogIn,
} from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { ThemeToggle } from "../components/ThemeToggle";
import { apiEnabled } from "../lib/api";
import { adminApi, type AdminActivityItem, type AdminStats } from "../lib/api/admin";

export function AdminDashboard() {
  const user = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logoutAsync);
  const navigate = useNavigate();
  const profilesMap = useProfile((s) => s.byUser);
  const subs = useSubscriptions((s) => s.subscriptions);

  // localStorage fallback counts — used when API is off or while it's loading.
  const localCandidates = allUsers().filter((u) => u.role === "candidate");
  const localEmployers = allUsers().filter((u) => u.role === "employer");
  const localCompleted = localCandidates.filter((c) => profilesMap[c.id]?.selectedTemplateId);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([adminApi.stats(), adminApi.activity(25)]);
        if (alive) {
          setStats(s);
          setActivity(a.items);
        }
      } catch (err) {
        if (alive) setStatsError(err instanceof Error ? err.message : "Failed to load stats");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Prefer API numbers when available, fall back to localStorage for offline + legacy.
  const candidatesCount = stats?.users.candidates ?? localCandidates.length;
  const employersCount = stats?.users.employers ?? localEmployers.length;
  const completedCount = stats?.profiles.approved ?? localCompleted.length;
  const pendingCount = stats?.profiles.pending ?? 0;
  const signups7d = stats?.signupsLast7d ?? 0;

  const containerV: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const itemV: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-md dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Admin Panel</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{user.name} · {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={async () => { await logout(); navigate("/"); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <motion.div variants={containerV} initial="hidden" animate="visible" className="flex flex-col gap-6">
          <motion.div variants={itemV}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Overview</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Admin dashboard</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Manage candidates and employers, moderate profiles, monitor activity.
                </p>
              </div>
              {apiEnabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live data
                </span>
              )}
            </div>
            {statsError && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                Live stats unavailable: {statsError}. Showing cached numbers from this browser.
              </p>
            )}
          </motion.div>

          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<Users size={20} />} label="Candidates" value={candidatesCount} sub={`${completedCount} approved · ${pendingCount} pending`} accent="from-brand-500 to-amber-500" variants={itemV} />
            <Stat icon={<Building2 size={20} />} label="Employers" value={employersCount} sub="registered" accent="from-sky-500 to-cyan-500" variants={itemV} />
            <Stat icon={<UserPlus size={20} />} label="New signups" value={signups7d} sub="last 7 days" accent="from-violet-500 to-fuchsia-500" variants={itemV} />
            <Stat icon={<FileSpreadsheet size={20} />} label="Revenue (local)" value={`₹${subs.reduce((s, x) => s + x.priceInr, 0).toLocaleString("en-IN")}`} sub={`${subs.length} subscriptions`} accent="from-emerald-500 to-teal-500" variants={itemV} />
          </motion.div>

          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-3">
            <Tile variants={itemV} icon={<Users size={20} />} gradient="from-brand-500 to-amber-500" title="Candidates" desc={`Moderate, view profiles, export${pendingCount > 0 ? ` · ${pendingCount} pending` : ""}`} to="/admin/candidates" badge={pendingCount > 0 ? pendingCount : undefined} />
            <Tile variants={itemV} icon={<Building2 size={20} />} gradient="from-sky-500 to-cyan-500" title="Employers" desc="View, filter, export company data" to="/admin/employers" />
            <Tile variants={itemV} icon={<CreditCard size={20} />} gradient="from-emerald-500 to-teal-500" title="Subscriptions" desc="Payment monitoring, transaction reports" to="/admin/subscriptions" />
          </motion.div>

          {apiEnabled && (
            <motion.section variants={itemV} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={16} className="text-brand-600 dark:text-brand-400" />
                <h2 className="text-base font-semibold tracking-tight">Live activity</h2>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">last {activity.length}</span>
              </div>
              {activity.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No activity yet. Get a candidate to sign up.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <ActionIcon action={a.action} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {humanAction(a.action)}
                          {a.actor && <span className="font-normal text-zinc-500"> · {a.actor.name || a.actor.email}</span>}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{new Date(a.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          )}
        </motion.div>
      </main>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const map: Record<string, { icon: React.ReactNode; bg: string; fg: string }> = {
    USER_CREATED: { icon: <UserPlus size={12} />, bg: "bg-brand-100 dark:bg-brand-500/15", fg: "text-brand-700 dark:text-brand-300" },
    USER_LOGIN: { icon: <LogIn size={12} />, bg: "bg-sky-100 dark:bg-sky-500/15", fg: "text-sky-700 dark:text-sky-300" },
    USER_LOGOUT: { icon: <LogOut size={12} />, bg: "bg-zinc-100 dark:bg-zinc-800", fg: "text-zinc-600 dark:text-zinc-300" },
    PROFILE_APPROVED: { icon: <CheckCircle2 size={12} />, bg: "bg-emerald-100 dark:bg-emerald-500/15", fg: "text-emerald-700 dark:text-emerald-300" },
    PROFILE_REJECTED: { icon: <XCircle size={12} />, bg: "bg-rose-100 dark:bg-rose-500/15", fg: "text-rose-700 dark:text-rose-300" },
  };
  const m = map[action] ?? { icon: <Activity size={12} />, bg: "bg-zinc-100 dark:bg-zinc-800", fg: "text-zinc-600 dark:text-zinc-300" };
  return <span className={["mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", m.bg, m.fg].join(" ")}>{m.icon}</span>;
}

function humanAction(action: string) {
  switch (action) {
    case "USER_CREATED": return "Account created";
    case "USER_LOGIN": return "Logged in";
    case "USER_LOGOUT": return "Logged out";
    case "PROFILE_APPROVED": return "Profile approved";
    case "PROFILE_REJECTED": return "Profile rejected";
    default: return action.replace(/_/g, " ").toLowerCase();
  }
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

function Tile({ icon, gradient, title, desc, to, variants, badge }: { icon: React.ReactNode; gradient: string; title: string; desc: string; to: string; variants: Variants; badge?: number }) {
  return (
    <motion.div variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link to={to} className="group relative flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {badge !== undefined && (
          <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">{badge}</span>
        )}
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
