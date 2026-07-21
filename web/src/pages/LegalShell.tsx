import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for the three legal pages (Terms, Refund, Privacy).
 * Keeps the layout + typography identical across all three; each
 * page just supplies its own <h1>-worth of body copy.
 */
export function LegalShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string; // ISO date
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <ArrowLeft size={14} /> Home
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: {new Date(lastUpdated).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/*
        Long-form typography — tuned for readable line length, generous
        line-height, subtle heading treatment. Applied via a wrapping
        class so we don't have to sprinkle prose classes everywhere.
      */}
      <article className="prose-legal">{children}</article>

      <style>{`
        .prose-legal {
          font-size: 14.5px;
          line-height: 1.7;
          color: rgb(63 63 70);
        }
        html.dark .prose-legal { color: rgb(212 212 216); }
        .prose-legal p { margin: 0 0 14px; }
        .prose-legal h2 {
          margin: 28px 0 10px;
          font-size: 17px;
          font-weight: 600;
          color: rgb(24 24 27);
        }
        html.dark .prose-legal h2 { color: rgb(244 244 245); }
        .prose-legal ul { margin: 0 0 14px 20px; }
        .prose-legal li { margin: 4px 0; }
        .prose-legal a { color: rgb(234 88 12); }
        html.dark .prose-legal a { color: rgb(251 146 60); }
        .prose-legal strong { color: rgb(24 24 27); }
        html.dark .prose-legal strong { color: rgb(244 244 245); }
      `}</style>
    </main>
  );
}
