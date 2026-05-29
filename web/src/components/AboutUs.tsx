export function AboutUs() {
  return (
    <section id="about" className="relative px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        {/* Image */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-sky-500/10 blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-xl dark:border-zinc-800">
            <img
              src="/images/background-03.jpg"
              alt="i-Tamil recruitment event"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Copy */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            About us
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Powered by RUDRAA HR Solutions
          </h2>
          <p className="mt-5 text-zinc-600 dark:text-zinc-400">
            <strong className="text-zinc-900 dark:text-zinc-100">RUDRAA Human Resource Solutions Pvt. Ltd.</strong> is a Tamil-Nadu-based recruitment firm built around a simple belief: every student and every professional in our state deserves a fair shot at a great career — regardless of their field, their college, or their hometown.
          </p>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            We connect freshers with their first internship or job, and we help experienced professionals find their next role — across IT, HR, Finance, Sales, Marketing, Supply Chain, BPO, and skilled trades. Employers get a streamlined way to discover the right people without buried CVs and noisy listings.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4">
            <Stat label="Districts covered" value="38" />
            <Stat label="Career fields" value="20+" />
            <Stat label="Languages" value="தமிழ் / EN" />
          </dl>

          <a
            href="#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Talk to our team
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
    </div>
  );
}
