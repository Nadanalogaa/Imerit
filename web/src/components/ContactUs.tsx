import { useState } from "react";
import { Mail, MapPin, Send, Sparkles, Lightbulb, Phone } from "lucide-react";
import { get, set } from "../lib/storage";
import { handlePasteSanitized } from "../lib/sanitizePaste";

interface Contact {
 id: string;
 name: string;
 email: string;
 phone: string;
 subject: string;
 message: string;
 createdAt: string;
}

const KEY = "itr.contacts";

export function ContactUs() {
 const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
 const [sent, setSent] = useState(false);

 const submit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.name.trim() || !form.message.trim()) return;
 const list = get<Contact[]>(KEY, []);
 const next: Contact = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form };
 set(KEY, [next, ...list]);
 setSent(true);
 setForm({ name: "", email: "", phone: "", subject: "", message: "" });
 setTimeout(() => setSent(false), 4000);
 };

 const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
 setForm({ ...form, [k]: e.target.value });

 return (
 <section
 id="contact"
 className="relative w-full overflow-hidden bg-zinc-950 py-14 md:py-20"
 >
 <div className="absolute inset-0 -z-10">
 <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
 <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-brand-500/20 to-amber-500/10 blur-[140px]" />
 <div className="absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/10 blur-[140px]" />
 </div>

 <div className="relative grid gap-10 px-5 md:px-10 lg:gap-12 lg:px-14 xl:px-20">
 {/* Header */}
 <div className="text-center">
 <h2 className="text-3xl font-semibold tracking-tight text-white drop-shadow md:text-4xl lg:text-5xl">
 Contact{" "}
 <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
 Us
 </span>
 </h2>
 <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 md:text-base">
 We Believe Your <span className="font-semibold text-white">Feedback</span> Drives Our Growth
 </p>
 </div>

 {/* Two-column: contact cards + form */}
 <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:gap-10">
 {/* Left: contact methods stacked */}
 <div className="grid gap-3 sm:grid-cols-1">
 <ContactCard
 icon={<MapPin size={20} />}
 tone="brand"
 title="Our Presence"
 line1="RUDRAA HR Solutions Pvt. Ltd."
 line2={
 <>
 <span className="font-semibold text-zinc-700 dark:text-zinc-300">RO:</span> Salem
 <span className="mx-1 text-zinc-400">·</span>
 <span className="font-semibold text-zinc-700 dark:text-zinc-300">Branches:</span> Chennai, Hosur
 </>
 }
 />
 <ContactCard
 icon={<Lightbulb size={20} />}
 tone="amber"
 title="How can we improve?"
 line1="Your suggestions shape the platform."
 line2="Every message reaches the founding team."
 />
 <ContactCard
 icon={<Mail size={20} />}
 tone="violet"
 title="Email"
 line1={
 <a
 href="mailto:Service@itamilrecruit.net"
 className="font-bold text-violet-700 hover:underline dark:text-violet-300"
 >
 Service@itamilrecruit.net
 </a>
 }
 line2="Will respond within 48 hours / 2 working days"
 />
 <ContactCard
 icon={<Phone size={20} />}
 tone="sky"
 title="Contacts"
 line1={
 <>
 <span className="font-semibold text-zinc-800 dark:text-zinc-200">Mobile</span>
 <span className="ml-1 text-zinc-500 dark:text-zinc-400">(WhatsApp only)</span>
 </>
 }
 line2="Monday to Saturday · 10 AM to 6 PM"
 />
 </div>

 {/* Right: form card */}
 <form
 onSubmit={submit}
 className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 p-6 shadow-2xl shadow-black/40 dark:border-brand-500/30 dark:from-brand-500/10 dark:via-zinc-900 dark:to-amber-500/5 md:p-7"
 >
 <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-brand-600 to-amber-500" />
 <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-brand-100/60 to-amber-100/40 blur-3xl dark:from-brand-500/15 dark:to-amber-500/10" />

 <div className="relative grid gap-3 sm:grid-cols-2">
 <Field label="Full name" required value={form.name} onChange={update("name")} placeholder="e.g. Karthick S." />
 <Field label="Email (optional)" value={form.email} onChange={update("email")} placeholder="you@example.com" type="email" />
 <Field label="Phone (optional)" value={form.phone} onChange={update("phone")} placeholder="+91 ..." />
 <Field label="Subject" value={form.subject} onChange={update("subject")} placeholder="What's it about?" />
 </div>

 <div className="relative mt-3">
 <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
 We would love to hear your "Questions &amp; Suggestions"
 </label>
 <textarea
 value={form.message}
 onChange={update("message")}
 onPaste={(e) => handlePasteSanitized(e, (v) => setForm({ ...form, message: v }))}
 rows={5}
 required
 placeholder="Share your questions, feedback, or suggestions here..."
 className="w-full resize-none rounded-lg border border-orange-200/70 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
 />
 </div>

 <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
 <button
 type="submit"
 className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/40 transition hover:scale-[1.03] hover:shadow-brand-500/60"
 >
 <Send size={15} />
 Send message
 </button>
 {sent ? (
 <p className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
 <Sparkles size={11} /> Got it — we'll respond within 48 hours.
 </p>
 ) : (
 <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
 Response within 48 hours / 2 working days.
 </span>
 )}
 </div>
 </form>
 </div>
 </div>
 </section>
 );
}

