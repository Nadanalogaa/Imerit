import { useState } from "react";
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
    <section id="contact" className="relative px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Contact us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Let's talk
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Questions, partnerships, or feedback — we'd love to hear from you.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          <Card title="Visit us" body={<>RUDRAA HR Solutions Pvt. Ltd.<br />Tamil Nadu, India</>} icon={<MapIcon />} />
          <Card title="Call us" body={<>Mon – Sat, 9am – 7pm<br /><a href="tel:+910000000000" className="text-brand-600 hover:underline dark:text-brand-400">+91 00000 00000</a></>} icon={<PhoneIcon />} />
          <Card title="Email us" body={<><a href="mailto:hello@itamilrecruit.com" className="text-brand-600 hover:underline dark:text-brand-400">hello@itamilrecruit.com</a><br />Replies within 24 hrs</>} icon={<MailIcon />} />
        </div>

        <form
          onSubmit={submit}
          className="mx-auto mt-14 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" value={form.name} onChange={update("name")} placeholder="e.g. Karthick S." />
            <Field label="Email" value={form.email} onChange={update("email")} placeholder="you@example.com" type="email" />
            <Field label="Phone (optional)" value={form.phone} onChange={update("phone")} placeholder="+91 ..." />
            <Field label="Subject" value={form.subject} onChange={update("subject")} placeholder="What's it about?" />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Message</label>
            <textarea
              value={form.message}
              onChange={update("message")}
              rows={5}
              placeholder="How can we help?"
              className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            {sent ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                Got it — we'll be in touch shortly.
              </p>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:shadow-lg hover:shadow-brand-500/30"
            >
              Send message
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function Card({ title, body, icon }: { title: string; body: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
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
      <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
      />
    </div>
  );
}

const MapIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
