import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";

export function CandidateLogin() {
  const navigate = useNavigate();
  const findByEmail = useAuth((s) => s.findByEmail);

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    const user = findByEmail(email);
    if (!user || user.role !== "candidate") {
      setError("No candidate account found with this email");
      return;
    }

    setSubmitting(true);
    generateOtp(email);
    navigate(`/candidate/verify?email=${encodeURIComponent(email)}&mode=login`);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your candidate account with a one-time email code."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          inputMode="email"
          autoFocus
          error={error ?? undefined}
          hint="We'll send you a fresh 6-digit code."
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 disabled:opacity-60"
        >
          {submitting ? "Sending OTP..." : "Send Email OTP"}
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
