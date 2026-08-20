interface Item {
 title: string;
 desc: React.ReactNode;
 color: string;
 icon: React.ReactNode;
}

// Reusable inline emphasis matching the source doc's brand-orange
// bolding (#BF4E14 ≈ brand-700). Reads well against light + dark cards.
function Emph({ children, plain = false }: { children: React.ReactNode; plain?: boolean }) {
 return (
 <strong
 className={
 plain
 ? "font-semibold text-zinc-900 dark:text-zinc-100"
 : "font-semibold text-brand-600 dark:text-brand-400"
 }
 >
 {children}
 </strong>
 );
}

const ITEMS: Item[] = [
 {
 title: "Focus on our Young Aspirants",
 desc: (
 <>
 Our special focus is on creating <Emph>Part-Time Job</Emph> opportunities for college students through our <Emph plain>"Earn While You Learn"</Emph> initiative. We also facilitate <Emph>Internship</Emph> and <Emph>Apprenticeship</Emph> opportunities, helping students gain practical experience while pursuing their education.
 </>
 ),
 color: "from-brand-500 to-amber-500",
 icon: (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
 <path d="M6 12v5c3 3 9 3 12 0v-5" />
 </svg>
 ),
 },
 {
 title: "5 Stunning Templates",
 desc: (
 <>
 Highlight your skills and achievements in a concise <Emph>one-page résumé</Emph>. Choose from our professional templates — <Emph>Classic</Emph>, <Emph>Modern</Emph>, <Emph>Creative</Emph>, <Emph>Corporate</Emph>, or <Emph>Tech Mono</Emph>.
 </>
 ),
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
 title: "Update Your Skills First, CV Optional",
 desc: (
 <>
 <Emph>No résumé required.</Emph> Simply provide your education and skills in a structured format, and we'll create a professional profile that attracts the right employers.
 </>
 ),
 color: "from-violet-500 to-fuchsia-500",
 icon: (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M9 11l3 3L22 4" />
 <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
 </svg>
 ),
 },
 {
 title: "Built for Every Industry",
 desc: (
 <>
 Serving businesses across all industries — <Emph>IT and Non-IT</Emph>, <Emph>MSMEs</Emph>, <Emph>large enterprises</Emph>, <Emph>start-ups</Emph>, entrepreneurs, freelancers, and specialised consultants — anyone seeking effective talent-sourcing solutions.
 </>
 ),
 color: "from-sky-500 to-cyan-500",
 icon: (
 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M3 21h18" />
 <path d="M5 21V7l7-4 7 4v14" />
 <path d="M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01" />
 </svg>
 ),
 },
];

export function WhyUs() {
 return (
 <section id="why" className="relative px-6 pt-10 pb-14 scroll-mt-[60px] md:pt-12 md:pb-20">
 <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950" />

 <div className="mx-auto max-w-6xl">
 <div className="text-center">
 <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Our Advantage
 </p>
 <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
 Beyond a Traditional Job Portal —{" "}
 <span className="bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent">
 Built For a Zero-UnEmployment Tamil Nadu
 </span>
 </h2>
 <p className="mt-4 mx-auto max-w-3xl text-zinc-600 dark:text-zinc-400">
 Driven by the vision of creating a{" "}
 <Emph>"Zero-Unemployment" state</Emph>, our specialised sourcing team identifies talent across every district. Powered by recruitment expertise and data analytics, we enable employers to identify the right candidates —{" "}
 <Emph plain>ensuring the perfect fit between talent, skills, and job requirements.</Emph>
 </p>
 <p className="mt-3 mx-auto max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
 For our subscribed candidates, we provide personalised job counselling and career guidance, plus skill-development guidance aligned with real market demand — near their hometown or across the state.
 </p>
 </div>

 <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
 {ITEMS.map((it, i) => (
 <div
 key={i}
 className="group relative overflow-hidden rounded-2xl bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900"
 >
 <div
 className={[
 "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
 it.color,
 ].join(" ")}
 >
 <div className="h-6 w-6">{it.icon}</div>
 </div>
<h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
     {it.title}
 </h3>
 <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
 {it.desc}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>
 );
}
