import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ArrowLeft,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../store/auth";
import { ThemeToggle } from "../components/ThemeToggle";
import { ApiError } from "../lib/api";
import { superAdminApi, type AdminAccount } from "../lib/api/admin";

/**
 * Super-admin-only page for managing the privileged accounts: list every
 * ADMIN + SUPER_ADMIN, invite a new one (the email gets a normal OTP on next
 * login), or revoke access (soft delete). Self-deletion is blocked server-side.
 */
export function SuperAdminAdmins() {
  const navigate = useNavigate();
  const me = useAuth((s) => s.currentUser);
  const logout = useAuth((s) => s.logoutAsync);

  const [items, setItems] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New admin form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const { items } = await superAdminApi.listAdmins();
      setItems(items);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!newName.trim()) return setCreateError("Name is required");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) return setCreateError("Enter a valid email");

    setCreating(true);
    try {
      const { user } = await superAdminApi.createAdmin({
        email: newEmail.trim(),
        name: newName.trim(),
        role: newRole,
      });
      setCreateSuccess(`Created ${user.role === "SUPER_ADMIN" ? "super admin" : "admin"} ${user.email}. They can now log in via the admin sign-in page.`);
      setNewName("");
      setNewEmail("");
      setNewRole("ADMIN");
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setCreateError("A user with that email already exists.");
      } else {
        setCreateError(err instanceof Error ? err.message : "Could not create admin.");
      }
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: string) => {
    setDeleting(id);
    setDeleteError(null);
    try {
      await superAdminApi.deleteAdmin(id);
      setConfirmingDelete(null);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "CANNOT_DELETE_SELF") {
        setDeleteError("You can't delete your own account.");
      } else {
        setDeleteError(err instanceof Error ? err.message : "Could not delete admin.");
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Super Admin · Admin Accounts</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{me?.name} · {me?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={async () => { await logout(); navigate("/"); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <LogOut size={12} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link to="/super-admin/dashboard" className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <ArrowLeft size={14} /> Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Privileged accounts</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Admins & super admins</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Create new admin accounts here. They sign in via the same one-time email code flow as candidates — no separate password is set or shared.
          </p>
        </div>

        {/* Create form */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-base font-semibold tracking-tight">Invite an admin</h2>
          </div>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Full name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Priya Iyer" className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-950" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Email</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="priya@yourcompany.com" inputMode="email" className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-950" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as typeof newRole)} className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-950">
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={creating} className="inline-flex h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:shadow-lg disabled:opacity-60">
                <UserPlus size={14} /> {creating ? "Creating…" : "Invite"}
              </button>
            </div>
          </form>
          {createError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{createError}</p>
          )}
          {createSuccess && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">{createSuccess}</p>
          )}
          {newRole === "SUPER_ADMIN" && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Super admins can create + delete other admins, including you. Only invite people you fully trust.</span>
            </div>
          )}
        </motion.section>

        {/* Current admins */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">Current admin accounts ({items.length})</h2>
          </div>

          {loadError && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{loadError}</p>
          )}
          {deleteError && (
            <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{deleteError}</p>
          )}

          {loading ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">No admin accounts yet. Invite one above.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((a) => {
                const isMe = a.id === me?.id;
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
                    <div className={["flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md", a.role === "SUPER_ADMIN" ? "bg-gradient-to-br from-violet-600 to-fuchsia-600" : "bg-gradient-to-br from-zinc-700 to-zinc-900"].join(" ")}>
                      {a.role === "SUPER_ADMIN" ? <Crown size={14} /> : <Shield size={14} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {a.name}
                        {isMe && <span className="ml-2 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">You</span>}
                      </p>
                      <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{a.email}</p>
                    </div>
                    <span className={["rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", a.role === "SUPER_ADMIN" ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"].join(" ")}>
                      {a.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                    </span>
                    <p className="hidden text-[10px] text-zinc-500 dark:text-zinc-400 md:block">
                      {a.lastSeenAt ? `Last seen ${new Date(a.lastSeenAt).toLocaleDateString()}` : "Never signed in"}
                    </p>
                    <button
                      onClick={() => setConfirmingDelete(a.id)}
                      disabled={isMe || deleting === a.id}
                      title={isMe ? "You can't delete your own account" : "Revoke access"}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setConfirmingDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold tracking-tight">Revoke admin access?</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The user keeps their account data but can no longer sign in to the admin panel. You can re-invite them with a fresh email later if needed.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setConfirmingDelete(null)} className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <button
                  disabled={deleting === confirmingDelete}
                  onClick={() => onDelete(confirmingDelete)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-rose-500/30 disabled:opacity-60"
                >
                  <Trash2 size={14} /> {deleting === confirmingDelete ? "Revoking…" : "Revoke access"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
