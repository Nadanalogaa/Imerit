import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users2, Plus, ShieldOff, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { allUsers, useAuth } from "../store/auth";
import { Navbar } from "../components/Navbar";
import { TextField } from "../components/TextField";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";

/**
 * Super-admin lens on staff accounts. This is the ONLY surface that can
 * mint new staff — staff self-signup would be a security risk (they can
 * see every candidate profile + create employers under any name), so the
 * super-admin owns onboarding + deactivation. Each row shows a
 * deactivate/reactivate toggle. Deactivating a signed-in staff drops
 * their session immediately on the next page load.
 */
export function SuperAdminStaff() {
  const createStaff = useAuth((s) => s.createStaff);
  const setDeactivated = useAuth((s) => s.setDeactivated);
  const [tick, setTick] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", mobile: "" });
  const [error, setError] = useState<string | null>(null);
  const [freshCreds, setFreshCreds] = useState<{ email: string; password: string; name: string } | null>(null);

  const staff = useMemo(
    () => allUsers().filter((u) => u.role === "staff").sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Enter a name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Enter a valid email.");

    try {
      const { user, password } = await createStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim() || undefined,
      });
      setFreshCreds({ email: user.email, password, name: user.name });
      setForm({ name: "", email: "", mobile: "" });
      setShowForm(false);
      setTick((t) => t + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create staff account.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-6 md:py-10">
        <Link
          to="/super-admin/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft size={12} /> Super-admin dashboard
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Staff accounts
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {staff.length} staff · post jobs on behalf of employers
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Staff manage the Employer Master and post jobs. They can't reach admin or candidate
              surfaces. Sign-in is password-based (no OTP) until email is wired.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
          >
            <Plus size={14} /> {showForm ? "Cancel" : "Invite staff"}
          </button>
        </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            className="mb-6 space-y-3 rounded-3xl border border-brand-200 bg-brand-50/40 p-5 dark:border-brand-500/25 dark:bg-brand-500/10"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Priya Ramesh" autoFocus />
              <TextField label="Work email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="priya@rudraahr.com" inputMode="email" />
              <TextField label="Mobile" value={form.mobile} onChange={(v) => setForm((f) => ({ ...f, mobile: v }))} placeholder="9876543210" inputMode="tel" maxLength={10} />
            </div>
            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <KeyRound size={14} /> Create + generate password
              </button>
            </div>
          </motion.form>
        )}

        {staff.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <Users2 size={32} className="text-zinc-400" />
            <p className="mt-3 text-sm font-semibold">No staff invited yet</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Add the first staff member so they can start posting jobs on behalf of employers.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {staff.map((u) => (
                  <tr key={u.id} className="transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{u.name}</td>
                    <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">{u.email}</td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{u.mobile ?? "—"}</td>
                    <td className="px-4 py-3">
                      {u.deactivated ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                          Deactivated
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await setDeactivated(u.id, !u.deactivated);
                            setTick((t) => t + 1);
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Could not toggle account.");
                          }
                        }}
                        className={[
                          "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition",
                          u.deactivated
                            ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                            : "border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10",
                        ].join(" ")}
                      >
                        {u.deactivated ? (<><ShieldCheck size={11} /> Reactivate</>) : (<><ShieldOff size={11} /> Deactivate</>)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {freshCreds && (
        <CredentialShareModal
          title="Staff invited"
          subtitle={`${freshCreds.name} can now sign in at /staff/login`}
          email={freshCreds.email}
          password={freshCreds.password}
          onClose={() => setFreshCreds(null)}
        />
      )}
    </div>
  );
}
