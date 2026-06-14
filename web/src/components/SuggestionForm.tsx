import { useState } from "react";
import { MessageSquareText, Send, ShieldCheck, Lightbulb, Languages } from "lucide-react";
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
      className="relative w-full overflow-hidden border-y border-zinc-200/60 bg-gradient-to-br from-zinc-50 via-white to-violet-50/30 py-10 dark:border-zinc-800/60 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 md:py-14"
    >
      {/* Ambient gradient blobs — same depth language as the hero */}
      <div className="pointer-events-none absolute -top-32 left-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-violet-400/20 to-fuchsia-400/15 blur-[110px] dark:from-violet-500/15 dark:to-fuchsia-500/10" />
      <div className="pointer-events-none absolute -bottom-32 right-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-brand-400/15 to-amber-400/10 blur-[110px] dark:from-brand-500/10 dark:to-amber-500/5" />

      {/* Full-bleed grid, internal padding matches the hero */}
      <div className="relative grid items-center gap-6 px-5 md:grid-cols-[1.1fr_1fr] md:gap-10 md:px-10 lg:px-14 xl:px-20">
        {/* Pitch — left */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
            <MessageSquareText size={11} /> Have a suggestion?
          </span>

          <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl lg:text-4xl">
            We're listening — tell us how to make this{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              better
            </span>
          </h2>

          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 md:text-base">
            Found a bug? Wish a feature existed? Have an idea for the next batch of profile templates? Drop us a note — real humans read every message.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2.5 md:gap-3">
            <Chip icon={<Lightbulb size={12} />}>Shapes what we build next</Chip>
            <Chip icon={<ShieldCheck size={12} />}>No spam — kept private</Chip>
            <Chip icon={<Languages size={12} />}>Tamil + English</Chip>
          </ul>
        </div>

        {/* Form — right */}
        <form
          onSubmit={submit}
          className="rounded-3xl border border-zinc-200/80 bg-white/95 p-5 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:shadow-black/30 md:p-6"
        >
          {/* Name + email on one row for desktop, stacked on mobile */}
          <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="mt-3">
            <label className="mb-1.5 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
              Your message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Tell us what's on your mind..."
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] hover:shadow-violet-500/50"
            >
              Send suggestion
              <Send size={14} />
            </button>
            {sent && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                ✓ Thank you! Recorded.
              </p>
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
      <label className="mb-1.5 block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white/80 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100"
      />
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1 text-[12px] font-semibold text-zinc-700 backdrop-blur-sm dark:border-zinc-700/70 dark:bg-zinc-800/60 dark:text-zinc-300">
      <span className="text-violet-600 dark:text-violet-400">{icon}</span>
      {children}
    </li>
  );
}
