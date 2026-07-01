import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
 title: string;
 subtitle?: string;
 children: React.ReactNode;
 bgImage?: string;
 badge?: string;
 tone?: "brand" | "sky";
 panelTitle?: string;
 panelCopy?: string;
 highlights?: string[];
 stats?: { value: string; label: string }[];
}

export function AuthLayout({
 title,
 subtitle,
 children,
 bgImage = "/images/background-04.jpg",
 badge = "i-Tamil Recruit",
 tone = "brand",
 panelTitle,
 panelCopy,
 highlights = [],
 stats = [],
}: Props) {
 const accent = tone === "sky"
 ? {
   solid: "from-sky-500 to-cyan-600",
   soft: "from-sky-500/20 via-cyan-500/10 to-transparent",
   text: "text-sky-200",
   ring: "ring-sky-400/25",
 }
 : {
   solid: "from-brand-500 to-orange-700",
   soft: "from-brand-500/20 via-orange-500/10 to-transparent",
   text: "text-brand-100",
   ring: "ring-brand-400/25",
 };

 return (
 <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
 <div className="absolute inset-0 -z-20">
 <img src={bgImage} alt="" aria-hidden className="h-full w-full object-cover opacity-35" />
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_30%),linear-gradient(135deg,rgba(9,9,11,0.62),rgba(24,24,27,0.76)_45%,rgba(9,9,11,0.9))]" />
 </div>
 <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.22),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.18),transparent_24%),radial-gradient(circle_at_80%_85%,rgba(255,255,255,0.08),transparent_22%)]" />

 <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
 <Link to="/" className="flex items-center gap-2.5">
 <div className={["flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", accent.solid].join(" ")}>
 <span className="text-sm font-bold">iT</span>
 </div>
 <span className="text-sm font-semibold tracking-tight text-white md:text-base">{badge}</span>
 </Link>
 <ThemeToggle />
 </header>

 <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-7xl items-center px-4 pb-5 pt-2 sm:px-6 lg:px-8 lg:pt-4">
 <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
 <section className="hidden flex-col justify-between rounded-[2rem] border border-white/10 bg-white/8 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl lg:flex">
 <div>
 <div className={["inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]", accent.text, accent.ring].join(" ")}>
 <span className="h-1.5 w-1.5 rounded-full bg-current" />
 {badge}
 </div>
 <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-5xl">
 {panelTitle ?? title}
 </h2>
 <p className="mt-4 max-w-lg text-sm leading-6 text-white/72">
 {panelCopy ?? subtitle}
 </p>
 {highlights.length > 0 && (
 <div className="mt-8 grid gap-3">
 {highlights.map((item) => (
 <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/88 backdrop-blur">
 <span className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white", accent.solid].join(" ")}>
 ✓
 </span>
 <span>{item}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 {stats.length > 0 && (
 <div className="mt-8 grid grid-cols-2 gap-3">
 {stats.map((stat) => (
 <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
 <div className="text-2xl font-semibold tracking-tight text-white">{stat.value}</div>
 <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/55">{stat.label}</div>
 </div>
 ))}
 </div>
 )}
 </section>

 {/* The wrapper stretches to the grid row height (set by the left
 panel's intrinsic content), and the card inside fills that height
 with `h-full`. Content stays vertically centred via
 `justify-center` so short forms don't get pinned to the top. */}
 <section className="flex w-full items-stretch justify-center">
 <div className="flex h-full w-full max-w-[30rem] flex-col justify-center rounded-[2rem] border border-white/12 bg-white/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-7 dark:bg-zinc-950/92 dark:shadow-black/50">
 <div className="text-center">
 <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[2rem] dark:text-white">{title}</h1>
 {subtitle && (
 <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{subtitle}</p>
 )}
 </div>
 <div className="mt-6">
 {children}
 </div>
 </div>
 </section>
 </div>
 </main>
 </div>
 );
}
