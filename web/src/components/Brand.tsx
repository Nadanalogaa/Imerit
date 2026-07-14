import { Link } from "react-router-dom";

/**
 * Single source of truth for the app wordmark. The image itself is the whole
 * lockup — icon + "Tamil Recruit" text + tagline — so callers just pick a
 * height and get a properly-scaled banner.
 *
 * Pass `to` to render as a router `<Link>` (nav / footer); omit `to` for a
 * plain `<img>` (auth pages, hero, print). The `variant` prop controls the
 * pixel height: nav ~ 32-40px, hero ~ 56-72px, footer ~ 40px.
 */
export type BrandSize = "sm" | "md" | "lg" | "xl";

const HEIGHTS: Record<BrandSize, string> = {
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
  xl: "h-20",
};

export function Brand({
  size = "md",
  to,
  className = "",
}: {
  size?: BrandSize;
  to?: string;
  className?: string;
}) {
  const img = (
    <img
      src="/logo-orange.jpeg"
      alt="Tamil Recruit — Job Portal for Skilled Talent"
      className={[HEIGHTS[size], "w-auto object-contain", className].join(" ")}
    />
  );
  if (!to) return img;
  return (
    <Link to={to} className="inline-flex items-center">
      {img}
    </Link>
  );
}
