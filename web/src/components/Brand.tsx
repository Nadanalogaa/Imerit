import { Link } from "react-router-dom";

/**
 * Single source of truth for the app wordmark. The image itself is the whole
 * lockup — icon + "Tamil Recruit" text + tagline — so callers just pick a
 * height and get a properly-scaled banner.
 *
 * Two art files ship so the wordmark stays legible in both themes:
 *   - /logo-dark.png   — dark ink, used on light theme (default)
 *   - /logo-white.png  — white ink, used on dark theme
 *
 * We render BOTH `<img>`s and toggle visibility with `dark:hidden` /
 * `hidden dark:inline-block`. That's cheaper than JS + no flicker on
 * theme swap since browsers pre-decode both variants once.
 *
 * Both files are pre-trimmed of transparent padding at build time (see
 * scripts/trim-logos.py or `logo/` folder README) so the sizes here map
 * directly to visible glyph height. Sizes: nav ~ 32-40px, hero ~ 56-72px.
 */
export type BrandSize = "sm" | "md" | "lg" | "xl";

const HEIGHTS: Record<BrandSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

const ALT = "i-Tamil Recruit — Job Portal for Skilled Talent";

export function Brand({
  size = "md",
  to,
  className = "",
  forceTheme,
}: {
  size?: BrandSize;
  to?: string;
  className?: string;
  /**
   * Bypass the site's dark/light toggle and pin the logo to a specific
   * variant. Used on always-dark surfaces like the AuthLayout side panel
   * (which stays dark even when the site is in light mode) so the logo's
   * contrast doesn't depend on the visitor's theme choice.
   *
   *   forceTheme="dark"  → always render the white-ink logo
   *   forceTheme="light" → always render the dark-ink logo
   *   undefined          → default: follow the theme via `dark:` classes
   */
  forceTheme?: "light" | "dark";
}) {
  const wrapClass = ["inline-flex items-center", className].join(" ");
  const imgClass = [HEIGHTS[size], "w-auto object-contain"].join(" ");

  let art: React.ReactNode;
  if (forceTheme === "dark") {
    // Explicit dark surfaces (AuthLayout side panel) still use the
    // white-ink variant so the wordmark stays legible against a solid
    // dark background.
    art = <img src="/logo-white.png" alt={ALT} className={imgClass} />;
  } else {
    // Everywhere else: always render the light-theme (dark-ink) logo.
    // Product decision — the brand should look identical in both site
    // themes; the old dark-mode swap to logo-white.png changed the
    // visual identity depending on the visitor's theme preference,
    // which felt off-brand. If the logo becomes hard to read against a
    // dark background later, add a subtle rounded white plate here
    // instead of switching art files.
    art = <img src="/logo-dark.png" alt={ALT} className={imgClass} />;
  }

  if (!to) return <span className={wrapClass}>{art}</span>;
  return (
    <Link to={to} className={wrapClass}>
      {art}
    </Link>
  );
}
