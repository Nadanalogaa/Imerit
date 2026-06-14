import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

export function EmployerLogin() {
  const navigate = useNavigate();
  const loginAsync = useAuth((s) => s.loginAsync);
  const findByEmail = useAuth((s) => s.findByEmail);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    if (!apiEnabled) {
      const u = findByEmail(email);
      if (!u || u.role !== "employer") {
        setError("No employer account found with this email");
        return;
      }
    }
    setSubmitting(true);
    try {
      const { devCode } = await loginAsync(email);
      if (!apiEnabled) generateOtp(email);
      if (devCode) sessionStorage.setItem(`itr.devOtp.${email.toLowerCase()}`, devCode);
      navigate(`/employer/verify?email=${encodeURIComponent(email)}&mode=login`);
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
    <AuthLayout title="Welcome back" subtitle="Sign in to your employer account with a one-time email code." bgImage="/images/background-02.jpg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Work email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          inputMode="email"
          autoFocus
          error={error ?? undefined}
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-60"
        >
          {submitting ? "Sending OTP..." : "Send Email OTP"}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          New to i-Tamil Recruit?{" "}
          <Link to="/employer/register" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
