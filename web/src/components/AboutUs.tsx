export function AboutUs() {
 return (
 <section id="about" className="relative px-6 py-14 md:py-20">
 <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
 {/* Image */}
 <div className="relative">
 <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-500/20 to-sky-500/10 blur-2xl" />
 <div className="overflow-hidden rounded-3xl shadow-xl ">
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
 iTamil Recruit — for Tamil Nadu &amp; Puducherry
 </h2>
 <p className="mt-5 text-zinc-600 dark:text-zinc-400">
 <strong className="text-zinc-900 dark:text-zinc-100">iTamil Recruit</strong> (owned by <strong className="text-zinc-900 dark:text-zinc-100">Rudraa HR Solutions Pvt Ltd</strong>) is a recruitment firm dedicated to helping job aspirants by providing accurate and reliable information about employment opportunities.
 </p>
 <p className="mt-4 text-zinc-600 dark:text-zinc-400">
 For employers, we simplify recruitment by enabling our recruiters to identify and source suitable candidates <strong className="text-zinc-900 dark:text-zinc-100">district-wise</strong> based on specific job requirements. Our portal and mobile app provide real-time updates on current vacancies and evolving skill requirements across diverse industrial sectors.
 </p>
 <p className="mt-4 text-zinc-600 dark:text-zinc-400">
 We help students and job seekers discover their natural talents and enhance their knowledge and skills in line with industry requirements — empowering individuals to become self-reliant and contributing to the social development and economic growth of <strong className="text-zinc-900 dark:text-zinc-100">Tamil Nadu &amp; Puducherry</strong>.
 </p>

 <dl className="mt-8 grid grid-cols-3 gap-4">
 <Stat label="Districts covered" value="38" />
 <Stat label="Region" value="TN + Puducherry" />
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
 <div className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
 <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
 <dd className="mt-1 text-2xl font-semibold tracking-tight">{value}</dd>
 </div>
 );
}
