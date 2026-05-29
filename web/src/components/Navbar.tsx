import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { SignInMenu } from "./SignInMenu";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { useAuth } from "../store/auth";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Why Us", href: "#why" },
  { label: "About", href: "#about" },
  { label: "Suggestions", href: "#suggestions" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAuth((s) => s.currentUser);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all",
        scrolled
          ? "border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80"
          : "border-b border-transparent bg-white/50 backdrop-blur-md dark:bg-zinc-950/50",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <span className="text-sm font-bold">iT</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight md:text-base">i-Tamil Recruit</span>
            <span className="hidden text-[10px] text-zinc-500 md:block dark:text-zinc-400">by RUDRAA HR Solutions</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <UserAvatarMenu user={user} />
          ) : (
            <>
              <div className="hidden md:inline-flex">
                <SignInMenu />
              </div>
              <Link
                to="/candidate/register"
                className="hidden rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 lg:inline-flex"
              >
                Apply for Job
              </Link>
            </>
          )}
          <ThemeToggle />
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 lg:hidden dark:border-zinc-800"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-zinc-200/60 bg-white/95 px-5 py-3 backdrop-blur-xl lg:hidden dark:border-zinc-800/60 dark:bg-zinc-950/95">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/candidate"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            Apply for Job
          </Link>
        </nav>
      )}
    </header>
  );
}
