import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";

export function CandidateRegister() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const findByEmail = useAuth((s) => s.findByEmail);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; mobile?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Required";
    if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email";
    if (findByEmail(email)) next.email = "An account already exists with this email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    register({ role: "candidate", name, email, mobile });
    generateOtp(email);
    navigate(`/candidate/verify?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthLayout
      title="Create your candidate account"
      subtitle="Profile posting is free. Takes less than a minute."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Full name"
          value={name}
          onChange={setName}
          placeholder="e.g. Karthick S."
          error={errors.name}
          autoFocus
        />
        <TextField
          label="Mobile number"
          value={mobile}
          onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
          placeholder="9876543210"
          inputMode="numeric"
          maxLength={10}
          error={errors.mobile}
          hint="We'll never share this without your permission."
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          inputMode="email"
          error={errors.email}
          hint="We'll send a 6-digit code to verify."
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
          Already have an account?{" "}
          <Link to="/candidate/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
