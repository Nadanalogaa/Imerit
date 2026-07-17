import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { generateOtp } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

/**
 * Employer sign-in has two modes now:
 *
 *  * **OTP** (default) — the historical path used by self-registered
 *    employers who verified their email.
 *  * **Password** — for employers provisioned by staff via the Employer
 *    Master. Staff hand over creds manually until email is wired, so
 *    those employers can't receive an OTP.
 *
 * The mode toggle sits inline so employers who don't know about the
 * password path can ignore it — the OTP flow is unchanged.
 */
export function EmployerLogin() {
 const navigate = useNavigate();
 const loginAsync = useAuth((s) => s.loginAsync);
 const findByEmail = useAuth((s) => s.findByEmail);
 const passwordLogin = useAuth((s) => s.passwordLogin);

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

 // Password path — staff-provisioned employers whose creds bypass OTP.
 if (mode === "password") {
 if (password.length < 6) {
 setError("Password looks incomplete");
 return;
 }
 setSubmitting(true);
 try {
 const user = await passwordLogin(email, password);
 if (user.role !== "employer") {
 setError("That account isn't an employer. Use the correct login for your role.");
 return;
 }
 navigate("/employer/dashboard", { replace: true });
 } catch (err) {
 setError(
 err instanceof ApiError && err.code === "ACCOUNT_DEACTIVATED"
 ? "This employer account is deactivated. Ask your recruiter to reactivate it."
 : "That email + password combo didn't match. If your recruiter didn't share a password, use email OTP instead.",
 );
 } finally {
 setSubmitting(false);
 }
 return;
 }

 // Default OTP path.
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
 <AuthLayout
 title="Welcome back"
 subtitle="Sign in to your employer account with a one-time email code."
 tone="sky"
 bgImage="/images/background-02.jpg"
 panelTitle="Manage live jobs and applicants"
 panelCopy="Return to your hiring dashboard, keep openings updated, and review applicants from one place."
 highlights={[
 "Simple OTP-based sign-in",
 "Manage posted jobs quickly",
 "Return to applicants and subscriptions",
 ]}
 stats={[
 { value: "Quick", label: "access" },
 { value: "Zero", label: "passwords" },
 ]}
>
 <form onSubmit={submit} className="flex flex-col gap-4">
 <div className="grid grid-cols-2 gap-1 rounded-2xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950">
   {(["otp", "password"] as const).map((m) => (
     <button
       key={m}
       type="button"
       onClick={() => { setMode(m); setError(null); }}
       className={[
         "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
         mode === m
           ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm shadow-sky-500/30"
           : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900",
       ].join(" ")}
     >
       {m === "otp" ? <><Mail size={12} /> Email OTP</> : <><KeyRound size={12} /> Password</>}
     </button>
   ))}
 </div>

 <TextField
 label="Work email"
 type="email"
 value={email}
 onChange={setEmail}
 placeholder="you@company.com"
 inputMode="email"
 autoFocus
 error={mode === "otp" ? (error ?? undefined) : undefined}
 />

 {mode === "password" && (
   <div>
     <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
     <div className="relative">
       <input
         type={showPassword ? "text" : "password"}
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         placeholder="Ask your recruiter for the credentials"
         className="w-full rounded-lg bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-800"
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
         to="/forgot-password?lane=employer"
         className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
       >
         Forgot password?
       </Link>
     </div>
   </div>
 )}

 <button
 type="submit"
 disabled={submitting}
 className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-60"
 >
 {mode === "otp" ? (submitting ? "Sending OTP..." : "Send Email OTP") : (submitting ? "Signing in..." : "Sign in")}
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
