import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  bgImage?: string;
}

export function AuthLayout({ title, subtitle, children, bgImage = "/images/background-04.jpg" }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Background image, blurred */}
      <div className="absolute inset-0 -z-10">
        <img src={bgImage} alt="" aria-hidden className="h-full w-full object-cover opacity-40 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/85 to-white/95 dark:from-zinc-950/60 dark:via-zinc-950/85 dark:to-zinc-950/95" />
      </div>

      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <span className="text-sm font-bold">iT</span>
          </div>
          <span className="text-sm font-semibold tracking-tight md:text-base">i-Tamil Recruit</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col px-5 py-8 md:py-16">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/40 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
