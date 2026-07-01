import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, LayoutDashboard, Settings, User as UserIcon, ChevronDown } from "lucide-react";
import { useAuth, type User } from "../store/auth";

const initials = (name: string) =>
 name
 .trim()
 .split(/\s+/)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase())
 .join("");

export function UserAvatarMenu({ user }: { user: User }) {
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);
 const logout = useAuth((s) => s.logout);
 const navigate = useNavigate();

 useEffect(() => {
 const onDoc = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", onDoc);
 return () => document.removeEventListener("mousedown", onDoc);
 }, []);

 return (
 <div ref={ref} className="relative">
 <motion.button
 onClick={() => setOpen((v) => !v)}
 whileTap={{ scale: 0.95 }}
 className="group inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-brand-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-brand-500/40 dark:hover:bg-zinc-800"
 >
 <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-md shadow-brand-500/30">
 {initials(user.name)}
 </span>
 <span className="hidden max-w-[120px] truncate sm:inline">{user.name.split(" ")[0]}</span>
 <ChevronDown size={14} className={["transition", open ? "rotate-180" : ""].join(" ")} />
 </motion.button>

 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: -8, scale: 0.97 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 0.97 }}
 transition={{ duration: 0.16, ease: "easeOut" }}
 className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
 >
 <div className="bg-gradient-to-br from-brand-50 to-amber-50 px-4 py-4 dark:from-brand-500/10 dark:to-amber-500/5">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md">
 {initials(user.name)}
 </div>
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</div>
 <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</div>
 </div>
 </div>
 {user.emailVerified && (
 <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
 Verified
 </div>
 )}
 </div>

 <div className="p-2">
 <MenuItem
 icon={<LayoutDashboard size={16} />}
 label="Dashboard"
 onClick={() => {
 setOpen(false);
 navigate("/candidate/dashboard");
 }}
 />
 <MenuItem
 icon={<UserIcon size={16} />}
 label="My profile"
 soon
 onClick={() => setOpen(false)}
 />
 <MenuItem
 icon={<Settings size={16} />}
 label="Settings"
 soon
 onClick={() => setOpen(false)}
 />
 </div>

 <div className="border-t border-zinc-200 p-2 ">
 <MenuItem
 icon={<LogOut size={16} />}
 label="Sign out"
 tone="danger"
 onClick={() => {
 setOpen(false);
 logout();
 navigate("/");
 }}
 />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}

function MenuItem({
 icon,
 label,
 onClick,
 tone = "default",
 soon = false,
}: {
 icon: React.ReactNode;
 label: string;
 onClick: () => void;
 tone?: "default" | "danger";
 soon?: boolean;
}) {
 const isDanger = tone === "danger";
 return (
 <button
 onClick={onClick}
 disabled={soon}
 className={[
 "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
 isDanger
 ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
 : "text-zinc-700 hover:bg-brand-50 hover:text-brand-700 dark:text-zinc-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-300",
 soon ? "opacity-50" : "",
 ].join(" ")}
 >
 <span className="text-zinc-500 group-hover:text-current dark:text-zinc-400">{icon}</span>
 <span className="flex-1 text-left">{label}</span>
 {soon && (
 <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
 Soon
 </span>
 )}
 </button>
 );
}

export const userInitials = initials;

export function Link2() {
 return <Link to="" />; // placeholder to keep Link import used
}
