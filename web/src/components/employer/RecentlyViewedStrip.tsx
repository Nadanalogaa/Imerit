import { useMemo } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { useAuth, allUsers } from "../../store/auth";
import { useProfile } from "../../store/profile";
import { useRecentCandidates } from "../../store/employerPrefs";

/**
 * Frozen empty fallback used when the employer has no entries yet. Sharing
 * one module-scope instance keeps the `useSyncExternalStore` snapshot
 * cache happy — a fresh `[]` on every render would blow the reference
 * check and trigger the "getSnapshot should be cached" infinite loop.
 */
const EMPTY_IDS: string[] = [];

/**
 * Horizontal strip of the employer's most recently viewed candidates.
 * Rendered above the candidate list so an employer flipping between
 * profiles never loses their place. Auto-populated by the candidate
 * detail page's mount effect.
 */
export function RecentlyViewedStrip() {
  const employer = useAuth((s) => s.currentUser);
  // Select the raw map (stable reference until it mutates) and derive the
  // per-employer slice via useMemo — never through a selector that
  // synthesises a new array each call.
  const byEmployer = useRecentCandidates((s) => s.byEmployer);
  const ids = useMemo(
    () => (employer ? byEmployer[employer.id] ?? EMPTY_IDS : EMPTY_IDS),
    [byEmployer, employer?.id],
  );
  const profiles = useProfile((s) => s.byUser);
  const clear = useRecentCandidates((s) => s.clear);

  if (!employer || ids.length === 0) return null;

  const users = allUsers();
  const resolved = ids
    .map((id) => {
      const u = users.find((x) => x.id === id);
      const p = profiles[id];
      return u && p ? { user: u, profile: p } : null;
    })
    .filter((x): x is { user: (typeof users)[number]; profile: (typeof profiles)[string] } => !!x);
  if (resolved.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center gap-1.5">
        <History size={11} className="text-indigo-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Recently viewed
        </span>
        <button
          type="button"
          onClick={() => clear(employer.id)}
          className="ml-auto text-[10px] font-semibold text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {resolved.map(({ user, profile }) => {
          const initials = user.name
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase() ?? "")
            .join("");
          const firstName = user.name.split(" ")[0];
          return (
            <Link
              key={user.id}
              to={`/employer/candidates/${user.id}`}
              className="group flex w-16 shrink-0 flex-col items-center gap-1"
              title={user.name}
            >
              {profile.photoDataUrl ? (
                <img
                  src={profile.photoDataUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover shadow-sm shadow-indigo-500/20 transition group-hover:shadow-md group-hover:shadow-indigo-500/40"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white shadow-sm shadow-indigo-500/30 transition group-hover:shadow-md group-hover:shadow-indigo-500/50">
                  {initials || "—"}
                </div>
              )}
              <span className="w-full truncate text-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                {firstName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
