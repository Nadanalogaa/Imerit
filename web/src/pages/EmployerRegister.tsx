import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";

export function EmployerRegister() {
  const navigate = useNavigate();
  const register = useAuth((s) => s.register);
  const findByEmail = useAuth((s) => s.findByEmail);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Required";
    if (!company.trim()) next.company = "Required";
    if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email";
    if (findByEmail(email)) next.email = "An account already exists with this email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    register({ role: "employer", name, email, mobile, company });
    generateOtp(email);
    navigate(`/employer/verify?email=${encodeURIComponent(email)}`);
  };

  return (
    <AuthLayout
      title="Create your employer account"
      subtitle="Job posting is free. Subscribe only when you're ready to search candidates."
      bgImage="/images/background-02.jpg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField label="Your name" value={name} onChange={setName} placeholder="e.g. Priya Iyer" error={errors.name} autoFocus />
        <TextField label="Company name" value={company} onChange={setCompany} placeholder="e.g. Zoho Corporation" error={errors.company} />
        <TextField
          label="Mobile number"
          value={mobile}
          onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
          placeholder="9876543210"
          inputMode="numeric"
          maxLength={10}
          error={errors.mobile}
        />
        <TextField
          label="Work email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          inputMode="email"
          error={errors.email}
          hint="We'll send a 6-digit code to verify."
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
          Already have an account?{" "}
          <Link to="/employer/login" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
