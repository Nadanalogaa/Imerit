import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, set } from "../lib/storage";
import { useAuth } from "../store/auth";

const KEY = "itr.welcomeDismissed";

export function WelcomeStrip() {
 return null;
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
