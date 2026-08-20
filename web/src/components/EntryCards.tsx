import { Link } from "react-router-dom";

export function EntryCards() {
 return (
 <section id="entry" className="relative px-6 py-20 md:py-28">
 <div className="mx-auto max-w-6xl">
 <div className="text-center">
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Choose your path
 </p>
 <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
 Get started in seconds
 </h2>
 <p className="mt-4 text-zinc-600 dark:text-zinc-400">
 Whether you're looking for work or looking for talent — we built this for you.
 </p>
 </div>

 <div className="mt-12 grid gap-6 md:grid-cols-2">
 {/* ---------------------------- Candidate card ---------------------------- */}
 <div className="group relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10 dark:bg-zinc-900">
 <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-brand-400/30 to-brand-600/10 blur-2xl transition group-hover:scale-110" />

 <div className="relative">
 <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
 <img
 src="/icons/candidate.svg"
 alt=""
 aria-hidden
 className="h-10 w-10 brightness-0 invert"
 />
 </div>

 <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
 I'm a Candidate
 </h3>
 <p className="mt-3 text-zinc-600 dark:text-zinc-400">
 Update your profile, highlight your skills, and discover job opportunities.
 </p>

 <div className="mt-5 space-y-2.5">
 <Feature tone="brand">Profile Posting is Free</Feature>
 <Feature tone="brand">Explore Jobs Near Your Hometown Today</Feature>
 </div>

 <div className="mt-7 flex flex-wrap items-center gap-3">
 <Link
 to="/candidate"
 className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
 >
 Start as Candidate <Arrow />
 </Link>
 <span className="text-sm text-zinc-500 dark:text-zinc-400">
 Already a member?{" "}
 <Link
 to="/candidate/login"
 className="font-semibold text-brand-600 underline-offset-2 transition hover:underline dark:text-brand-400"
 >
 Sign In
 </Link>
 </span>
 </div>
 </div>
 </div>

 {/* ---------------------------- Employer card ---------------------------- */}
 <div className="group relative overflow-hidden rounded-3xl bg-white p-6 md:p-8 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10 dark:bg-zinc-900">
 <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/30 to-sky-600/10 blur-2xl transition group-hover:scale-110" />

 <div className="relative">
 <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-500/30">
 <img
 src="/icons/employer.svg"
 alt=""
 aria-hidden
 className="h-10 w-10 brightness-0 invert"
 />
 </div>

 <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
 I'm an Employer
 </h3>
 <p className="mt-3 text-zinc-600 dark:text-zinc-400">
 Job posting is free — unlimited vacancies, live for 45 days. Repost with one click.
 </p>

 <div className="mt-5 space-y-2.5">
 <Feature tone="sky">Browse District-Wise Candidates</Feature>
 <Feature tone="sky">A Simple Subscription to Find the Right Talent</Feature>
 </div>

 <div className="mt-7 flex flex-wrap items-center gap-3">
 <Link
 to="/employer"
 className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg"
 >
 Start as Employer <Arrow />
 </Link>
 <span className="text-sm text-zinc-500 dark:text-zinc-400">
 Already a member?{" "}
 <Link
 to="/employer/login"
 className="font-semibold text-sky-600 underline-offset-2 transition hover:underline dark:text-sky-400"
 >
 Sign In
 </Link>
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>
 );
}

function Feature({ tone, children }: { tone: "brand" | "sky"; children: React.ReactNode }) {
 const dot = tone === "brand"
 ? "bg-brand-500"
 : "bg-sky-500";
 return (
 <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
 <span className={["mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full", dot].join(" ")} />
 <span>{children}</span>
 </div>
 );
}

function Arrow() {
 return (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
 <path d="M5 12h14M12 5l7 7-7 7" />
 </svg>
 );
}
