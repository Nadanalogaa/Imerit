import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Briefcase, ArrowRight, Sparkles, MapPin, Target } from "lucide-react";

interface Slide {
  bg: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}

const SLIDES: Slide[] = [
  {
    bg: "/images/background-04.jpg",
    eyebrow: "The Vision",
    title: (
      <>
        Making Tamil Nadu a{" "}
        <span className="bg-gradient-to-r from-brand-400 to-amber-300 bg-clip-text text-transparent">
          0% unemployment
        </span>{" "}
        state by 2031
      </>
    ),
    description:
      "To play a significant role in making Tamil Nadu a 0% unemployment state by 2031.",
  },
  {
    bg: "/images/background-02.jpg",
    eyebrow: "The Mission",
    title: (
      <>
        Train, place, and{" "}
        <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
          empower the youth
        </span>
      </>
    ),
    description:
      "To empower job aspirants and youth by facilitating training and placing them in the right jobs near to their home locations.",
  },
  {
    bg: "/images/background-03.jpg",
    eyebrow: "Freshers and seasoned pros",
    title: (
      <>
        From your{" "}
        <span className="bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent">
          first internship
        </span>{" "}
        to your next chapter
      </>
    ),
    description:
      "College students chasing their first opportunity, or experienced professionals chasing the next role — stand out and get found.",
  },
  {
    bg: "/images/background-01.png",
    eyebrow: "Free to start. Simple to scale.",
    title: (
      <>
        Post free.{" "}
        <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          Subscribe only when ready.
        </span>
      </>
    ),
    description:
      "Candidates post profiles free. Employers post jobs free. A flexible subscription unlocks applying and candidate search.",
  },
];

export function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      id="home"
      // One viewport tall on common laptops, never less than 620px on md+.
      // Flex column splits the section into a flexible top (slider copy) and
      // a natural-height bottom (role panels) so both fit above the fold.
      className="relative flex w-full flex-col overflow-hidden min-h-[calc(100svh-104px)] md:min-h-[680px] lg:min-h-[720px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Full-bleed background slider */}
      <div className="absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={[
              "absolute inset-0 transition-opacity duration-1000",
              i === idx ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            <img
              src={s.bg}
              alt=""
              className={[
                "absolute inset-0 h-full w-full object-cover transition-transform duration-[10000ms] ease-out",
                i === idx ? "scale-110" : "scale-100",
              ].join(" ")}
            />
          </div>
        ))}
        {/* Dark gradient overlay — heavier at the bottom so the role cards
            keep their contrast against the photo behind them. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/55 to-black/75" />
      </div>

      {/* TOP — slider copy, horizontally centred, pushed slightly toward
          the top of the available space so it doesn't crowd the role cards. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-5 pt-10 text-center md:px-10 md:pt-14 lg:px-14 lg:pt-16 xl:px-20">
        <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/15 px-5 py-2 text-[13px] font-bold uppercase tracking-[0.25em] text-white backdrop-blur-md md:text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {SLIDES[idx].eyebrow}
        </span>

        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg md:text-4xl lg:text-5xl">
          {SLIDES[idx].title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 md:text-base">
          {SLIDES[idx].description}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={[
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-9 bg-white" : "w-2 bg-white/40 hover:bg-white/60",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM — two role cards side-by-side overlapping the lower photo */}
      <div className="relative z-10 px-5 pb-5 pt-3 md:px-10 md:pb-7 md:pt-4 lg:px-14 lg:pb-8 xl:px-20">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <RoleCard
            icon={<GraduationCap size={22} />}
            title="I'm a Candidate"
            tagline="Build a free profile, browse jobs across Tamil Nadu, and apply when you're ready."
            bullets={[
              { icon: <Sparkles size={11} />, label: "Profile free" },
              { icon: <MapPin size={11} />, label: "Jobs near home" },
              { icon: <Target size={11} />, label: "Smart match" },
            ]}
            ctaTo="/candidate/register"
            ctaLabel="Start as Candidate"
            signInTo="/candidate/login"
            tone="brand"
          />
          <RoleCard
            icon={<Briefcase size={22} />}
            title="I'm an Employer"
            tagline="Post jobs for free. Subscribe only when you're ready to search candidates."
            bullets={[
              { icon: <Sparkles size={11} />, label: "Posting free" },
              { icon: <MapPin size={11} />, label: "District-wide" },
              { icon: <Target size={11} />, label: "Ranked apps" },
            ]}
            ctaTo="/employer/register"
            ctaLabel="Start as Employer"
            signInTo="/employer/login"
            tone="sky"
          />
        </div>
      </div>

      {/* Arrows — positioned in the upper-middle of the section so they don't
          collide with the bottom role cards. */}
      <button
        aria-label="Previous"
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-[30%] z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/15 p-2.5 text-white backdrop-blur-md transition hover:bg-white/30 hover:scale-105 md:left-5"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next"
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        className="absolute right-3 top-[30%] z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/15 p-2.5 text-white backdrop-blur-md transition hover:bg-white/30 hover:scale-105 md:right-5"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </section>
  );
}

