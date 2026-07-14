import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, XCircle, UserPlus, LogIn, LogOut, Activity, Briefcase, Heart, Sparkles, UserSearch } from "lucide-react";
import { useAuth, allUsers } from "../store/auth";
import { useApplications } from "../store/applications";
import { useJobs, isExpired, daysUntilExpiry } from "../store/jobs";
import { useProfile } from "../store/profile";
import { useLocations } from "../store/locations";
import { useSavedSearches } from "../store/employerPrefs";
import { matchesFilter } from "../lib/employerFilters";
import { adminApi, type AdminActivityItem } from "../lib/api/admin";
import { apiEnabled } from "../lib/api";

interface Item {
  id: string;
  icon: React.ReactNode;
  tone: "brand" | "sky" | "emerald" | "rose" | "amber" | "violet" | "zinc";
  title: string;
  detail?: string;
  at: string; // ISO or human string
}

/**
 * Header notification bell. The panel content is composed per-role from the
 * signals each role already exposes — admins see the audit log; candidates
 * see their application status changes + saved jobs; employers see their
 * job's applicants + expiry warnings. When there's genuinely nothing to
 * show we render a friendly empty state instead of hiding the bell.
 */
export function NotificationBell() {
  const user = useAuth((s) => s.currentUser);
  const [open, setOpen] = useState(false);
  const items = useNotifications(user?.role, user?.id);
  const anchorRef = useRef<HTMLDivElement>(null);
  const reconcileSavedSearches = useReconcileSavedSearches();

  // Close on outside click so it behaves like a proper popover.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;
  const unread = items.length;

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => {
          // Advance saved-search "known" sets before opening — from the
          // employer's point of view they've now "seen" every queued match,
          // so the badge deflates instead of resurfacing next render.
          if (user.role === "employer") reconcileSavedSearches(user.id);
          setOpen((o) => !o);
        }}
        aria-label={unread > 0 ? `${unread} notifications` : "Notifications"}
        title={unread > 0 ? `${unread} notifications` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Notifications</p>
              {unread > 0 && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {unread} new
                </span>
              )}
            </div>
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <Bell size={22} className="text-zinc-300 dark:text-zinc-700" />
                <p className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">You're all caught up</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  We'll ping you when something changes.
                </p>
              </div>
            ) : (
              <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
                {items.slice(0, 20).map((it) => (
                  <li key={it.id} className="flex items-start gap-3 px-4 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <span className={["mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TONE[it.tone]].join(" ")}>
                      {it.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {it.title}
                      </p>
                      {it.detail && <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{it.detail}</p>}
                      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{it.at}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TONE: Record<Item["tone"], string> = {
  brand:   "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  sky:     "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rose:    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  amber:   "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  violet:  "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  zinc:    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function useNotifications(role: string | undefined, userId: string | undefined): Item[] {
  const applications = useApplications((s) => s.applications);
  const saved = useApplications((s) => s.saved);
  const jobs = useJobs((s) => s.jobs);
  const [adminActivity, setAdminActivity] = useState<AdminActivityItem[]>([]);
  // Compute at top level so hook order is stable regardless of role branch.
  const { items: savedSearchNotifications } = useSavedSearchNotifications(userId, role);

  // Poll admin activity every 30s while an admin is signed in.
  useEffect(() => {
    if (!apiEnabled) return;
    if (role !== "admin" && role !== "super_admin") return;
    let alive = true;
    const load = () => {
      adminApi.activity(15)
        .then((r) => { if (alive) setAdminActivity(r.items); })
        .catch(() => { /* silent */ });
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, [role]);

  if (!userId) return [];

  // Admins / super-admins: server-driven audit log.
  if (role === "admin" || role === "super_admin") {
    return adminActivity.map((a) => ({
      id: a.id,
      title: HUMAN_ADMIN[a.action] ?? a.action.replace(/_/g, " "),
      detail: a.actor ? (a.actor.name || a.actor.email) : undefined,
      at: relativeTime(a.createdAt),
      tone: ADMIN_TONE[a.action] ?? "zinc",
      icon: ADMIN_ICON[a.action] ?? <Activity size={13} />,
    }));
  }

  // Candidates: their applications, saved jobs, matches.
  if (role === "candidate") {
    const myApps = applications.filter((x) => x.userId === userId).slice(0, 10);
    const mySaved = (saved[userId] ?? []).slice(0, 5);
    const items: Item[] = [];
    for (const a of myApps) {
      const job = jobs.find((j) => j.id === a.jobId);
      if (!job) continue;
      items.push({
        id: `app-${a.id}`,
        title: `Applied to ${job.title}`,
        detail: job.employerName,
        at: relativeTime(a.appliedAt),
        tone: "brand",
        icon: <Briefcase size={13} />,
      });
    }
    for (const jobId of mySaved) {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) continue;
      items.push({
        id: `save-${jobId}`,
        title: `Saved ${job.title}`,
        detail: job.employerName,
        at: relativeTime(job.postedAt),
        tone: "rose",
        icon: <Heart size={13} />,
      });
    }
    return items;
  }

  // Employers: expiring / expired jobs, plus new candidate matches for any
  // saved search that has "notify" turned on.
  if (role === "employer") {
    const out: Item[] = [];
    for (const j of jobs) {
      if (j.employerId !== userId) continue;
      const dLeft = daysUntilExpiry(j);
      if (isExpired(j)) {
        out.push({
          id: `expired-${j.id}`,
          title: "Listing expired",
          detail: j.title,
          at: relativeTime(j.expiresAt ?? j.postedAt),
          tone: "rose",
          icon: <XCircle size={13} />,
        });
      } else if (dLeft !== null && dLeft <= 5) {
        out.push({
          id: `expiring-${j.id}`,
          title: `${j.title} expires in ${dLeft}d`,
          detail: "Repost to keep it live",
          at: `${dLeft}d left`,
          tone: "amber",
          icon: <Sparkles size={13} />,
        });
      }
    }
    out.push(...savedSearchNotifications);
    return out;
  }

  return [];
}

/**
 * Shared helper — computes the "fresh match" delta for every notify-enabled
 * saved search this employer owns. Split into its own hook so both
 * `useNotifications` (for rendering) and `useReconcileSavedSearches` (for
 * marking-as-seen) can reuse the same source of truth.
 */
function useSavedSearchNotifications(userId: string | undefined, role: string | undefined) {
  const savedSearches = useSavedSearches((s) => s.all);
  const profiles = useProfile((s) => s.byUser);
  const jobs = useJobs((s) => s.jobs);
  const districts = useLocations((s) => s.districts);
  if (!userId || role !== "employer") return { items: [] as Item[], deltas: [] as { id: string; ids: string[] }[] };
  const mine = savedSearches.filter((s) => s.employerId === userId && s.notify);
  if (mine.length === 0) return { items: [], deltas: [] };
  const candidates = allUsers()
    .filter((u) => u.role === "candidate")
    .map((u) => ({ user: u, profile: profiles[u.id] }))
    .filter((x): x is { user: (typeof allUsers)[number] extends never ? never : any; profile: any } => !!x.profile && !!x.profile.selectedTemplateId);
  const activeJobs = jobs.filter((j) => j.employerId === userId && !isExpired(j));
  const items: Item[] = [];
  const deltas: { id: string; ids: string[] }[] = [];
  for (const s of mine) {
    const nearJob = s.filters.nearJobId ? activeJobs.find((j) => j.id === s.filters.nearJobId) ?? null : null;
    const currentIds = candidates
      .filter((c) => matchesFilter(c.profile, s.filters, { districts, nearJob }))
      .map((c) => c.user.id);
    const fresh = currentIds.filter((id) => !s.knownCandidateIds.includes(id));
    if (fresh.length > 0) {
      items.push({
        id: `saved-${s.id}`,
        title: `${fresh.length} new match${fresh.length === 1 ? "" : "es"}`,
        detail: s.name,
        at: "moments ago",
        tone: "violet",
        icon: <UserSearch size={13} />,
      });
    }
    deltas.push({ id: s.id, ids: currentIds });
  }
  return { items, deltas };
}

/**
 * Returns a callback the bell can invoke on open to advance every notify-
 * enabled saved search's `knownCandidateIds` to the current match set, so
 * the same match never appears twice.
 */
function useReconcileSavedSearches() {
  const reconcile = useSavedSearches((s) => s.reconcile);
  const user = useAuth((s) => s.currentUser);
  const { deltas } = useSavedSearchNotifications(user?.id, user?.role);
  return (_employerId: string) => {
    for (const { id, ids } of deltas) reconcile(id, ids);
  };
}

const ADMIN_ICON: Record<string, React.ReactNode> = {
  USER_CREATED: <UserPlus size={13} />,
  USER_LOGIN: <LogIn size={13} />,
  USER_LOGOUT: <LogOut size={13} />,
  PROFILE_APPROVED: <CheckCircle2 size={13} />,
  PROFILE_REJECTED: <XCircle size={13} />,
};

const ADMIN_TONE: Record<string, Item["tone"]> = {
  USER_CREATED: "brand",
  USER_LOGIN: "sky",
  USER_LOGOUT: "zinc",
  PROFILE_APPROVED: "emerald",
  PROFILE_REJECTED: "rose",
};

const HUMAN_ADMIN: Record<string, string> = {
  USER_CREATED: "Account created",
  USER_LOGIN: "User signed in",
  USER_LOGOUT: "User signed out",
  PROFILE_APPROVED: "Profile approved",
  PROFILE_REJECTED: "Profile rejected",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
