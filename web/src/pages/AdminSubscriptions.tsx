import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileSpreadsheet, FileText, FileType2, IndianRupee, TrendingUp, Undo2 } from "lucide-react";
import { allUsers } from "../store/auth";
import { useSubscriptions, planById } from "../store/subscriptions";
import { Navbar } from "../components/Navbar";
import { exportExcel, exportWord, exportSummaryPdf } from "../lib/export";
import { subscriptionsApi } from "../lib/api/subscriptions";
import { ApiError, apiEnabled } from "../lib/api";

export function AdminSubscriptions() {
 const subs = useSubscriptions((s) => s.subscriptions);
 const users = allUsers();
 // Track which subscription id is being refunded so the row shows
 // a spinner + we prevent double-clicks. Reset locally on success
 // (the localStorage subscriptions list is server-mirrored; the row
 // will re-hydrate on the next visit).
 const [refundingId, setRefundingId] = useState<string | null>(null);
 const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());

 async function issueRefund(subscriptionId: string) {
  if (!apiEnabled) {
   alert("Refunds require the API. Not available in offline demo mode.");
   return;
  }
  const reason = window.prompt("Reason for refund? (Shown to the user in their email)");
  if (reason == null) return; // cancelled
  setRefundingId(subscriptionId);
  try {
   await subscriptionsApi.adminRefund(subscriptionId, reason || "Admin refund");
   setRefundedIds((s) => new Set(s).add(subscriptionId));
  } catch (err) {
   alert(err instanceof ApiError ? err.message : "Refund failed. Try again.");
  } finally {
   setRefundingId(null);
  }
 }

 const enriched = subs
 .map((s) => ({ sub: s, user: users.find((u) => u.id === s.userId), plan: planById(s.planId) }))
 .sort((a, b) => new Date(b.sub.startedAt).getTime() - new Date(a.sub.startedAt).getTime());

 const rows = enriched.map(({ sub, user, plan }) => ({
 "Reference": sub.paymentRef,
 "User Name": user?.name ?? "—",
 "User Email": user?.email ?? "—",
 "Role": user?.role ?? "—",
 "Plan": plan?.label ?? sub.planId,
 "Amount (₹)": sub.priceInr,
 "GST (₹)": plan?.gst ? Math.round(sub.priceInr * 0.18) : 0,
 "Total (₹)": sub.priceInr + (plan?.gst ? Math.round(sub.priceInr * 0.18) : 0),
 "Started": new Date(sub.startedAt).toLocaleDateString(),
 "Expires": new Date(sub.expiresAt).toLocaleDateString(),
 "Status": new Date(sub.expiresAt) > new Date() ? "Active" : "Expired",
 }));

 const totalRevenue = subs.reduce((s, x) => s + x.priceInr, 0);
 const activeRevenue = subs.filter((s) => new Date(s.expiresAt) > new Date()).reduce((s, x) => s + x.priceInr, 0);

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <Link to="/admin/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Dashboard
 </Link>

 <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
 <div>
 <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{subs.length} transactions</h1>
 <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Payment monitoring + revenue overview</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <Btn icon={<FileSpreadsheet size={14} />} label="Excel" onClick={() => exportExcel(rows, "subscriptions", "Transactions")} color="emerald" />
 <Btn icon={<FileText size={14} />} label="Word" onClick={() => exportWord("Subscriptions report", rows, "subscriptions")} color="sky" />
 <Btn icon={<FileType2 size={14} />} label="PDF" onClick={() => exportSummaryPdf("Subscriptions report", rows, "subscriptions")} color="rose" />
 </div>
 </div>

 <div className="mb-6 grid gap-4 sm:grid-cols-3">
 <RevTile icon={<IndianRupee size={20} />} label="Total revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} accent="from-emerald-500 to-teal-500" />
 <RevTile icon={<TrendingUp size={20} />} label="Active revenue" value={`₹${activeRevenue.toLocaleString("en-IN")}`} accent="from-brand-500 to-amber-500" />
 <RevTile icon={<IndianRupee size={20} />} label="Avg ticket" value={`₹${subs.length ? Math.round(totalRevenue / subs.length).toLocaleString("en-IN") : 0}`} accent="from-sky-500 to-cyan-500" />
 </div>

 <div className="overflow-hidden rounded-3xl bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
 <tr>
 <th className="px-4 py-3">Ref</th>
 <th className="px-4 py-3">User</th>
 <th className="px-4 py-3">Plan</th>
 <th className="px-4 py-3 text-right">Amount</th>
 <th className="px-4 py-3">Started</th>
 <th className="px-4 py-3">Expires</th>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3"></th>
 </tr>
 </thead>
 <tbody>
 {enriched.map(({ sub, user, plan }, i) => {
 const active = new Date(sub.expiresAt) > new Date();
 return (
 <motion.tr key={sub.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.02 }} className="border-t border-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
 <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">{sub.paymentRef}</td>
 <td className="px-4 py-3">
 <div className="font-semibold">{user?.name ?? "—"}</div>
 <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{user?.email ?? ""} · {user?.role}</div>
 </td>
 <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{plan?.label ?? sub.planId}</td>
 <td className="px-4 py-3 text-right font-bold">₹{sub.priceInr.toLocaleString("en-IN")}</td>
 <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{new Date(sub.startedAt).toLocaleDateString()}</td>
 <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{new Date(sub.expiresAt).toLocaleDateString()}</td>
 <td className="px-4 py-3">
 {refundedIds.has(sub.id) ? (
  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
   Refunded
  </span>
 ) : (
  <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"].join(" ")}>
   {active ? "Active" : "Expired"}
  </span>
 )}
 </td>
 <td className="px-4 py-3 text-right">
 {active && !refundedIds.has(sub.id) && (
  <button
   onClick={() => issueRefund(sub.id)}
   disabled={refundingId === sub.id}
   className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
   title="Issue a refund via Razorpay. User's paid access is revoked immediately."
  >
   <Undo2 size={11} />
   {refundingId === sub.id ? "Refunding…" : "Refund"}
  </button>
 )}
 </td>
 </motion.tr>
 );
 })}
 {subs.length === 0 && (
 <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No transactions yet.</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </main>
 </div>
 );
}

function RevTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
 return (
 <div className="rounded-3xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className={["mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", accent].join(" ")}>{icon}</div>
 <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
 <p className="mt-0.5 text-2xl font-bold tracking-tight">{value}</p>
 </div>
 );
}

const COLORS = {
 emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
 sky: "from-sky-500 to-sky-700 shadow-sky-500/30",
 rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
} as const;

function Btn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: keyof typeof COLORS }) {
 return (
 <button onClick={onClick} className={["inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:shadow-lg", COLORS[color]].join(" ")}>
 {icon}
 Export {label}
 </button>
 );
}
