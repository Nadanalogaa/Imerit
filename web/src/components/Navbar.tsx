import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { SignInMenu } from "./SignInMenu";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { NotificationBell } from "./NotificationBell";
import { useAuth, HOME_PATH, type Role } from "../store/auth";

/**
 * Marketing nav — anchor links that only resolve on the landing page (`/`).
 * Used for visitors who haven't signed in yet.
 */
const PUBLIC_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Why Us", href: "#why" },
  { label: "About", href: "#about" },
  { label: "Suggestions", href: "#suggestions" },
  { label: "Contact", href: "#contact" },
];

/**
 * Role-specific app navigation shown to authenticated users. These are real
 * routes (not anchors), so they work from any page in the app.
 */
const APP_LINKS: Record<Role, { label: string; to: string }[]> = {
  candidate: [
    { label: "Dashboard", to: "/candidate/dashboard" },
    { label: "Browse jobs", to: "/candidate/jobs" },
    { label: "My applications", to: "/candidate/applications" },
    { label: "Saved", to: "/candidate/saved" },
  ],
  employer: [
    { label: "Dashboard", to: "/employer/dashboard" },
    { label: "Post a job", to: "/employer/jobs/new" },
    { label: "My jobs", to: "/employer/my-jobs" },
    { label: "Candidates", to: "/employer/candidates" },
  ],
  admin: [
    { label: "Dashboard", to: "/admin/dashboard" },
    { label: "Candidates", to: "/admin/candidates" },
    { label: "Employers", to: "/admin/employers" },
    { label: "Subscriptions", to: "/admin/subscriptions" },
  ],
  super_admin: [
    { label: "Overview", to: "/super-admin/dashboard" },
    { label: "Candidates", to: "/admin/candidates" },
    { label: "Employers", to: "/admin/employers" },
    { label: "Admins", to: "/super-admin/admins" },
    { label: "Plans", to: "/super-admin/plans" },
  ],
};

/**
 * Single source of truth for menu-item state styling. Idle stays neutral,
 * hover lifts into a soft brand tint (light orange, matching brand-50),
 * and the currently-active route flips to the full brand gradient — the
 * same pill treatment as the "Browse jobs" CTA elsewhere in the app.
 */
const MENU_ITEM_BASE = "rounded-full px-4 py-2 text-sm font-medium transition";
const MENU_ITEM_IDLE =
  "text-zinc-600 hover:bg-brand-50 hover:text-brand-700 dark:text-zinc-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300";
const MENU_ITEM_ACTIVE =
  "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30";

/** Same tokens, block-layout variant for the mobile hamburger dropdown. */
const MOBILE_ITEM_BASE = "block rounded-xl px-4 py-3 text-sm font-medium transition";
const MOBILE_ITEM_IDLE =
  "text-zinc-700 hover:bg-brand-50 hover:text-brand-700 dark:text-zinc-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300";
const MOBILE_ITEM_ACTIVE =
  "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useAuth((s) => s.currentUser);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Logo destination depends on session state. Logged-in users go to their
  // own dashboard so they never bounce back to the marketing site by accident.
  const logoHref = user ? HOME_PATH[user.role] : "/";
  const appLinks = user ? APP_LINKS[user.role] : null;

  /** Route match — treat sub-paths (e.g. /candidate/jobs/123) as active
   *  under the parent /candidate/jobs so drilling into a detail keeps the
   *  parent nav item highlighted. */
  const isActive = (to: string) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to + "/"));

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all",
        scrolled
          ? "border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl /60 dark:bg-zinc-950/80"
          : "border-b border-transparent bg-white/50 backdrop-blur-md dark:bg-zinc-950/50",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link to={logoHref} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <span className="text-sm font-bold">iT</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight md:text-base">i-Tamil Recruit</span>
            <span className="hidden text-[10px] text-zinc-500 md:block dark:text-zinc-400">by RUDRAA HR Solutions</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {appLinks
            ? appLinks.map((l) => {
                const active = isActive(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    aria-current={active ? "page" : undefined}
                    className={[MENU_ITEM_BASE, active ? MENU_ITEM_ACTIVE : MENU_ITEM_IDLE].join(" ")}
                  >
                    {l.label}
                  </Link>
                );
              })
            : PUBLIC_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={[MENU_ITEM_BASE, MENU_ITEM_IDLE].join(" ")}
                >
                  {l.label}
                </a>
              ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden "
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6l-12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-zinc-200/60 bg-white/95 px-5 py-3 backdrop-blur-xl lg:hidden /60 dark:bg-zinc-950/95">
          {appLinks
            ? appLinks.map((l) => {
                const active = isActive(l.to);
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={[MOBILE_ITEM_BASE, active ? MOBILE_ITEM_ACTIVE : MOBILE_ITEM_IDLE].join(" ")}
                  >
                    {l.label}
                  </Link>
                );
              })
            : (
              <>
                {PUBLIC_LINKS.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={[MOBILE_ITEM_BASE, MOBILE_ITEM_IDLE].join(" ")}
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
              </>
            )}
        </nav>
      )}
    </header>
  );
}
