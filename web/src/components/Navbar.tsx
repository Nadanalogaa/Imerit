import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brand } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";
import { SignInMenu } from "./SignInMenu";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { NotificationBell } from "./NotificationBell";
import { useAuth, HOME_PATH, type Role } from "../store/auth";

/**
 * Marketing nav — anchor links that only resolve on the landing page (`/`).
 * Used for visitors who haven't signed in yet.
 */
type PublicLink =
  | { label: string; href: string }
  | { label: string; to: string };

const PUBLIC_LINKS: PublicLink[] = [
  { label: "Home", href: "#home" },
  { label: "Our Advantage", href: "#why" },
  { label: "About Us", href: "#about" },
  // "Browse jobs" is a hard route (not an anchor) so it takes visitors
  // to the public listings page. Apply/Save gate to register/login there.
  { label: "Browse Jobs", to: "/jobs" },
  { label: "Contact", href: "#contact" },
];

/**
 * Role-specific app navigation shown to authenticated users. These are real
 * routes (not anchors), so they work from any page in the app.
 */
const APP_LINKS: Record<Role, { label: string; to: string }[]> = {
  candidate: [
    { label: "Dashboard", to: "/candidate/dashboard" },
    { label: "Browse Jobs", to: "/candidate/jobs" },
    { label: "My Applications", to: "/candidate/applications" },
    { label: "Saved", to: "/candidate/saved" },
  ],
  employer: [
    { label: "Dashboard", to: "/employer/dashboard" },
    { label: "Post a Job", to: "/employer/jobs/new" },
    { label: "My Jobs", to: "/employer/my-jobs" },
    { label: "Search Candidates", to: "/employer/candidates" },
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
    // "Admins & staff" — the invite form on this page lets super-admin
    // create both admin/super_admin AND staff accounts; the standalone
    // /super-admin/staff route is kept as an alias/bookmark target but
    // the primary nav entry points here now.
    { label: "Admins & staff", to: "/super-admin/admins" },
    { label: "Plans", to: "/super-admin/plans" },
  ],
  // Staff has its own top-bar rendered inside every /staff/* page (see
  // StaffTopBar in StaffDashboard.tsx). This entry keeps the Role typing
  // exhaustive but the marketing/global Navbar isn't visible on staff
  // routes, so these links only matter if we ever surface the global
  // Navbar for a staff user (which shouldn't happen in the current app).
  staff: [
    { label: "Dashboard", to: "/staff/dashboard" },
    { label: "Employers", to: "/staff/employers" },
    { label: "Post job", to: "/staff/jobs/new" },
    { label: "My jobs", to: "/staff/jobs" },
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

  /* --- Active-section tracking for the public nav ---------------------
   * The marketing nav is anchor-based (#home, #why, #about, #contact)
   * so we watch the four landing sections with an IntersectionObserver
   * and highlight whichever the reader is currently on. When the user
   * is off the landing page (e.g. on /jobs) `activeAnchor` stays empty
   * and the route-based active state takes over. */
  const [activeAnchor, setActiveAnchor] = useState<string>("");
  useEffect(() => {
    if (appLinks) return; // authed nav uses route-matching, not anchors
    if (location.pathname !== "/") {
      setActiveAnchor("");
      return;
    }
    const ids = ["home", "why", "about", "contact"];
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n != null);
    if (nodes.length === 0) return;

    // Track the section closest to the top of the viewport that's still
    // in view. "topmost visible wins" is the pattern users expect from
    // marketing-site scrollspy nav.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveAnchor(`#${visible[0]!.target.id}`);
      },
      // Trigger when a section's top crosses roughly the header height.
      { rootMargin: "-72px 0px -60% 0px", threshold: [0, 0.1, 0.5, 1] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [appLinks, location.pathname]);

  const isPublicLinkActive = (l: PublicLink): boolean => {
    if ("to" in l) return location.pathname === l.to || location.pathname.startsWith(l.to + "/");
    return l.href === activeAnchor;
  };


  /** Which menu item owns the current pathname — longest matching prefix
   *  wins so /staff/jobs/new highlights "Post job" (exact match) and does
   *  NOT also highlight "My jobs" (/staff/jobs prefix). The naive
   *  startsWith check we had before lit up both, because /staff/jobs/new
   *  legitimately starts with /staff/jobs/.
   *
   *  Sub-paths under a link (e.g. /staff/jobs/abc123 → "My jobs") still
   *  highlight the parent, because the parent stays the longest prefix
   *  when no more-specific menu item matches. */
  const activeTo = appLinks
    ? appLinks
        .filter((l) => location.pathname === l.to || location.pathname.startsWith(l.to + "/"))
        .reduce<string | null>((best, l) => (best && best.length >= l.to.length ? best : l.to), null)
    : null;
  const isActive = (to: string) => to === activeTo;

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all",
          scrolled
            ? "border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:bg-zinc-950/80"
            : "border-b border-transparent bg-white/50 backdrop-blur-md dark:bg-zinc-950/50",
        ].join(" ")}
      >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Brand to={logoHref} size="md" />


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
            : PUBLIC_LINKS.map((l) => {
                const active = isPublicLinkActive(l);
                const cls = [MENU_ITEM_BASE, active ? MENU_ITEM_ACTIVE : MENU_ITEM_IDLE].join(" ");
                if ("to" in l) {
                  return (
                    <Link key={l.label} to={l.to} aria-current={active ? "page" : undefined} className={cls}>
                      {l.label}
                    </Link>
                  );
                }
                // Anchor link. On the landing page a plain <a href="#foo">
                // gives us the smooth same-page scroll. Off the landing
                // page we need a real route change to "/" + a hash — use
                // <Link> for client-side nav; the Landing page has an
                // effect that scrolls to the hash after mount.
                if (location.pathname === "/") {
                  return (
                    <a
                      key={l.label}
                      href={l.href}
                      aria-current={active ? "true" : undefined}
                      className={cls}
                    >
                      {l.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={l.label}
                    to={{ pathname: "/", hash: l.href }}
                    aria-current={active ? "true" : undefined}
                    className={cls}
                  >
                    {l.label}
                  </Link>
                );
              })}
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
        <nav className="border-t border-zinc-200/60 bg-white/95 px-5 py-3 backdrop-blur-xl lg:hidden dark:bg-zinc-950/95">
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
                {PUBLIC_LINKS.map((l) => {
                  const active = isPublicLinkActive(l);
                  const cls = [MOBILE_ITEM_BASE, active ? MOBILE_ITEM_ACTIVE : MOBILE_ITEM_IDLE].join(" ");
                  if ("to" in l) {
                    return (
                      <Link
                        key={l.label}
                        to={l.to}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cls}
                      >
                        {l.label}
                      </Link>
                    );
                  }
                  if (location.pathname === "/") {
                    return (
                      <a
                        key={l.label}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "true" : undefined}
                        className={cls}
                      >
                        {l.label}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={l.label}
                      to={{ pathname: "/", hash: l.href }}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "true" : undefined}
                      className={cls}
                    >
                      {l.label}
                    </Link>
                  );
                })}
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
      <div aria-hidden="true" className="h-[60px]" />
    </>
  );
}
