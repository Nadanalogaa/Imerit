import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, ShieldCheck, User as UserIcon } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { authApi } from "../lib/api/auth";
import { useAuth } from "../store/auth";
import { ApiError } from "../lib/api";

/**
 * Signed-in user's account settings — currently just the password
 * management surface, but named generically so future settings
 * (notifications, profile, delete-account) can slot in as new
 * sections without a route change.
 *
 * The password section renders one of two forms based on
 * `user.hasPassword`:
 *   - hasPassword = true  → "Change password" (old + new)
 *   - hasPassword = false → "Set a password" (just new, links to
 *     the shared /set-password page)
 */
export function AccountSettings() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser);

  if (!user) {
    // Shouldn't happen — this route is behind RequireAuth — but guard
    // anyway so a stale redirect doesn't crash on user=null.
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 md:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Account settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </p>
        </div>

        {/* Password section */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Password</h2>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                {user.hasPassword
                  ? "Change your password. You'll still be able to sign in via OTP too."
                  : "Set a password so you can sign in without waiting for an OTP email."}
              </p>
            </div>
          </div>

          {user.hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <Link
              to="/set-password"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
            >
              <ShieldCheck size={14} /> Set a password
            </Link>
          )}
        </section>

        {/* Account section (read-only for now — quick identity summary) */}
        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <UserIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Account</h2>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                Basic identity — edit deeper details from your role's profile page.
              </p>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Name" value={user.name} />
            <Field label="Email" value={user.email} />
            {user.mobile && <Field label="Mobile" value={user.mobile} />}
            <Field label="Role" value={user.role.replace("_", " ")} className="capitalize" />
            <Field
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            />
          </dl>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={["mt-0.5 text-sm text-zinc-900 dark:text-zinc-100", className].join(" ")}>{value}</dd>
    </div>
  );
}

/** The change-password subform. Extracted so the parent can conditionally render it. */
function ChangePasswordForm() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!oldPwd) return setError("Enter your current password.");
    if (newPwd.length < 8) return setError("New password must be at least 8 characters.");
    if (newPwd === oldPwd) return setError("New password must be different from the current one.");
    if (newPwd !== confirm) return setError("New passwords don't match.");

    setSubmitting(true);
    try {
      await authApi.changePassword(oldPwd, newPwd);
      setOldPwd(""); setNewPwd(""); setConfirm("");
      setSuccess("Password changed. Use the new one next time you sign in.");
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "OLD_PASSWORD_INVALID"
          ? "Current password is incorrect."
          : code === "PASSWORD_TOO_SHORT"
            ? "New password must be at least 8 characters."
            : code === "PASSWORD_UNCHANGED"
              ? "New password must be different from the current one."
              : "Could not change the password. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-3 max-w-md">
      <FieldPassword label="Current password" value={oldPwd} onChange={setOldPwd} show={show} />
      <FieldPassword label="New password" value={newPwd} onChange={setNewPwd} show={show} placeholder="At least 8 characters" />
      <FieldPassword label="Confirm new password" value={confirm} onChange={setConfirm} show={show} />
      <label className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-3.5 w-3.5" />
        Show passwords
      </label>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg disabled:opacity-60"
      >
        <KeyRound size={14} /> {submitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

function FieldPassword({
  label,
  value,
  onChange,
  show,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Clear"
          tabIndex={-1}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
