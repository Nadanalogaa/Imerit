import { useState } from "react";
import { MessageSquareText, Send, ShieldCheck, Lightbulb, Languages, Sparkles } from "lucide-react";
import { get, set } from "../lib/storage";

interface Suggestion {
 id: string;
 name: string;
 email: string;
 message: string;
 createdAt: string;
}

const KEY = "itr.suggestions";

export function SuggestionForm() {
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [message, setMessage] = useState("");
 const [sent, setSent] = useState(false);

 const submit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim() || !message.trim()) return;
 const list = get<Suggestion[]>(KEY, []);
 const next: Suggestion = {
 id: crypto.randomUUID(),
 name,
 email,
 message,
 createdAt: new Date().toISOString(),
 };
 set(KEY, [next, ...list]);
 setSent(true);
 setName("");
 setEmail("");
 setMessage("");
 setTimeout(() => setSent(false), 4000);
 };

 return (
 <section
 id="suggestions"
 className="relative w-full overflow-hidden py-14 md:py-20"
 >
 {/* Full-bleed dark photo background — same cinematic language as the hero */}
 <div className="absolute inset-0 -z-10">
 <img
 src="/images/background-02.jpg"
 alt=""
 aria-hidden
 className="absolute inset-0 h-full w-full scale-105 object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/85 via-zinc-950/80 to-zinc-900/85" />
 {/* Ambient gradient blobs for depth */}
 <div className="absolute -top-32 right-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-500/15 blur-[120px]" />
 <div className="absolute -bottom-32 left-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-brand-500/20 to-amber-500/10 blur-[120px]" />
 </div>

 {/* Full-bleed grid — same padding ladder as the hero */}
 <div className="relative grid items-center gap-8 px-5 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-10 lg:px-14 xl:px-20">
 {/* Pitch — left, white text on the photo */}
 <div>
 <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
 <MessageSquareText size={12} /> Have a suggestion?
 </span>

 <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow md:text-4xl lg:text-5xl">
 We're listening — tell us how to make this{" "}
 <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
 better
 </span>
 </h2>

 <p className="mt-4 max-w-xl text-sm text-white/80 md:text-base">
 Found a bug? Wish a feature existed? Have an idea for the next batch of profile templates? Drop us a note — real humans read every message.
 </p>

 <ul className="mt-6 flex flex-wrap gap-2">
 <Chip icon={<Lightbulb size={12} />}>Shapes what we build next</Chip>
 <Chip icon={<ShieldCheck size={12} />}>Kept private — no spam</Chip>
 <Chip icon={<Languages size={12} />}>Tamil + English</Chip>
 </ul>
 </div>

 {/* Form — right, solid white card so it pops over the dark photo */}
 <form
 onSubmit={submit}
 // Violet tint matching the section's accent — same gradient
 // language as the Candidate / Employer role cards in the hero.
 className="relative overflow-hidden rounded-3xl border border-violet-200/70 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 shadow-2xl shadow-black/40 dark:border-violet-500/30 dark:from-violet-500/10 dark:via-zinc-900 dark:to-fuchsia-500/5 md:p-7"
 >
 {/* Accent stripe at top */}
 <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500" />
 {/* Soft interior tint */}
 <div className="pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-violet-100/60 to-fuchsia-100/30 blur-3xl dark:from-violet-500/15 dark:to-fuchsia-500/10" />

 <div className="relative grid gap-3 sm:grid-cols-2">
 <Field
 label="Your name"
 value={name}
 onChange={setName}
 placeholder="e.g. Karthick S."
 />
 <Field
 label="Email (optional)"
 value={email}
 onChange={setEmail}
 placeholder="you@example.com"
 type="email"
 />
 </div>

 <div className="relative mt-3">
 <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
 Your message
 </label>
 <textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 rows={4}
 placeholder="Tell us what's on your mind..."
 className="w-full resize-none rounded-lg border border-violet-200/70 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
 />
 </div>

 <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
 <button
 type="submit"
 className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/40 transition hover:scale-[1.03] hover:shadow-violet-500/60"
 >
 <Send size={15} />
 Send suggestion
 </button>
 {sent ? (
 <p className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
 <Sparkles size={11} /> Thank you! Recorded.
 </p>
 ) : (
 <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
 We respond in 1–2 business days.
 </span>
 )}
 </div>
 </form>
 </div>
 </section>
 );
}

function Field({
 label,
 value,
 onChange,
 placeholder,
 type = "text",
}: {
 label: string;
 value: string;
 onChange: (v: string) => void;
 placeholder: string;
 type?: string;
}) {
 return (
 <div>
 <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
 {label}
 </label>
 <input
 type={type}
 value={value}
 placeholder={placeholder}
 onChange={(e) => onChange(e.target.value)}
 className="w-full rounded-lg border border-violet-200/70 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
 />
 </div>
 );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
 return (
 <li className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md border border-zinc-200 dark:border-zinc-800">
 <span className="text-violet-300">{icon}</span>
 {children}
 </li>
 );
}
