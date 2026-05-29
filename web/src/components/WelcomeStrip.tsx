import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, set } from "../lib/storage";
import { useAuth } from "../store/auth";

const KEY = "itr.welcomeDismissed";

export function WelcomeStrip() {
  const [hidden, setHidden] = useState(true);
  const [closing, setClosing] = useState(false);
  const user = useAuth((s) => s.currentUser);

  useEffect(() => {
    if (user) {
      setHidden(true);
      return;
    }
    setHidden(get<boolean>(KEY, false));
  }, [user]);

  const dismiss = () => {
    setClosing(true);
    setTimeout(() => {
      set(KEY, true);
      setHidden(true);
    }, 250);
  };

  if (hidden) return null;

  return (
    <div
      className={[
        "relative z-[60] overflow-hidden transition-all duration-300",
        closing ? "max-h-0 opacity-0" : "max-h-[400px] opacity-100",
      ].join(" ")}
    >
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-600 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-stretch gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>
              👋
            </span>
            <span className="text-sm font-medium">
              New here? Tell us who you are
            </span>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <RoleBlock
              label="Looking for a job?"
              icon={<UserIcon />}
              loginTo="/candidate/login"
              registerTo="/candidate/register"
              accent="bg-white text-brand-700 hover:bg-zinc-50"
            />
            <span className="hidden h-7 w-px bg-white/30 md:block" />
            <RoleBlock
              label="Looking for talent?"
              icon={<BriefcaseIcon />}
              loginTo="/employer/login"
              registerTo="/employer/register"
              accent="bg-white text-sky-700 hover:bg-zinc-50"
            />
          </div>

          <button
            aria-label="Dismiss"
            onClick={dismiss}
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white md:relative md:right-0 md:top-0"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6l-12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleBlock({
  label,
  icon,
  loginTo,
  registerTo,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  loginTo: string;
  registerTo: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-white/95">
        <span className="opacity-80">{icon}</span>
        {label}
      </div>
      <Link
        to={loginTo}
        className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/15"
      >
        Sign in
      </Link>
      <Link
        to={registerTo}
        className={[
          "rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition",
          accent,
        ].join(" ")}
      >
        Register
      </Link>
    </div>
  );
}

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
