import { useState } from "react";
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
      className="relative overflow-hidden px-5 py-14 sm:px-8 sm:py-20 md:py-28"
    >
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background-02.jpg"
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/85 via-zinc-950/80 to-zinc-900/90" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-10">
        <div className="text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">
            Have a suggestion?
          </p>
          <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight sm:text-3xl md:text-5xl">
            We're listening — tell us how to make this better
          </h2>
          <p className="mt-4 text-sm text-white/75 sm:mt-5 sm:text-base">
            Found a bug? Wish a feature existed? Have an idea for the next batch of profile templates? Drop us a note. Real humans read every message.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-white/80 sm:mt-8">
            <Tick>Suggestions help shape what we build next</Tick>
            <Tick>No spam — your details stay with us</Tick>
            <Tick>Available in Tamil and English</Tick>
          </ul>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl sm:p-7"
        >
          <div className="space-y-4">
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
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/80">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Tell us what's on your mind..."
                className="w-full resize-none rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              Send suggestion
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            {sent && (
              <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
                Thank you! Your suggestion has been recorded.
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
      <label className="mb-1.5 block text-xs font-medium text-white/80">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
    </div>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}
