import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
 ArrowLeft,
 IndianRupee,
 Plus,
 Save,
 Trash2,
 ToggleLeft,
 ToggleRight,
 Receipt,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Checkbox } from "../components/Checkbox";
import { ApiError } from "../lib/api";
import { plansApi, type ApiPlan, type ApiPlanAudience, type UpdatePlanInput } from "../lib/api/plans";

const AUDIENCE_LABELS: Record<ApiPlanAudience, string> = {
 CANDIDATE: "Candidate",
 EMPLOYER_SME: "Employer SME",
 EMPLOYER_LARGE: "Employer Large",
};
const AUDIENCE_COLORS: Record<ApiPlanAudience, string> = {
 CANDIDATE: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
 EMPLOYER_SME: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
 EMPLOYER_LARGE: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

/** Compact INR formatter — fits in the table without commas in dev. */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function SuperAdminPlans() {
 // Auth + sign-out handled by <Navbar />.

 const [items, setItems] = useState<ApiPlan[]>([]);
 const [loading, setLoading] = useState(true);
 const [loadError, setLoadError] = useState<string | null>(null);

 const [draft, setDraft] = useState<NewPlanDraft>(emptyDraft());
 const [creating, setCreating] = useState(false);
 const [createError, setCreateError] = useState<string | null>(null);
 const [createSuccess, setCreateSuccess] = useState<string | null>(null);

 const [editing, setEditing] = useState<Record<string, EditDraft>>({});
 const [saving, setSaving] = useState<Record<string, boolean>>({});
 const [editError, setEditError] = useState<Record<string, string>>({});
 const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

 const refresh = async () => {
 setLoading(true);
 try {
 const { plans } = await plansApi.listAll();
 setItems(plans);
 setLoadError(null);
 } catch (err) {
 setLoadError(err instanceof Error ? err.message : "Failed to load plans");
 } finally {
 setLoading(false);
 }
 };
 useEffect(() => { void refresh(); }, []);

 const grouped = useMemo(() => {
 const out: Record<ApiPlanAudience, ApiPlan[]> = { CANDIDATE: [], EMPLOYER_SME: [], EMPLOYER_LARGE: [] };
 for (const p of items) out[p.audience].push(p);
 return out;
 }, [items]);

 const onCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 setCreateError(null);
 setCreateSuccess(null);
 if (!/^[a-z0-9_-]{3,40}$/.test(draft.key)) return setCreateError("Key must be 3–40 lowercase letters, digits, _ or -.");
 if (draft.label.trim().length < 2) return setCreateError("Label is required.");
 if (draft.durationDays < 1) return setCreateError("Duration must be at least 1 day.");
 if (draft.priceInr < 0) return setCreateError("Price can't be negative.");

 setCreating(true);
 try {
 await plansApi.create({
 key: draft.key.trim(),
 label: draft.label.trim(),
 audience: draft.audience,
 durationDays: draft.durationDays,
 priceInPaise: Math.round(draft.priceInr * 100),
 gstApplies: draft.gstApplies,
 });
 setCreateSuccess(`Created plan ${draft.key}.`);
 setDraft(emptyDraft());
 await refresh();
 } catch (err) {
 if (err instanceof ApiError && err.code === "UNIQUE_CONSTRAINT") {
 setCreateError("A plan with that key already exists. Pick a different key.");
 } else {
 setCreateError(err instanceof Error ? err.message : "Could not create plan.");
 }
 } finally {
 setCreating(false);
 }
 };

 const startEdit = (p: ApiPlan) => {
 setEditing((cur) => ({
 ...cur,
 [p.id]: {
 label: p.label,
 durationDays: p.durationDays,
 priceInr: p.priceInPaise / 100,
 gstApplies: p.gstApplies,
 sortOrder: p.sortOrder,
 },
 }));
 setEditError((cur) => ({ ...cur, [p.id]: "" }));
 };

 const cancelEdit = (id: string) => {
 setEditing((cur) => {
 const next = { ...cur };
 delete next[id];
 return next;
 });
 setEditError((cur) => ({ ...cur, [id]: "" }));
 };

 const saveEdit = async (p: ApiPlan) => {
 const d = editing[p.id];
 if (!d) return;
 setSaving((cur) => ({ ...cur, [p.id]: true }));
 setEditError((cur) => ({ ...cur, [p.id]: "" }));
 try {
 const patch: UpdatePlanInput = {
 label: d.label,
 durationDays: d.durationDays,
 priceInPaise: Math.round(d.priceInr * 100),
 gstApplies: d.gstApplies,
 sortOrder: d.sortOrder,
 };
 await plansApi.update(p.id, patch);
 cancelEdit(p.id);
 await refresh();
 } catch (err) {
 setEditError((cur) => ({ ...cur, [p.id]: err instanceof Error ? err.message : "Save failed" }));
 } finally {
 setSaving((cur) => ({ ...cur, [p.id]: false }));
 }
 };

 const toggleActive = async (p: ApiPlan) => {
 setSaving((cur) => ({ ...cur, [p.id]: true }));
 try {
 await plansApi.update(p.id, { active: !p.active });
 await refresh();
 } catch (err) {
 setEditError((cur) => ({ ...cur, [p.id]: err instanceof Error ? err.message : "Toggle failed" }));
 } finally {
 setSaving((cur) => ({ ...cur, [p.id]: false }));
 }
 };

 const onDelete = async (id: string) => {
 setSaving((cur) => ({ ...cur, [id]: true }));
 try {
 await plansApi.deactivate(id);
 setConfirmingDelete(null);
 await refresh();
 } catch (err) {
 setEditError((cur) => ({ ...cur, [id]: err instanceof Error ? err.message : "Delete failed" }));
 } finally {
 setSaving((cur) => ({ ...cur, [id]: false }));
 }
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />

 <main className="mx-auto max-w-7xl px-5 py-6 md:py-6 md:py-10">
 <div className="mb-5 flex items-center justify-between gap-3">
 <Link to="/super-admin/dashboard" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Dashboard
 </Link>
 </div>

 <div className="mb-6">
 <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">Pricing</p>
 <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Subscription plans</h1>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 Define the candidate + employer subscription tiers. Edits go live the next time a user visits a subscribe page. Plans linked to historical subscriptions are kept (deactivated, not deleted).
 </p>
 </div>

 {/* Create form */}
 <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className="mb-4 flex items-center gap-2">
 <Plus size={16} className="text-amber-600 dark:text-amber-400" />
 <h2 className="text-base font-semibold tracking-tight">Add a new plan</h2>
 </div>
 <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-6">
 <Field className="sm:col-span-2" label="Key (machine ID)">
 <input value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))} placeholder="emp_sme_quarterly" className={inputClass()} />
 </Field>
 <Field className="sm:col-span-2" label="Display label">
 <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Employer SME · 90 days" className={inputClass()} />
 </Field>
 <Field className="sm:col-span-2" label="Audience">
 <select value={draft.audience} onChange={(e) => setDraft((d) => ({ ...d, audience: e.target.value as ApiPlanAudience }))} className={inputClass()}>
 {(Object.keys(AUDIENCE_LABELS) as ApiPlanAudience[]).map((a) => (
 <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>
 ))}
 </select>
 </Field>
 <Field className="sm:col-span-2" label="Duration (days)">
 <input type="number" min={1} value={draft.durationDays} onChange={(e) => setDraft((d) => ({ ...d, durationDays: Number(e.target.value) }))} className={inputClass()} />
 </Field>
 <Field className="sm:col-span-2" label="Price (₹)">
 <div className="relative">
 <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
 <input type="number" min={0} step={1} value={draft.priceInr} onChange={(e) => setDraft((d) => ({ ...d, priceInr: Number(e.target.value) }))} className={inputClass("pl-8")} />
 </div>
 </Field>
 <Field className="sm:col-span-2" label="GST applies (18%)">
 <div className="flex h-[44px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
 <Checkbox
 tone="amber"
 checked={draft.gstApplies}
 onChange={(checked) => setDraft((d) => ({ ...d, gstApplies: checked }))}
 label={draft.gstApplies ? "Yes — 18% GST on top" : "No"}
 />
 </div>
 </Field>
 <div className="sm:col-span-6 flex items-center justify-end gap-2 pt-1">
 <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-amber-500/30 transition hover:shadow-lg disabled:opacity-60">
 <Plus size={14} /> {creating ? "Creating…" : "Create plan"}
 </button>
 </div>
 </form>
 {createError && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{createError}</p>}
 {createSuccess && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">{createSuccess}</p>}
 </motion.section>

 {/* Existing plans */}
 {loadError && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{loadError}</p>}
 {loading ? (
 <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading plans…</p>
 ) : (
 <div className="flex flex-col gap-6">
 {(Object.keys(grouped) as ApiPlanAudience[]).map((aud) => (
 <section key={aud} className="rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
 <div className="mb-4 flex items-center gap-2">
 <span className={["rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest", AUDIENCE_COLORS[aud]].join(" ")}>{AUDIENCE_LABELS[aud]}</span>
 <span className="text-xs text-zinc-500 dark:text-zinc-400">{grouped[aud].length} plan{grouped[aud].length === 1 ? "" : "s"}</span>
 </div>
 {grouped[aud].length === 0 ? (
 <p className="text-xs text-zinc-500 dark:text-zinc-400">No plans yet for this audience.</p>
 ) : (
 <ul className="flex flex-col gap-3">
 {grouped[aud].map((p) => {
 const e = editing[p.id];
 const isSaving = !!saving[p.id];
 const err = editError[p.id];
 return (
 <li key={p.id} className={["rounded-2xl border p-4", p.active ? "border-zinc-200 " : "border-dashed border-zinc-300 bg-zinc-50/40 dark:border-zinc-700 dark:bg-zinc-950/30"].join(" ")}>
 {e ? (
 /* ----- Edit mode ----- */
 <div className="grid gap-3 sm:grid-cols-6">
 <Field className="sm:col-span-2" label="Label">
 <input value={e.label} onChange={(ev) => setEditing((cur) => ({ ...cur, [p.id]: { ...e, label: ev.target.value } }))} className={inputClass()} />
 </Field>
 <Field label="Duration (days)">
 <input type="number" min={1} value={e.durationDays} onChange={(ev) => setEditing((cur) => ({ ...cur, [p.id]: { ...e, durationDays: Number(ev.target.value) } }))} className={inputClass()} />
 </Field>
 <Field label="Price (₹)">
 <input type="number" min={0} value={e.priceInr} onChange={(ev) => setEditing((cur) => ({ ...cur, [p.id]: { ...e, priceInr: Number(ev.target.value) } }))} className={inputClass()} />
 </Field>
 <Field label="GST">
 <div className="flex h-[44px] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
 <Checkbox
 tone="amber"
 checked={e.gstApplies}
 onChange={(checked) => setEditing((cur) => ({ ...cur, [p.id]: { ...e, gstApplies: checked } }))}
 label={e.gstApplies ? "Yes" : "No"}
 size="sm"
 />
 </div>
 </Field>
 <Field label="Sort order">
 <input type="number" min={0} value={e.sortOrder} onChange={(ev) => setEditing((cur) => ({ ...cur, [p.id]: { ...e, sortOrder: Number(ev.target.value) } }))} className={inputClass()} />
 </Field>
 <div className="sm:col-span-6 flex items-center justify-end gap-2">
 <button onClick={() => cancelEdit(p.id)} disabled={isSaving} className="rounded-2xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Cancel</button>
 <button onClick={() => saveEdit(p)} disabled={isSaving} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/30 disabled:opacity-60">
 <Save size={12} /> {isSaving ? "Saving…" : "Save"}
 </button>
 </div>
 {err && <p className="sm:col-span-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{err}</p>}
 </div>
 ) : (
 /* ----- Display mode ----- */
 <div className="flex flex-wrap items-center gap-4">
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
 {p.label}
 {!p.active && <span className="ml-2 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">Inactive</span>}
 </p>
 <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{p.key}</p>
 </div>
 <div className="text-right">
 <p className="text-base font-bold tracking-tight">
 ₹{inr.format(p.priceInPaise / 100)}
 <span className="ml-1 text-[10px] font-normal text-zinc-500 dark:text-zinc-400">/{p.durationDays} days</span>
 </p>
 <p className="text-[10px] text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-0.5">
 <Receipt size={9} /> {p.gstApplies ? "+ 18% GST" : "No GST"}
 </p>
 </div>
 <div className="flex items-center gap-1">
 <button onClick={() => toggleActive(p)} disabled={isSaving} title={p.active ? "Hide from subscribe pages" : "Show on subscribe pages"} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 {p.active ? <ToggleRight size={14} className="text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft size={14} />}
 </button>
 <button onClick={() => startEdit(p)} disabled={isSaving} className="rounded-full px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Edit</button>
 <button onClick={() => setConfirmingDelete(p.id)} disabled={isSaving} className="rounded-full border border-rose-200 px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10" title="Deactivate plan">
 <Trash2 size={11} />
 </button>
 </div>
 </div>
 )}
 </li>
 );
 })}
 </ul>
 )}
 </section>
 ))}
 </div>
 )}
 </main>

 {/* Delete confirmation modal */}
 <AnimatePresence>
 {confirmingDelete && (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmingDelete(null)}>
 <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
 <h3 className="text-lg font-semibold tracking-tight">Deactivate this plan?</h3>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 It disappears from subscribe pages. Historical subscriptions on this plan are kept for billing + analytics. You can re-activate from the toggle later.
 </p>
 <div className="mt-5 flex justify-end gap-2">
 <button onClick={() => setConfirmingDelete(null)} className="rounded-2xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">Cancel</button>
 <button disabled={saving[confirmingDelete]} onClick={() => onDelete(confirmingDelete)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/30 disabled:opacity-60">
 <Trash2 size={14} /> {saving[confirmingDelete] ? "Deactivating…" : "Deactivate"}
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

/* ---------------- helpers ---------------- */

interface NewPlanDraft { key: string; label: string; audience: ApiPlanAudience; durationDays: number; priceInr: number; gstApplies: boolean }
function emptyDraft(): NewPlanDraft {
 return { key: "", label: "", audience: "EMPLOYER_SME", durationDays: 30, priceInr: 999, gstApplies: true };
}
interface EditDraft { label: string; durationDays: number; priceInr: number; gstApplies: boolean; sortOrder: number }

function inputClass(extra = "") {
 return ["w-full rounded-2xl bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:bg-zinc-950", extra].join(" ");
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
 return (
 <div className={className}>
 <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{label}</label>
 {children}
 </div>
 );
}
