import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export function SignInMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Sign in
        <svg viewBox="0 0 24 24" className={["h-3.5 w-3.5 transition", open ? "rotate-180" : ""].join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <Section
            label="I'm a Candidate"
            tint="from-brand-500 to-brand-600"
            loginTo="/candidate/login"
            registerTo="/candidate/register"
            onClose={() => setOpen(false)}
          />
          <div className="border-t border-zinc-200 dark:border-zinc-800" />
          <Section
            label="I'm an Employer"
            tint="from-sky-500 to-sky-600"
            loginTo="/employer/login"
            registerTo="/employer/register"
            onClose={() => setOpen(false)}
          />
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            Admin? <Link to="/admin" className="text-brand-600 hover:underline dark:text-brand-400" onClick={() => setOpen(false)}>Admin login</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  tint,
  loginTo,
  registerTo,
  onClose,
}: {
  label: string;
  tint: string;
  loginTo: string;
  registerTo: string;
  onClose: () => void;
}) {
  return (
    <div className="p-4">
      <p className={["mb-3 inline-block bg-clip-text text-xs font-semibold uppercase tracking-widest text-transparent bg-gradient-to-r", tint].join(" ")}>
        {label}
      </p>
      <div className="flex gap-2">
        <Link
          to={loginTo}
          onClick={onClose}
          className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Sign in
        </Link>
        <Link
          to={registerTo}
          onClick={onClose}
          className={["flex-1 rounded-xl bg-gradient-to-r px-3 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:shadow-md", tint].join(" ")}
        >
          Register
        </Link>
      </div>
    </div>
  );
}
