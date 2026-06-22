import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit3, LayoutDashboard, Palette } from "lucide-react";
import { useAuth } from "../store/auth";
import { useProfile } from "../store/profile";
import { ThemeToggle } from "../components/ThemeToggle";
import { RenderTemplate } from "../components/templates";
import { TEMPLATE_META } from "../components/templates/types";

export function CandidateProfilePreview() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const profile = useProfile((s) => s.get)(user.id);

  if (!profile.selectedTemplateId) {
    navigate("/candidate/profile/build", { replace: true });
    return null;
  }

  const templateMeta = TEMPLATE_META.find((t) => t.id === profile.selectedTemplateId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="hidden sm:inline">Your profile</span>
            <span className="rounded-full bg-gradient-to-r from-brand-100 to-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 dark:from-brand-500/20 dark:to-amber-500/10 dark:text-brand-300">
              {templateMeta?.label ?? "Profile"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/candidate/profile/build"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
            >
              <Edit3 size={13} />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/40 dark:border-zinc-800 dark:shadow-black/50"
        >
          <RenderTemplate id={profile.selectedTemplateId} user={user} profile={profile} />
        </motion.div>

        <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
          One-page format. Admin & Employer exports auto-fit to a single PDF.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/candidate/dashboard"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <LayoutDashboard size={16} />
            Go to dashboard
          </Link>
          <Link
            to="/candidate/profile/build"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Palette size={16} />
            Change template
          </Link>
          <Link
            to="/candidate/profile/build"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
          >
            <Edit3 size={16} />
            Edit profile
          </Link>
        </div>
      </main>
    </div>
  );
}
