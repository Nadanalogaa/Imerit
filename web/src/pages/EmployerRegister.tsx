import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

export function EmployerRegister() {
 const navigate = useNavigate();
 const registerAsync = useAuth((s) => s.registerAsync);
 const findByEmail = useAuth((s) => s.findByEmail);

 const [name, setName] = useState("");
 const [company, setCompany] = useState("");
 const [mobile, setMobile] = useState("");
 const [email, setEmail] = useState("");
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [submitting, setSubmitting] = useState(false);

 const submit = async (e: React.FormEvent) => {
 e.preventDefault();
 const next: Record<string, string> = {};
 if (!name.trim()) next.name = "Required";
 if (!company.trim()) next.company = "Required";
 if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Enter a valid email";
 if (!apiEnabled && findByEmail(email)) next.email = "An account already exists with this email";
 setErrors(next);
 if (Object.keys(next).length > 0) return;

 setSubmitting(true);
 try {
 const { devCode } = await registerAsync({ role: "employer", name, email, mobile, company });
 if (!apiEnabled) generateOtp(email);
 if (devCode) sessionStorage.setItem(`itr.devOtp.${email.toLowerCase()}`, devCode);
 navigate(`/employer/verify?email=${encodeURIComponent(email)}`);
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
 title="Create Your Employer Account"
 subtitle="Post Jobs for Free. Subscribe Only When Candidates Apply."
 tone="sky"
 bgImage="/images/background-02.jpg"
 panelTitle="Discover the Right Skilled Talent! Recruit Smarter. Recruit Faster."
 panelCopy="Register as an Employer and Verify Your Email to Get Started."
 highlights={[
 "Post Jobs at Zero Cost.",
 "This Platform is built to simplify the Recruitment Process.",
 "We Take Responsibility for Sourcing the Right Candidates",
 "We Promote Your Job Openings to Reach More Candidates"
 ]}
 stats={[
 { value: "Free", label: "Job Posting" },
 { value: "1 OTP", label: "To Get Started" },
 ]}
 >
 <form onSubmit={submit} className="flex flex-col gap-4">
<TextField label="Employer / Company Name" value={company} onChange={setCompany} placeholder="e.g. Zoho Corporation" error={errors.company} />
 <TextField label="Your Name" value={name} onChange={setName} placeholder="e.g. Priya" error={errors.name} autoFocus />
 <TextField
 label="Company Contact Number"
 value={mobile}
 onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
 placeholder="9876543210"
 inputMode="numeric"
 maxLength={10}
 error={errors.mobile}
 />
 <TextField
 label="Company Email-ID"
 type="email"
 value={email}
 onChange={setEmail}
 placeholder="you@company.com"
 inputMode="email"
 error={errors.email}
 hint="We’ll Send a 6-Digit OTP to Verify Your Account"
 />

 {errors.general && (
 <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {errors.general}
 </p>
 )}

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
 Already have an Account?{" "}
 <Link to="/employer/login" className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
 Sign in
 </Link>
 </p>
 </form>
 </AuthLayout>
 );
}
