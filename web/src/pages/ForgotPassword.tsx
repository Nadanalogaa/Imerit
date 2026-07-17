import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { authApi } from "../lib/api/auth";
import { ApiError } from "../lib/api";

/**
 * Forgot-password flow — two-step wizard on one page:
 *
 *  1. `request` — user enters email → we call /auth/password/forgot which
 *     dispatches a PASSWORD_RESET OTP if the email belongs to a password-
 *     eligible account (staff, or an employer who was provisioned by
 *     staff). The server returns the same response either way to avoid
 *     enumeration.
 *
 *  2. `reset` — user enters the 6-digit OTP + a new password → we call
 *     /auth/password/reset which verifies the code, sets the new bcrypt
 *     hash, and nulls the old `sharedPassword` so admins can no longer
 *     reveal the prior credential.
 *
 * `?lane=staff|employer` in the URL controls the copy and where the
 * "Back to sign in" link goes. Defaults to staff (the more common case).
 */
export function ForgotPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const laneParam = params.get("lane");
  const lane: "staff" | "employer" | "candidate" =
    laneParam === "employer" ? "employer" :
    laneParam === "candidate" ? "candidate" :
    "staff";
  const loginPath =
    lane === "staff" ? "/staff/login" :
    lane === "employer" ? "/employer/login" :
    "/candidate/login";
  const laneLabel = lane; // "staff" | "employer" | "candidate"

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      // Same wording as the backend — deliberately doesn't confirm
      // whether the email exists.
      setInfo("If an eligible account exists for that email, a reset code has been sent. Check your inbox (and spam folder).");
      setStep("reset");
    } catch (err) {
      // The backend only fails here on missing field / rate limit; wrong
      // email doesn't 4xx. Show a generic message either way.
      setError(err instanceof ApiError && err.code === "RATE_LIMIT"
        ? "Too many attempts — try again in an hour."
        : "Could not send the reset code. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const applyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      // Land back on the correct login page with a success flag so the
      // login form can show a confirmation banner.
      navigate(`${loginPath}?reset=1`, { replace: true });
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "OTP_INVALID" || code === "OTP_NOT_FOUND"
          ? "Incorrect code. Check your inbox and try again."
          : code === "OTP_EXPIRED"
            ? "That code has expired. Request a new one."
            : code === "OTP_LOCKED"
              ? "Too many wrong attempts. Request a fresh code."
              : code === "PASSWORD_TOO_SHORT"
                ? "Password must be at least 8 characters."
                : "Could not reset the password. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={`Get a fresh password for your ${laneLabel} account.`}
      tone={lane === "employer" ? "sky" : "brand"}
      bgImage="/images/background-04.jpg"
      panelTitle="Password trouble? We'll sort it in a minute."
      panelCopy="Enter your email, get a 6-digit code, set a new password. Nothing else to remember."
      highlights={[
        "Reset code lands in your inbox",
        "Code expires in 10 minutes",
        "Old shared password stops working",
      ]}
    >
      {step === "request" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <TextField
            label={`${laneLabel === "staff" ? "Staff" : "Employer"} email`}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            inputMode="email"
            autoFocus
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          {info && <p className="text-xs text-emerald-500">{info}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg disabled:opacity-60"
          >
            <Mail size={16} /> {submitting ? "Sending..." : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={applyReset} className="flex flex-col gap-4">
          {info && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {info}
            </div>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            inputMode="email"
            disabled
          />
          <TextField
            label="6-digit code"
            value={code}
            onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            inputMode="numeric"
            maxLength={6}
            autoFocus
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg disabled:opacity-60"
          >
            <ShieldCheck size={16} /> {submitting ? "Resetting..." : "Set new password"}
          </button>
          <button
            type="button"
            onClick={() => { setStep("request"); setCode(""); setNewPassword(""); setError(null); }}
            className="text-center text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Didn't get a code? Send it again.
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <Link to={loginPath} className="inline-flex items-center gap-1 hover:underline">
          <KeyRound size={12} /> Back to {laneLabel} sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
