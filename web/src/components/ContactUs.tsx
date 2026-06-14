import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Sparkles } from "lucide-react";
import { get, set } from "../lib/storage";

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
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
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
      {/* Subtle dark backdrop blobs — picks up where SuggestionForm leaves off
          so Suggestion → Contact → Footer reads as one dark sequence. */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-brand-500/20 to-amber-500/10 blur-[140px]" />
        <div className="absolute -bottom-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative grid gap-10 px-5 md:px-10 lg:gap-12 lg:px-14 xl:px-20">
        {/* Header */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
            <MessageCircle size={12} /> Contact us
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white drop-shadow md:text-4xl lg:text-5xl">
            Let's{" "}
            <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
              talk
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/80 md:text-base">
            Questions, partnerships, feedback — we'd love to hear from you.
          </p>
        </div>

        {/* Two-column: contact cards + form */}
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:gap-10">
          {/* Left: contact methods stacked */}
          <div className="grid gap-3 sm:grid-cols-1">
            <ContactCard
              icon={<MapPin size={20} />}
              tone="brand"
              title="Visit us"
              line1="RUDRAA HR Solutions Pvt. Ltd."
              line2="Tamil Nadu, India"
            />
            <ContactCard
              icon={<Phone size={20} />}
              tone="sky"
              title="Call us"
              line1="Mon – Sat, 9am – 7pm"
              line2={<a href="tel:+910000000000" className="font-bold text-sky-700 hover:underline dark:text-sky-300">+91 00000 00000</a>}
            />
            <ContactCard
              icon={<Mail size={20} />}
              tone="violet"
              title="Email us"
              line1={<a href="mailto:hello@itamilrecruit.com" className="font-bold text-violet-700 hover:underline dark:text-violet-300">hello@itamilrecruit.com</a>}
              line2="Replies within 24 hours"
            />
          </div>

          {/* Right: form card — solid white, same surface language as the Suggestion form */}
          <form
            onSubmit={submit}
            // Brand tint to match the section accent — same gradient
            // language as the hero's Candidate card.
            className="relative overflow-hidden rounded-3xl border border-orange-200/70 bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 p-6 shadow-2xl shadow-black/40 dark:border-brand-500/30 dark:from-brand-500/10 dark:via-zinc-900 dark:to-amber-500/5 md:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-brand-600 to-amber-500" />
            <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-brand-100/60 to-amber-100/40 blur-3xl dark:from-brand-500/15 dark:to-amber-500/10" />

            <div className="relative grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={form.name} onChange={update("name")} placeholder="e.g. Karthick S." />
              <Field label="Email" value={form.email} onChange={update("email")} placeholder="you@example.com" type="email" />
              <Field label="Phone (optional)" value={form.phone} onChange={update("phone")} placeholder="+91 ..." />
              <Field label="Subject" value={form.subject} onChange={update("subject")} placeholder="What's it about?" />
            </div>

            <div className="relative mt-3">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Message</label>
              <textarea
                value={form.message}
                onChange={update("message")}
                rows={4}
                placeholder="How can we help?"
                className="w-full resize-none rounded-2xl border border-orange-200/70 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                  <Sparkles size={11} /> Got it — we'll be in touch.
                </p>
              ) : (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  We respond in 1–2 business days.
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
  tone: "brand" | "sky" | "violet";
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
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-2xl border border-orange-200/70 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </div>
  );
}
