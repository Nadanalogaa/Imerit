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
  return (
    <section
      id="home"
      className="relative w-full overflow-hidden border-b border-zinc-200/60 bg-gradient-to-b from-zinc-50 to-white py-8 dark:border-zinc-800/60 dark:from-zinc-950 dark:to-zinc-900 md:py-12"
    >
      <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-[3fr_2fr] md:gap-6 md:px-6">
        {/* LEFT: slider — hidden on small screens so role cards dominate the
            mobile first paint per the agreed mobile fallback rule. */}
        <div className="hidden md:block">
          <SliderCard />
        </div>

        {/* RIGHT: stacked role cards (Candidate top, Employer below). */}
        <div className="grid grid-cols-1 gap-4 md:gap-5">
          <RoleCard
            role="candidate"
            icon={<GraduationCap size={22} />}
            title="I'm a Candidate"
            tagline="Build a free profile, browse jobs across Tamil Nadu, and apply when you're ready."
            bullets={[
              { icon: <Sparkles size={11} />, label: "Profile posting is free" },
              { icon: <MapPin size={11} />, label: "Jobs near your home" },
              { icon: <Target size={11} />, label: "Smart match scoring" },
            ]}
            ctaTo="/candidate/register"
            ctaLabel="Start as Candidate"
            signInTo="/candidate/login"
            gradient="from-brand-500 to-amber-500"
            ring="ring-brand-200/40 dark:ring-brand-500/30"
          />
          <RoleCard
            role="employer"
            icon={<Briefcase size={22} />}
            title="I'm an Employer"
            tagline="Post jobs for free. Subscribe only when you're ready to search candidates."
            bullets={[
              { icon: <Sparkles size={11} />, label: "Job posting is free" },
              { icon: <MapPin size={11} />, label: "District-wise reach" },
              { icon: <Target size={11} />, label: "Ranked applicants" },
            ]}
            ctaTo="/employer/register"
            ctaLabel="Start as Employer"
            signInTo="/employer/login"
            gradient="from-sky-500 to-cyan-500"
            ring="ring-sky-200/40 dark:ring-sky-500/30"
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------- Slider card (60% column) --------------------- */

function SliderCard() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="relative h-full min-h-[420px] overflow-hidden rounded-3xl shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-900/5 dark:shadow-black/40 dark:ring-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides (cross-fade) */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={[
            "absolute inset-0 transition-opacity duration-1000",
            i === idx ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <img src={s.bg} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/80" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-8">
        <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {SLIDES[idx].eyebrow}
        </span>

        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-white drop-shadow md:text-3xl lg:text-4xl">
          {SLIDES[idx].title}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">{SLIDES[idx].description}</p>

        {/* Dots */}
        <div className="mt-6 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={[
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Arrows */}
      <button
        aria-label="Previous"
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next"
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </div>
  );
}

/* --------------------- Role card (right column) --------------------- */

interface BulletItem {
  icon: React.ReactNode;
  label: string;
}

interface RoleCardProps {
  role: "candidate" | "employer";
  icon: React.ReactNode;
  title: string;
  tagline: string;
  bullets: BulletItem[];
  ctaTo: string;
  ctaLabel: string;
  signInTo: string;
  gradient: string; // tailwind "from-xxx to-yyy"
  ring: string;
}

function RoleCard({ icon, title, tagline, bullets, ctaTo, ctaLabel, signInTo, gradient, ring }: RoleCardProps) {
  return (
    <div className={["relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg shadow-zinc-900/5 ring-1 transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-zinc-900 dark:shadow-black/30 md:p-6", ring].join(" ")}>
      {/* Soft accent stripe top */}
      <div className={["absolute inset-x-0 top-0 h-1 bg-gradient-to-r", gradient].join(" ")} />

      <div className="mb-3 flex items-center gap-3">
        <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", gradient].join(" ")}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-xl">
          {title}
        </h2>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{tagline}</p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {b.icon} {b.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          to={ctaTo}
          className={["inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg", gradient].join(" ")}
        >
          {ctaLabel}
          <ArrowRight size={14} />
        </Link>
        <Link
          to={signInTo}
          className="text-xs font-semibold text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Already have an account? <span className="text-zinc-900 dark:text-zinc-100">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
