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
          <Link
            to="/candidate"
            className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-brand-400/30 to-brand-600/10 blur-2xl transition group-hover:scale-110" />

            <div className="relative">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
                <img
                  src="/icons/candidate.svg"
                  alt=""
                  aria-hidden
                  className="h-10 w-10 brightness-0 invert"
                />
              </div>

              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Profile posting is FREE
              </span>

              <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Are you applying for a job?
              </h3>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Build your profile in minutes — no resume needed. Pick from 5 stunning templates and let employers find you.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Bullet>No CV upload — just structured details</Bullet>
                <Bullet>Email OTP verification</Bullet>
                <Bullet>Browse jobs across Tamil Nadu</Bullet>
              </ul>

              <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition group-hover:gap-3 dark:text-brand-400">
                Start as Candidate
                <Arrow />
              </div>
            </div>
          </Link>

          <Link
            to="/employer"
            className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/30 to-sky-600/10 blur-2xl transition group-hover:scale-110" />

            <div className="relative">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-lg shadow-sky-500/30">
                <img
                  src="/icons/employer.svg"
                  alt=""
                  aria-hidden
                  className="h-10 w-10 brightness-0 invert"
                />
              </div>

              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Job posting is FREE
              </span>

              <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Are you searching for a candidate?
              </h3>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Post unlimited jobs free. Subscribe only when you want to search and reach candidates directly.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Bullet>Free unlimited job posts</Bullet>
                <Bullet>Search candidates by skill, field, location</Bullet>
                <Bullet>Plans for SMEs and large enterprises</Bullet>
              </ul>

              <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition group-hover:gap-3 dark:text-sky-400">
                Start as Employer
                <Arrow />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7" />
      </svg>
      <span>{children}</span>
    </li>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