/* --------------------- Role card (bottom row) --------------------- */

interface BulletItem {
  icon: React.ReactNode;
  label: string;
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  bullets: BulletItem[];
  ctaTo: string;
  ctaLabel: string;
  signInTo: string;
  tone: "brand" | "sky";
}

const TONE: Record<RoleCardProps["tone"], {
  stripe: string;
  iconBg: string;
  iconGlow: string;
  ctaBg: string;
  highlight: string;
}> = {
  brand: {
    stripe: "from-brand-400 via-brand-500 to-amber-500",
    iconBg: "bg-gradient-to-br from-brand-500 to-brand-700",
    iconGlow: "shadow-brand-500/50",
    ctaBg: "bg-gradient-to-r from-brand-500 to-brand-600 shadow-brand-500/40 hover:shadow-brand-500/60",
    highlight: "from-brand-50/80 dark:from-brand-500/10",
  },
  sky: {
    stripe: "from-sky-400 via-sky-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-sky-500 to-sky-700",
    iconGlow: "shadow-sky-500/50",
    ctaBg: "bg-gradient-to-r from-sky-500 to-sky-600 shadow-sky-500/40 hover:shadow-sky-500/60",
    highlight: "from-sky-50/80 dark:from-sky-500/10",
  },
};

function RoleCard({ icon, title, tagline, bullets, ctaTo, ctaLabel, signInTo, tone }: RoleCardProps) {
  const t = TONE[tone];
  return (
    <div
      className={[
        // Solid white surface with a bold drop shadow so the card pops against
        // the photo behind it. Plenty of inner padding for a confident,
        // premium feel.
        "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-zinc-900/50 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/60 md:p-7 lg:p-8",
      ].join(" ")}
    >
      {/* Top accent stripe — thicker for more presence */}
      <div className={["absolute inset-x-0 top-0 h-2 bg-gradient-to-r", t.stripe].join(" ")} />

      {/* Soft interior tint at top-left for warmth */}
      <div className={["pointer-events-none absolute -left-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br blur-3xl opacity-70", t.highlight].join(" ")} />

      <div className="relative flex items-center gap-3.5">
        <div className={["flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105 md:h-16 md:w-16", t.iconBg, t.iconGlow].join(" ")}>
          {icon}
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-3xl">
          {title}
        </h2>
      </div>

      <p className="mt-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-base">{tagline}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[12px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {b.icon} {b.label}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          to={ctaTo}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.03]",
            t.ctaBg,
          ].join(" ")}
        >
          {ctaLabel}
          <ArrowRight size={15} />
        </Link>
        <Link
          to={signInTo}
          className="text-[12px] font-semibold text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Already a member? <span className="text-zinc-900 dark:text-zinc-100">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
