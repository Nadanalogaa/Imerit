import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Eye, Trash2, X } from "lucide-react";
import { useAuth, allUsers } from "../../store/auth";
import { useShortlist } from "../../store/employerPrefs";
import { useProfile } from "../../store/profile";

/** Shared empty fallback — see RecentlyViewedStrip for the rationale. */
const EMPTY_IDS: string[] = [];

/**
 * Floating tray shown at the bottom of the employer candidates page while
 * their shortlist is non-empty. Slides up when the count goes 0 → 1 and
 * slides out when the last card is removed. Two actions:
 *
 *  * **View** — opens a modal with the full shortlist and 1-click nav to
 *    each candidate's detail page.
 *  * **Clear** — empties the shortlist after a confirmation.
 *
 * Right-click / long-press a candidate card elsewhere on the page to
 * toggle membership.
 */
export function ShortlistBar() {
  const employer = useAuth((s) => s.currentUser);
  const byEmployer = useShortlist((s) => s.byEmployer);
  const ids = useMemo(
    () => (employer ? byEmployer[employer.id] ?? EMPTY_IDS : EMPTY_IDS),
    [byEmployer, employer?.id],
  );
  const clear = useShortlist((s) => s.clear);
  const [modalOpen, setModalOpen] = useState(false);

  if (!employer) return null;

  return (
    <>
      <AnimatePresence>
        {ids.length > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-2xl"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-white shadow-2xl shadow-violet-500/40">
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm font-bold tabular-nums">
                {ids.length}
              </span>
              <span className="flex-1 text-sm font-semibold">shortlisted</span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30"
              >
                <Eye size={13} />
                View
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Clear ${ids.length} shortlisted?`)) clear(employer.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/30"
              >
                <Trash2 size={13} />
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {modalOpen && <ShortlistModal onClose={() => setModalOpen(false)} employerId={employer.id} />}
    </>
  );
}

function ShortlistModal({ employerId, onClose }: { employerId: string; onClose: () => void }) {
  const byEmployer = useShortlist((s) => s.byEmployer);
  const ids = useMemo(
    () => byEmployer[employerId] ?? EMPTY_IDS,
    [byEmployer, employerId],
  );
  const toggle = useShortlist((s) => s.toggle);
  const profiles = useProfile((s) => s.byUser);
  const users = allUsers();
  const rows = ids
    .map((id) => {
      const u = users.find((x) => x.id === id);
      const p = profiles[id];
      return u && p ? { user: u, profile: p } : null;
    })
    .filter((x): x is { user: (typeof users)[number]; profile: (typeof profiles)[string] } => !!x);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
      >
        <header className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Bookmark size={16} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {rows.length} shortlisted
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Click any name to open the full profile
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </header>
        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-3">
          {rows.map(({ user, profile }) => {
            const initials = user.name
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() ?? "")
              .join("");
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-100 p-3 transition hover:border-violet-300 hover:bg-violet-50/50 dark:border-zinc-800 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10"
              >
                {profile.photoDataUrl ? (
                  <img src={profile.photoDataUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white">
                    {initials || "—"}
                  </div>
                )}
                <Link
                  to={`/employer/candidates/${user.id}`}
                  onClick={onClose}
                  className="min-w-0 flex-1"
                >
                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {profile.preferredLocation ?? profile.itSpecialization ?? "—"}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => toggle(employerId, user.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                  aria-label={`Remove ${user.name}`}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
