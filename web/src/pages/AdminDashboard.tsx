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
} from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { useSubscriptions } from "../store/subscriptions";
import { ThemeToggle } from "../components/ThemeToggle";

export function AdminDashboard() {
  const user = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const profilesMap = useProfile((s) => s.byUser);
  const subs = useSubscriptions((s) => s.subscriptions);

  const candidates = allUsers().filter((u) => u.role === "candidate");
  const employers = allUsers().filter((u) => u.role === "employer");
  const completed = candidates.filter((c) => profilesMap[c.id]?.selectedTemplateId);

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
              onClick={() => { logout(); navigate("/"); }}
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
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Admin dashboard</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage candidates and employers, moderate profiles, and export data.
            </p>
          </motion.div>

          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<Users size={20} />} label="Candidates" value={candidates.length} sub={`${completed.length} with completed profile`} accent="from-brand-500 to-amber-500" variants={itemV} />
            <Stat icon={<Building2 size={20} />} label="Employers" value={employers.length} sub="registered" accent="from-sky-500 to-cyan-500" variants={itemV} />
            <Stat icon={<CreditCard size={20} />} label="Subscriptions" value={subs.length} sub={`${subs.filter((s) => new Date(s.expiresAt) > new Date()).length} active`} accent="from-emerald-500 to-teal-500" variants={itemV} />
            <Stat icon={<FileSpreadsheet size={20} />} label="Total revenue" value={`₹${subs.reduce((s, x) => s + x.priceInr, 0).toLocaleString("en-IN")}`} sub="all time" accent="from-violet-500 to-fuchsia-500" variants={itemV} />
          </motion.div>

          <motion.div variants={containerV} className="grid gap-4 sm:grid-cols-3">
            <Tile variants={itemV} icon={<Users size={20} />} gradient="from-brand-500 to-amber-500" title="Candidates" desc="View, filter, export to Excel/Word/PDF" to="/admin/candidates" />
            <Tile variants={itemV} icon={<Building2 size={20} />} gradient="from-sky-500 to-cyan-500" title="Employers" desc="View, filter, export company data" to="/admin/employers" />
            <Tile variants={itemV} icon={<CreditCard size={20} />} gradient="from-emerald-500 to-teal-500" title="Subscriptions" desc="Payment monitoring, transaction reports" to="/admin/subscriptions" />
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
