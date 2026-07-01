import { Link } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Props {
  icon: React.ReactNode;
  /** Small label above the number — e.g. "Candidates" */
  label: string;
  /** Big headline number or formatted string */
  value: number | string;
  /** Optional supporting line — e.g. "1 with CV · 0 pending" */
  sub?: string;
  /** Gradient tokens for the icon tile (e.g. "from-brand-500 to-amber-500") */
  accent: string;
  /** Where clicking the tile takes the admin — required for consistency. */
  to: string;
  /** Optional 7-value series for the inline sparkline. Empty = no chart. */
  trend?: number[];
  /** Optional right-side badge — e.g. pending count. */
  badge?: number;
  variants?: Variants;
}

/**
 * The single stat tile used across Admin + Super-admin dashboards. Every
 * tile is a real Link with a hover arrow — no more "stats that look
 * clickable but aren't" or "tiles that look like stats but do nothing".
 * Compact layout keeps big number + label on one baseline; the sparkline
 * anchors the bottom so the eye scans down through: label → number → trend.
 */
export function StatTile({ icon, label, value, sub, accent, to, trend, badge, variants }: Props) {
  return (
    <motion.div variants={variants} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className="group relative flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition hover:shadow-xl dark:bg-zinc-900 dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
      >
        {/* Top row — icon + click-hint arrow. The arrow makes the tile's
            interactivity obvious without needing hover to discover. */}
        <div className="flex items-start justify-between">
          <div className={["inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", accent].join(" ")}>
            {icon}
          </div>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400">
            <ArrowRight size={12} />
          </span>
        </div>

        {/* Label + number — same visual weight as the previous tiles but
            arranged so the number is the anchor, sub-line is subordinate. */}
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
              +{badge}
            </span>
          )}
        </div>
        {sub && <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>}

        {/* Sparkline — 7 data points by convention. Kept subtle so it
            reads as a decoration; the number remains the primary signal. */}
        {trend && trend.length > 1 && (
          <div className="mt-3 flex items-end gap-2">
            <Sparkline data={trend} accent={accent} />
            <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">7d</span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

/**
 * Simple inline-SVG sparkline. No external chart library dependency —
 * one path element scaled to the container. Accent is only used to
 * derive the stroke gradient id so tiles look tuned to their tone.
 */
function Sparkline({ data, accent }: { data: number[]; accent: string }) {
  const W = 84;
  const H = 20;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);
  // Map values so the max sits at y=2, min at y=H-2 — small breathing room.
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(H - 2 - ((v - min) / range) * (H - 4)).toFixed(1)}`);
  const path = `M ${points.join(" L ")}`;
  const areaPath = `${path} L ${W},${H} L 0,${H} Z`;

  // The gradient id is scoped to the accent so multiple tiles' fills don't
  // collide when several are on screen at once.
  const gradId = `spark-${accent.replace(/[^a-z0-9]/gi, "")}`;
  const stroke = accent.includes("brand") ? "#f97316"
    : accent.includes("sky") ? "#0ea5e9"
    : accent.includes("emerald") ? "#10b981"
    : accent.includes("violet") ? "#8b5cf6"
    : accent.includes("amber") ? "#f59e0b"
    : "#6366f1";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-5 flex-1" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
