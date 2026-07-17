import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, KeyRound } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

/**
 * Candidate sign-in supports two modes:
 *   - "otp" (default) — email → 6-digit code → verify. Works for any
 *     account. Passwordless.
 *   - "password" — email + password → immediate sign-in. Only works
 *     for candidates who've opted into a password after their first
 *     OTP session (from /set-password or /settings/account).
 *
 * Same email works either way — the backend accepts both flows.
 */
export function CandidateLogin() {
  const navigate = useNavigate();
  const loginAsync = useAuth((s) => s.loginAsync);
  const passwordLogin = useAuth((s) => s.passwordLogin);
  const findByEmail = useAuth((s) => s.findByEmail);

  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }

    // Password mode — direct sign-in via /auth/password/login.
    if (mode === "password") {
      if (password.length < 6) {
        setError("Enter your password");
        return;
      }
      setSubmitting(true);
      try {
        const user = await passwordLogin(email, password);
        if (user.role !== "candidate") {
          setError("That account isn't a candidate. Use the right login for your role.");
          return;
        }
        navigate("/candidate/dashboard", { replace: true });
      } catch (err) {
        setError(
          err instanceof ApiError && err.code === "ACCOUNT_DEACTIVATED"
            ? "Your account is deactivated. Contact support."
            : "That email + password combo didn't match. If you haven't set a password yet, use email OTP instead.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // OTP mode — role-check in localStorage mode; API can't role-filter today.
    if (!apiEnabled) {
      const u = findByEmail(email);
      if (!u || u.role !== "candidate") {
        setError("No candidate account found with this email");
        return;
      }
    }
    setSubmitting(true);
    try {
      const { devCode } = await loginAsync(email);
      if (!apiEnabled) generateOtp(email);
      if (devCode) sessionStorage.setItem(`itr.devOtp.${email.toLowerCase()}`, devCode);
      navigate(`/candidate/verify?email=${encodeURIComponent(email)}&mode=login`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "USER_NOT_FOUND") {
        setError("No account with that email. Please register first.");
      } else {
        setError(err instanceof Error ? err.message : "Could not send code. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={mode === "otp" ? "Sign in with a one-time email code — no password required." : "Sign in with your password."}
      tone="brand"
      bgImage="/images/background-04.jpg"
      panelTitle="Continue your job search"
      panelCopy="Jump back into your saved jobs, applications, and profile."
      highlights={[
        "One-click OTP or password sign-in",
        "Access saved jobs and applications",
        "Same account across every device",
      ]}
      stats={[
        { value: "Fast", label: "sign in" },
        { value: "Secure", label: mode === "otp" ? "email OTP" : "password" },
      ]}
    >
      {/* Segmented control — OTP vs password. Two lanes, one input for
          email above, mode-specific fields below. */}
      <div className="mb-4 inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-0.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-800">
        {(["otp", "password"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition",
              mode === m
                ? "bg-white text-brand-700 shadow-sm dark:bg-zinc-950 dark:text-brand-300"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
            ].join(" ")}
          >
            {m === "otp" ? <><Mail size={12} /> Email OTP</> : <><KeyRound size={12} /> Password</>}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          inputMode="email"
          autoFocus
          error={mode === "otp" ? error ?? undefined : undefined}
          hint={mode === "otp" ? "We'll send you a fresh 6-digit code." : undefined}
        />

        {mode === "password" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
            {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
            <div className="mt-2 text-right">
              <Link
                to="/forgot-password?lane=candidate"
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 disabled:opacity-60"
        >
          {mode === "otp"
            ? (submitting ? "Sending OTP..." : "Send Email OTP")
            : (submitting ? "Signing in..." : "Sign in")}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          New to i-Tamil Recruit?{" "}
          <Link to="/candidate/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
