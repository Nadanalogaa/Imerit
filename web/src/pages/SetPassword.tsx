import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, SkipForward } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { authApi } from "../lib/api/auth";
import { useAuth } from "../store/auth";
import { ApiError } from "../lib/api";

/**
 * "Almost done — set a password" step shown right after a first-time
 * OTP verify (candidate or employer). Users can set a password now for
 * faster future sign-ins, or skip and continue via OTP forever.
 *
 * Query params:
 *   ?next=/candidate/dashboard  (or wherever) — where to land after
 *   set or skip. Defaults to `/` if omitted.
 *
 * Also linked from the settings page for users who haven't set a
 * password yet.
 */
export function SetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useAuth((s) => s.currentUser);
  const next = params.get("next") || (user ? homeFor(user.role) : "/");

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const skip = () => {
    navigate(next, { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    try {
      await authApi.setInitialPassword(pwd);
      // Re-hydrate the current user so hasPassword flips to true in
      // the local store — otherwise the prompt would come back on the
      // next OTP session.
      const me = await authApi.me().catch(() => null);
      if (me?.user) {
        useAuth.setState({
          currentUser: {
            ...user!,
            hasPassword: true,
          },
        });
      }
      setSuccess(true);
      setTimeout(() => navigate(next, { replace: true }), 900);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "PASSWORD_EXISTS"
          ? "You already have a password — use the change-password flow instead."
          : code === "PASSWORD_TOO_SHORT"
            ? "Password must be at least 8 characters."
            : "Could not set the password. Try again in a moment.",
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={success ? "Password set!" : "Almost done"}
      subtitle={user ? `Set a password for ${user.email} so you can sign in faster next time.` : "Set a password so you can sign in faster next time."}
      tone="brand"
      panelTitle="One quick step — then you're in."
      panelCopy="A password lets you sign in without waiting for an OTP email. You can still use OTP any time you want."
      highlights={[
        "Optional — you can skip and stay with OTP",
        "Password never leaves the server hashed",
        "Change or reset it any time from settings",
      ]}
    >
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <KeyRound size={22} />
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Password saved. Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">New password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="At least 8 characters"
                autoFocus
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg disabled:opacity-60"
          >
            <KeyRound size={16} /> {submitting ? "Saving..." : "Set password"}
          </button>
          <button
            type="button"
            onClick={skip}
            className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <SkipForward size={12} /> Skip for now — I'll use OTP
          </button>
          <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            You can set a password later from{" "}
            <Link to="/settings/account" className="hover:underline">
              account settings
            </Link>
            .
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

// Local role-to-home map; keeps this page independent of the store's
// HOME_PATH export so we can render even when the user context is
// stale mid-transition.
function homeFor(role: string): string {
  switch (role) {
    case "candidate": return "/candidate/dashboard";
    case "employer":  return "/employer/dashboard";
    case "admin":     return "/admin/dashboard";
    case "super_admin": return "/super-admin/dashboard";
    case "staff":     return "/staff/dashboard";
    default:          return "/";
  }
}
