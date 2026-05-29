interface Item {
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
}

const ITEMS: Item[] = [
  {
    title: "No CV needed",
    desc: "Just fill simple structured fields — your photo, your education, your skills. We render it beautifully for employers.",
    color: "from-brand-500 to-amber-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </svg>
    ),
  },
  {
    title: "5 stunning templates",
    desc: "Pick a profile look that fits you — Classic, Modern, Creative, Corporate, or Tech Mono. Always one page, always polished.",
    color: "from-emerald-500 to-teal-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Built for every field",
    desc: "IT, HR, Sales, Finance, Supply Chain, BPO, vocational trades — Tamil Nadu's full talent pool, not just one industry.",
    color: "from-violet-500 to-fuchsia-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "Tamil Nadu first",
    desc: "Made in Tamil Nadu, for Tamil Nadu. We know our cities, our colleges, our companies, and what local employers really look for.",
    color: "from-sky-500 to-cyan-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

export function WhyUs() {
  return (
    <section id="why" className="relative px-6 py-20 md:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950" />

      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Why choose us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            A recruitment platform that actually fits Tamil Nadu
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
            We're not another generic job board. Every part of i-Tamil Recruit is designed for our students, our professionals, and our employers — across every field, every district.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((it) => (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div
                className={[
                  "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                  it.color,
                ].join(" ")}
              >
                <div className="h-6 w-6">{it.icon}</div>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">{it.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
