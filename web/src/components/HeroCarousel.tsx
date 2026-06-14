import { useEffect, useState } from "react";

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
      className="relative h-[460px] w-full overflow-hidden sm:h-[500px] md:h-[560px]"
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
          <img
            src={s.bg}
            alt=""
            className="absolute inset-0 h-full w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pt-14 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {SLIDES[idx].eyebrow}
        </span>

        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white drop-shadow md:text-5xl">
          {SLIDES[idx].title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
          {SLIDES[idx].description}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#entry"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-lg transition hover:scale-[1.02]"
          >
            Get Started
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="#why"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Why Choose Us
          </a>
        </div>
      </div>

      {/* Arrows */}
      <button
        aria-label="Previous"
        onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/25 md:left-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        aria-label="Next"
        onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur-md transition hover:bg-white/25 md:right-6"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-7 z-20 flex items-center justify-center gap-2">
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
    </section>
  );
}
