import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

export function CandidateRegister() {
 const navigate = useNavigate();
 const registerAsync = useAuth((s) => s.registerAsync);
 const findByEmail = useAuth((s) => s.findByEmail);

 const [name, setName] = useState("");
 const [mobile, setMobile] = useState("");
 const [email, setEmail] = useState("");
 const [errors, setErrors] = useState<{ name?: string; mobile?: string; email?: string; general?: string }>({});
 const [submitting, setSubmitting] = useState(false);

 const submit = async (e: React.FormEvent) => {
 e.preventDefault();
 const next: typeof errors = {};
 if (!name.trim()) next.name = "Required";
 if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email";
 // localStorage-only duplicate check; the backend has its own unique
 // constraint that surfaces as EMAIL_TAKEN below.
 if (!apiEnabled && findByEmail(email)) next.email = "An account already exists with this email";
 setErrors(next);
 if (Object.keys(next).length > 0) return;

 setSubmitting(true);
 try {
 const { devCode } = await registerAsync({ role: "candidate", name, email, mobile });
 // In localStorage mode the legacy mock OTP service still needs to issue
 // a code; in API mode the server has already done it.
 if (!apiEnabled) generateOtp(email);
 // Stash the dev-mode OTP so the verify page can autofill it.
 if (devCode) sessionStorage.setItem(`itr.devOtp.${email.toLowerCase()}`, devCode);
 navigate(`/candidate/verify?email=${encodeURIComponent(email)}`);
 } catch (err) {
 if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
 setErrors({ email: "An account already exists. Please log in instead." });
 } else if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
 setErrors({ general: "Please double-check the form and try again." });
 } else {
 setErrors({ general: err instanceof Error ? err.message : "Something went wrong. Please try again." });
 }
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <AuthLayout
 title="Create your candidate account"
 subtitle="Profile posting is free. It takes less than a minute."
 tone="brand"
 bgImage="/images/background-03.jpg"
 panelTitle="Find jobs closer to home"
 panelCopy="Create a profile once, verify with OTP, and start getting matched to openings by skills, location, and experience."
 highlights={[
 "Free profile creation with one-time email verification",
 "Jobs matched by location, role, and field",
 "Short form, clean onboarding, no clutter",
 ]}
 stats={[
 { value: "1 OTP", label: "to verify" },
 { value: "Free", label: "to post profile" },
 ]}
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

 {errors.general && (
 <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {errors.general}
 </p>
 )}

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
