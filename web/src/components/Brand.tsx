import { Link } from "react-router-dom";

/**
 * Single source of truth for the app wordmark. The image itself is the whole
 * lockup — icon + "Tamil Recruit" text + tagline — so callers just pick a
 * height and get a properly-scaled banner.
 *
 * Product decision: the wordmark is ALWAYS the dark-ink `/logo-dark.png`,
 * even on the dark theme, the AuthLayout side panel, and the footer. The
 * brand should read the same everywhere; theme-driven art swaps changed
 * the visual identity depending on the visitor's preference, which felt
 * off-brand. `/logo-white.png` is deprecated and no longer referenced —
 * `forceTheme` is kept only for prop compatibility with older callers.
 *
 * The file is pre-trimmed of transparent padding at build time (see
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
  forceTheme: _forceTheme,
}: {
  size?: BrandSize;
  to?: string;
  className?: string;
  /**
   * Deprecated — kept only so callers that still pass `forceTheme="dark"`
   * don't error. The logo is ALWAYS `/logo-dark.png` now, on every
   * surface. Remove this prop at the next brand-component sweep.
   */
  forceTheme?: "light" | "dark";
}) {
  const wrapClass = ["inline-flex items-center", className].join(" ");
  const imgClass = [HEIGHTS[size], "w-auto object-contain"].join(" ");
  const art = <img src="/logo-dark.png" alt={ALT} className={imgClass} />;

  if (!to) return <span className={wrapClass}>{art}</span>;
  return (
    <Link to={to} className={wrapClass}>
      {art}
    </Link>
  );
}
