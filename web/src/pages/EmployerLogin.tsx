import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";

export function EmployerLogin() {
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
    if (!user || user.role !== "employer") {
      setError("No employer account found with this email");
      return;
    }
    setSubmitting(true);
    generateOtp(email);
    navigate(`/employer/verify?email=${encodeURIComponent(email)}&mode=login`);
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
