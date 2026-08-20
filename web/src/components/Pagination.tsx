import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Simple pagination footer for a client-side-paginated list. Emits a
 * 1-based page number; parent slices the list to `pageSize` items.
 *
 * Window strategy — always show first + last + a small window around
 * the current page (2 on each side). Ellipses (…) between gaps. This
 * keeps the button strip compact (~7-9 slots) even at page 50.
 *
 * Hidden entirely when there's ≤ 1 page (no scrollbar noise on tiny
 * result sets).
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onChange: (nextPage: number) => void;
}) {
  if (totalPages <= 1) return null;
  const clamped = Math.min(Math.max(1, page), totalPages);

  const first = 1;
  const last = totalPages;
  const windowPages: number[] = [];
  for (let p = clamped - 2; p <= clamped + 2; p++) {
    if (p >= first && p <= last) windowPages.push(p);
  }
  const slots = Array.from(new Set([first, ...windowPages, last])).sort((a, b) => a - b);

  const shownFrom = (clamped - 1) * pageSize + 1;
  const shownTo = Math.min(clamped * pageSize, totalItems);

  const go = (p: number) => {
    if (p < 1 || p > totalPages || p === clamped) return;
    onChange(p);
    // Give the parent a chance to re-render, then scroll the document
    // back to the top so the user sees the new page's first card
    // without hunting for it.
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[12px] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span className="text-zinc-600 dark:text-zinc-400">
        Showing <span className="font-semibold text-zinc-900 dark:text-zinc-100">{shownFrom}–{shownTo}</span> of <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalItems}</span>
      </span>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => go(clamped - 1)}
          disabled={clamped <= 1}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ChevronLeft size={13} /> Prev
        </button>

        {slots.map((p, i) => {
          const prev = slots[i - 1];
          const gap = prev != null && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && <span className="px-1 text-zinc-400">…</span>}
              <button
                type="button"
                onClick={() => go(p)}
                aria-current={p === clamped ? "page" : undefined}
                className={[
                  "inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-[12px] font-semibold transition",
                  p === clamped
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                {p}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => go(clamped + 1)}
          disabled={clamped >= totalPages}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1.5 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </nav>
  );
}