/* ------------------- helpers ------------------- */

interface ContactCardProps {
 icon: React.ReactNode;
 title: string;
 line1: React.ReactNode;
 line2: React.ReactNode;
 tone: "brand" | "sky" | "violet" | "amber";
}

const CARD_TONE: Record<ContactCardProps["tone"], {
 iconBg: string;
 iconGlow: string;
 stripe: string;
 bg: string;
 border: string;
}> = {
 brand: {
 iconBg: "bg-gradient-to-br from-brand-500 to-brand-700",
 iconGlow: "shadow-brand-500/40",
 stripe: "from-brand-400 to-amber-500",
 bg: "bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 dark:from-brand-500/10 dark:via-zinc-900 dark:to-amber-500/5",
 border: "border-orange-200/70 dark:border-brand-500/30",
 },
 amber: {
 iconBg: "bg-gradient-to-br from-amber-500 to-yellow-600",
 iconGlow: "shadow-amber-500/40",
 stripe: "from-amber-400 to-yellow-500",
 bg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-500/10 dark:via-zinc-900 dark:to-orange-500/5",
 border: "border-amber-200/70 dark:border-amber-500/30",
 },
 sky: {
 iconBg: "bg-gradient-to-br from-sky-500 to-sky-700",
 iconGlow: "shadow-sky-500/40",
 stripe: "from-sky-400 to-cyan-500",
 bg: "bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 dark:from-sky-500/10 dark:via-zinc-900 dark:to-cyan-500/5",
 border: "border-sky-200/70 dark:border-sky-500/30",
 },
 violet: {
 iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
 iconGlow: "shadow-violet-500/40",
 stripe: "from-violet-400 to-fuchsia-500",
 bg: "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-500/10 dark:via-zinc-900 dark:to-fuchsia-500/5",
 border: "border-violet-200/70 dark:border-violet-500/30",
 },
};

function ContactCard({ icon, title, line1, line2, tone }: ContactCardProps) {
 const t = CARD_TONE[tone];
 return (
 <div className={["group relative overflow-hidden rounded-2xl border p-5 shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:shadow-black/40", t.bg, t.border].join(" ")}>
 <div className={["absolute inset-x-0 top-0 h-1 bg-gradient-to-r", t.stripe].join(" ")} />
 <div className="flex items-start gap-3">
 <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform group-hover:scale-105", t.iconBg, t.iconGlow].join(" ")}>
 {icon}
 </div>
 <div>
 <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
 <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
 {line1}
 <br />
 {line2}
 </p>
 </div>
 </div>
 </div>
 );
}

function Field({
 label,
 value,
 onChange,
 placeholder,
 type = "text",
 required,
}: {
 label: string;
 value: string;
 onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
 placeholder: string;
 type?: string;
 required?: boolean;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
 {label}
 {required ? <span className="ml-1 text-brand-500">*</span> : null}
 </label>
 <input
 type={type}
 value={value}
 placeholder={placeholder}
 onChange={onChange}
 required={required}
 className="w-full rounded-lg border border-orange-200/70 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
 />
 </div>
 );
}
