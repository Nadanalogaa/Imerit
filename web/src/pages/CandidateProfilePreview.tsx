import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Download, Edit3, FileText, LayoutDashboard, MapPin, Palette } from "lucide-react";
import { useAuth } from "../store/auth";
import { useProfile } from "../store/profile";
import { useLocations } from "../store/locations";
import { ThemeToggle } from "../components/ThemeToggle";
import { RenderTemplate } from "../components/templates";
import { TEMPLATE_META } from "../components/templates/types";

export function CandidateProfilePreview() {
 const navigate = useNavigate();
 const user = useAuth((s) => s.currentUser)!;
 const profile = useProfile((s) => s.get)(user.id);
 const districts = useLocations((s) => s.districts);

 if (!profile.selectedTemplateId) {
 navigate("/candidate/profile/build", { replace: true });
 return null;
 }

 const templateMeta = TEMPLATE_META.find((t) => t.id === profile.selectedTemplateId);

 // Resolved preferred-location label — first try the multi-select
 // districts (canonical), then the legacy free-text field.
 const preferredLabel = (() => {
 const ids = profile.preferredDistricts ?? [];
 if (ids.length) {
 const names = ids.map((id) => districts.find((d) => d.id === id)?.name).filter(Boolean);
 if (names.length) return names.join(", ");
 }
 return profile.preferredLocation ?? "";
 })();

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 {/* Top bar */}
 <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl /60 dark:bg-zinc-950/80">
 <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
 <button
 onClick={() => navigate("/candidate/dashboard")}
 className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ArrowLeft size={20} />
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

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 {/* Info strip — surfaces preferred location + industry/department +
     CV download in the profile-view surface (existing templates
     render some but not all of these consistently). Kept above the
     template so the info is visible even on print-optimised layouts. */}
 <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 text-[12px] shadow-sm dark:bg-zinc-900">
 {preferredLabel && (
 <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
 <MapPin size={12} />
 <span className="font-semibold">Preferred location:</span> {preferredLabel}
 </span>
 )}
 {profile.industry && (
 <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
 <Building2 size={12} />
 <span className="font-semibold">Industry:</span> {profile.industry}
 </span>
 )}
 {profile.department && (
 <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
 <Building2 size={12} />
 <span className="font-semibold">Department:</span> {profile.department}
 </span>
 )}
 {profile.cvUrl && (
 <a
 href={profile.cvUrl}
 download={profile.cvFileName ?? "resume.pdf"}
 className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1 text-white shadow-md shadow-brand-500/30"
 >
 <FileText size={12} /> {profile.cvFileName ?? "CV"} <Download size={12} />
 </a>
 )}
 </div>

 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.35 }}
 className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-zinc-200/40 dark:shadow-black/50"
 >
 <RenderTemplate id={profile.selectedTemplateId} user={user} profile={profile} />
 </motion.div>

 <p className="mt-3 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
 One-page format. Admin & Employer exports auto-fit to a single PDF.
 </p>

 <div className="mt-8 flex flex-col gap-3 sm:flex-row">
 <Link
 to="/candidate/dashboard"
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <LayoutDashboard size={16} />
 Go to dashboard
 </Link>
 <Link
 to="/candidate/profile/build"
 className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
