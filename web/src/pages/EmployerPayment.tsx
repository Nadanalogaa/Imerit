import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, CreditCard, IndianRupee, Lock, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../store/auth";
import { planById, useSubscriptions, gstAmount, type Subscription } from "../store/subscriptions";

export function EmployerPayment() {
 const [params] = useSearchParams();
 const navigate = useNavigate();
 const user = useAuth((s) => s.currentUser)!;
 const addSub = useSubscriptions((s) => s.add);

 const planId = params.get("plan") ?? "";
 const returnTo = params.get("return") ?? "/employer/dashboard";
 const plan = planById(planId);

 const [name, setName] = useState("");
 const [card, setCard] = useState("");
 const [expiry, setExpiry] = useState("");
 const [cvv, setCvv] = useState("");
 const [processing, setProcessing] = useState(false);
 const [success, setSuccess] = useState(false);

 if (!plan) {
 navigate("/employer/subscribe", { replace: true });
 return null;
 }

 const gst = gstAmount(plan.priceInr, plan.gst);
 const total = plan.priceInr + gst;

 const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
 const formatExpiry = (v: string) => {
 const d = v.replace(/\D/g, "").slice(0, 4);
 return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
 };

 const submit = (e: React.FormEvent) => {
 e.preventDefault();
 setProcessing(true);
 setTimeout(() => {
 const now = new Date();
 const exp = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
 const sub: Subscription = {
 id: "sub_" + Math.random().toString(36).slice(2, 10),
 userId: user.id,
 planId: plan.id,
 type: plan.type,
 priceInr: plan.priceInr,
 durationDays: plan.durationDays,
 startedAt: now.toISOString(),
 expiresAt: exp.toISOString(),
 paymentRef: "FAKE_" + Math.random().toString(36).slice(2, 12).toUpperCase(),
 };
 addSub(sub);
 setProcessing(false);
 setSuccess(true);
 setTimeout(() => navigate(returnTo, { replace: true }), 1700);
 }, 1500);
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-3xl px-5 py-6 md:py-6 md:py-10">
 <Link
 to={`/employer/subscribe?return=${encodeURIComponent(returnTo)}`}
 className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
 >
 <ArrowLeft size={14} /> Back to plans
 </Link>

 <AnimatePresence mode="wait">
 {success ? (
 <motion.div key="s" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-12 text-center shadow-2xl shadow-emerald-500/10 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/5">
 <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/40">
 <CheckCircle2 size={42} strokeWidth={2.5} />
 </motion.div>
 <h2 className="mt-5 text-2xl font-semibold tracking-tight">Payment successful</h2>
 <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Your {plan.label} is active. Redirecting...</p>
 <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">Reference: <span className="font-mono">FAKE_xxxxxxxxxx</span></p>
 </motion.div>
 ) : (
 <motion.div key="f" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 md:grid-cols-[1fr_280px]">
 <form onSubmit={submit} className="order-2 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900 md:order-1 md:p-6 md:p-8">
 <div className="flex items-center gap-2">
 <CreditCard size={18} className="text-sky-600 dark:text-sky-400" />
 <h2 className="text-lg font-semibold tracking-tight">Card details</h2>
 <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
 <Lock size={10} /> Demo mode
 </span>
 </div>

 <div className="mt-5 space-y-4">
 <Field label="Cardholder name">
 <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} required />
 </Field>
 <Field label="Card number">
 <input value={card} onChange={(e) => setCard(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric" className={`${inputCls} font-mono tracking-widest`} required />
 </Field>
 <div className="grid grid-cols-2 gap-3">
 <Field label="Expiry (MM/YY)">
 <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/27" inputMode="numeric" className={`${inputCls} font-mono`} required />
 </Field>
 <Field label="CVV">
 <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" className={`${inputCls} font-mono`} required />
 </Field>
 </div>

 <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-70">
 {processing ? (<><Spinner /> Processing payment...</>) : (<><Lock size={14} /> Pay ₹{total.toLocaleString("en-IN")}</>)}
 </button>
 <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
 <ShieldCheck size={12} /> No real charges — demo payment
 </div>
 </div>
 </form>

 <aside className="order-1 rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:from-sky-500/10 dark:to-cyan-500/5 md:order-2">
 <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Order summary</p>
 <h3 className="mt-2 text-base font-semibold tracking-tight">{plan.label}</h3>
 <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">Active for {plan.durationDays} days from today</p>

 <dl className="mt-5 space-y-2 text-sm">
 <Row label="Plan" value={`₹${plan.priceInr.toLocaleString("en-IN")}`} />
 {plan.gst && <Row label="GST (18%)" value={`₹${gst.toLocaleString("en-IN")}`} />}
 <div className="my-2 h-px bg-zinc-200 dark:bg-zinc-800" />
 <Row
 label={<span className="font-bold">Total</span>}
 value={
 <span className="inline-flex items-baseline gap-0.5 font-bold text-zinc-900 dark:text-zinc-100">
 <IndianRupee size={14} />{total.toLocaleString("en-IN")}
 </span>
 }
 />
 </dl>
 </aside>
 </motion.div>
 )}
 </AnimatePresence>
 </main>
 </div>
 );
}

const inputCls = "w-full rounded-2xl bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:bg-zinc-950 dark:placeholder:text-zinc-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
 return (
 <div>
 <label className="mb-1.5 block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
 {children}
 </div>
 );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
 return (
 <div className="flex items-baseline justify-between text-zinc-700 dark:text-zinc-300">
 <span>{label}</span>
 <span>{value}</span>
 </div>
 );
}

function Spinner() {
 return <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />;
}
