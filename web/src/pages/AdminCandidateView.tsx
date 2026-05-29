import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileType2, Mail, Phone } from "lucide-react";
import { allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { RenderTemplate } from "../components/templates";
import { Header } from "./AdminCandidates";

export function AdminCandidateView() {
  const { id } = useParams<{ id: string }>();
  const profiles = useProfile((s) => s.byUser);
  const candidate = allUsers().find((u) => u.id === id);
  const profile = id ? profiles[id] : undefined;

  if (!candidate || candidate.role !== "candidate" || !profile?.selectedTemplateId) {
    return <Navigate to="/admin/candidates" replace />;
  }

  const printPdf = () => window.print();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header title="Candidate" />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/admin/candidates" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <ArrowLeft size={14} /> Candidates
          </Link>
          <div className="flex flex-wrap gap-2">
            {candidate.email && (
              <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                <Mail size={12} /> Email
              </a>
            )}
            {candidate.mobile && (
              <a href={`tel:+91${candidate.mobile}`} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                <Phone size={12} /> Call
              </a>
            )}
            <button onClick={printPdf} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-rose-500/30">
              <FileType2 size={12} /> Print / Save as PDF
            </button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/40 print:shadow-none dark:border-zinc-800 dark:shadow-black/50">
          <RenderTemplate id={profile.selectedTemplateId} user={candidate} profile={profile} />
        </motion.div>
      </main>
    </div>
  );
}
