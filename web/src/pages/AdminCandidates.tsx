import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  FileType2,
  Search,
  CheckCircle2,
  Clock,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { allUsers } from "../store/auth";
import { useProfile } from "../store/profile";
import { ThemeToggle } from "../components/ThemeToggle";
import { exportExcel, exportWord, exportSummaryPdf } from "../lib/export";

export function AdminCandidates() {
  const profiles = useProfile((s) => s.byUser);
  const [search, setSearch] = useState("");

  const candidates = allUsers()
    .filter((u) => u.role === "candidate")
    .map((u) => ({ user: u, profile: profiles[u.id] }))
    .filter(({ user, profile }) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (profile?.preferredLocation ?? "").toLowerCase().includes(q)
      );
    });

  const rows = candidates.map(({ user, profile }) => ({
    Name: user.name,
    Email: user.email,
    Mobile: user.mobile ?? "",
    Location: profile?.preferredLocation ?? "",
    Field: profile?.field === "it" ? "IT" : profile?.field === "non_it" ? "Non-IT" : "",
    Type: profile?.type ?? "",
    Specialization: profile?.itSpecialization ?? (profile?.nonItDepartments?.[0] ?? ""),
    "Years of Experience": profile?.yearsOfExperience ?? "",
    "Profile Complete": profile?.selectedTemplateId ? "Yes" : "No",
    "Email Verified": user.emailVerified ? "Yes" : "No",
    "Registered On": new Date(user.createdAt).toLocaleDateString(),
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header title="Candidates" />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link to="/admin/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{candidates.length} candidates</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {candidates.filter((c) => c.profile?.selectedTemplateId).length} with completed profile
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ExportBtn icon={<FileSpreadsheet size={14} />} label="Excel" onClick={() => exportExcel(rows, "candidates", "Candidates")} color="emerald" />
            <ExportBtn icon={<FileText size={14} />} label="Word" onClick={() => exportWord("Candidates report", rows, "candidates")} color="sky" />
            <ExportBtn icon={<FileType2 size={14} />} label="PDF" onClick={() => exportSummaryPdf("Candidates report", rows, "candidates")} color="rose" />
          </div>
        </div>

        <div className="mb-4 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, location..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Mobile</Th>
                  <Th>Location</Th>
                  <Th>Field</Th>
                  <Th>Status</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(({ user, profile }, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <Td><span className="font-semibold">{user.name}</span></Td>
                    <Td><span className="text-zinc-600 dark:text-zinc-400">{user.email}</span></Td>
                    <Td><span className="text-zinc-600 dark:text-zinc-400">{user.mobile ?? "—"}</span></Td>
                    <Td><span className="text-zinc-600 dark:text-zinc-400">{profile?.preferredLocation ?? "—"}</span></Td>
                    <Td>
                      {profile?.field === "it" && <Pill color="sky">IT</Pill>}
                      {profile?.field === "non_it" && <Pill color="amber">Non-IT</Pill>}
                      {!profile?.field && <span className="text-zinc-400">—</span>}
                    </Td>
                    <Td>
                      {profile?.selectedTemplateId ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={13} /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock size={13} /> In progress
                        </span>
                      )}
                    </Td>
                    <Td>
                      {profile?.selectedTemplateId ? (
                        <Link
                          to={`/admin/candidates/${user.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Eye size={11} /> View CV
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </Td>
                  </motion.tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No candidates match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export function Header({ title }: { title: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white shadow-md dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
            <span className="text-xs font-bold">A</span>
          </div>
          <p className="text-sm font-semibold tracking-tight">Admin · {title}</p>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

const COLORS = {
  emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
  sky: "from-sky-500 to-sky-700 shadow-sky-500/30",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
} as const;

function ExportBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: keyof typeof COLORS }) {
  return (
    <button
      onClick={onClick}
      className={["inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg", COLORS[color]].join(" ")}
    >
      {icon}
      Export {label}
    </button>
  );
}

const PILL_COLORS = {
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
} as const;

function Pill({ children, color }: { children: React.ReactNode; color: keyof typeof PILL_COLORS }) {
  return <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", PILL_COLORS[color]].join(" ")}>{children}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}
