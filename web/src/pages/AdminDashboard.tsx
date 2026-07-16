import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
 Users,
 Building2,
 FileSpreadsheet,
 Activity,
 CheckCircle2,
 XCircle,
 UserPlus,
 LogIn,
} from "lucide-react";
import { allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { Navbar } from "../components/Navbar";
import { StatTile } from "../components/StatTile";
import { apiEnabled } from "../lib/api";
import { adminApi, type AdminActivityItem, type AdminStats, type AdminTrends } from "../lib/api/admin";

export function AdminDashboard() {
 // Auth state is consumed by <Navbar />; this page just needs profile + stats.
 const profilesMap = useProfile((s) => s.byUser);
 const subs = useSubscriptions((s) => s.subscriptions);

 // localStorage fallback counts — used when API is off or while it's loading.
 const localCandidates = allUsers().filter((u) => u.role === "candidate");
 const localEmployers = allUsers().filter((u) => u.role === "employer");
 const localCompleted = localCandidates.filter((c) => profilesMap[c.id]?.selectedTemplateId);

 const [stats, setStats] = useState<AdminStats | null>(null);
 const [activity, setActivity] = useState<AdminActivityItem[]>([]);
 const [trends, setTrends] = useState<AdminTrends | null>(null);
 const [statsError, setStatsError] = useState<string | null>(null);

 useEffect(() => {
 if (!apiEnabled) return;
 let alive = true;
 (async () => {
 try {
 const [s, a, t] = await Promise.all([
 adminApi.stats(),
 adminApi.activity(25),
 adminApi.trends(),
 ]);
 if (alive) {
 setStats(s);
 setActivity(a.items);
 setTrends(t);
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
 <Navbar />

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-10">
 <motion.div variants={containerV} initial="hidden" animate="visible" className="flex flex-col gap-6">
 <motion.div variants={itemV}>
 <div className="flex items-center justify-between gap-3">
 <div>
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Overview</p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Admin dashboard</h1>
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

 {/* Unified stat tiles — each is a Link to its detail page, each
 has a trend sparkline. No more separate "Stat vs Tile"
 duplication that made the same info appear twice on screen. */}
 <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <StatTile
 variants={itemV}
 icon={<Users size={18} />}
 label="Candidates"
 value={candidatesCount}
 sub={`${completedCount} approved · ${pendingCount} pending`}
 accent="from-brand-500 to-amber-500"
 to="/admin/candidates"
 trend={trends?.candidateSignups}
 badge={pendingCount}
 />
 <StatTile
 variants={itemV}
 icon={<Building2 size={18} />}
 label="Employers"
 value={employersCount}
 sub="registered"
 accent="from-sky-500 to-cyan-500"
 to="/admin/employers"
 trend={trends?.employerSignups}
 />
 <StatTile
 variants={itemV}
 icon={<UserPlus size={18} />}
 label="New signups"
 value={signups7d}
 sub="last 7 days"
 accent="from-violet-500 to-fuchsia-500"
 to="/admin/candidates"
 trend={trends
 ? trends.candidateSignups.map((c, i) => c + (trends.employerSignups[i] ?? 0))
 : undefined}
 />
 <StatTile
 variants={itemV}
 icon={<FileSpreadsheet size={18} />}
 label="Revenue (local)"
 value={`₹${subs.reduce((s, x) => s + x.priceInr, 0).toLocaleString("en-IN")}`}
 sub={`${subs.length} subscriptions`}
 accent="from-emerald-500 to-teal-500"
 to="/admin/subscriptions"
 />
 </motion.div>

 {apiEnabled && (
 <motion.section variants={itemV} className="rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
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
 <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-zinc-50/50 px-3 py-2 dark:bg-zinc-950/50">
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

