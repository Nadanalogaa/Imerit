import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, KeyRound } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { adminLogin, getAdminCreds } from "../store/admin";
import { apiEnabled, ApiError } from "../lib/api";

export function AdminLogin() {
 const navigate = useNavigate();
 const loginAsync = useAuth((s) => s.loginAsync);
 const verifyOtpAsync = useAuth((s) => s.verifyOtpAsync);

 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [show, setShow] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);

 // OTP step state (only used in API mode)
 const [stage, setStage] = useState<"email" | "otp">("email");
 const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
 const [demoCode, setDemoCode] = useState<string | null>(null);
 const inputs = useRef<(HTMLInputElement | null)[]>([]);

 const goToDashboard = (role: "admin" | "super_admin") => {
 navigate(role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard", { replace: true });
 };

 /* ----- Local mock flow (kept for back-compat when VITE_API_URL is unset) ----- */
 const submitLocal = (e: React.FormEvent) => {
 e.preventDefault();
 const role = adminLogin(email, password);
 if (!role) {
 setError("Invalid email or password");
 return;
 }
 goToDashboard(role);
 };

 /* ----- API flow: email → OTP → role check ----- */
 const submitEmail = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
 setError("Enter a valid email");
 return;
 }
 setSubmitting(true);
 try {
 const { devCode } = await loginAsync(email);
 if (devCode) setDemoCode(devCode);
 setStage("otp");
 } catch (err) {
 if (err instanceof ApiError && err.code === "USER_NOT_FOUND") {
 setError("No admin account with that email. Ask a super admin to seed it on the backend.");
 } else if (err instanceof ApiError && err.code === "OTP_TOO_SOON") {
 setError("Please wait a minute before requesting another code.");
 setStage("otp"); // they may already have a usable code
 } else {
 setError(err instanceof Error ? err.message : "Could not send code.");
 }
 } finally {
 setSubmitting(false);
 }
 };

 const submitOtp = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 const code = digits.join("");
 if (code.length !== 6) {
 setError("Enter all 6 digits");
 return;
 }
 setSubmitting(true);
 try {
 const user = await verifyOtpAsync({ email, code, purpose: "login" });
 if (user.role !== "admin" && user.role !== "super_admin") {
 setError("That account isn't an admin. Use the candidate or employer login instead.");
 return;
 }
 goToDashboard(user.role);
 } catch (err) {
 if (err instanceof ApiError) {
 const map: Record<string, string> = {
 OTP_NOT_FOUND: "No code requested. Hit Resend below.",
 OTP_EXPIRED: "This code expired. Hit Resend below.",
 OTP_INVALID: "Incorrect code.",
 OTP_LOCKED: "Too many wrong attempts. Hit Resend below.",
 };
 setError(map[err.code] ?? err.message);
 } else {
 setError(err instanceof Error ? err.message : "Verification failed.");
 }
 } finally {
 setSubmitting(false);
 }
 };

 const onChange = (i: number, v: string) => {
 const next = v.replace(/\D/g, "").slice(0, 1);
 setDigits((arr) => {
 const c = [...arr];
 c[i] = next;
 return c;
 });
 if (next && i < 5) inputs.current[i + 1]?.focus();
 };
 const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
 };
 const resend = async () => {
 setError(null);
 setDigits(["", "", "", "", "", ""]);
 inputs.current[0]?.focus();
 try {
 const { devCode } = await loginAsync(email);
 if (devCode) setDemoCode(devCode);
 } catch (err) {
 if (err instanceof ApiError && err.code === "OTP_TOO_SOON") {
 setError("Please wait a minute before requesting another code.");
 } else if (err instanceof ApiError) {
 setError(err.message);
 } else {
 setError("Could not resend code.");
 }
 }
 };

 if (!apiEnabled) {
 /* ---------- Legacy mock UI (password-based) ---------- */
 return (
 <AuthLayout title="Internal access" subtitle="Sign in to the admin panel" bgImage="/images/background-04.jpg">
 <form onSubmit={submitLocal} className="flex flex-col gap-4">
 <TextField label="Email" value={email} onChange={setEmail} placeholder="admin@itr.com" inputMode="email" autoFocus />
 <div>
 <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
 <div className="relative">
 <input
 type={show ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full rounded-lg bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 border border-zinc-200 dark:border-zinc-800"
 />
 <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
 {show ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 </div>
 {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
 </div>

 <button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
 <ShieldCheck size={16} /> Sign in
 </button>

 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] dark:border-amber-500/30 dark:bg-amber-500/10">
 <p className="mb-1 font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Demo credentials</p>
 {getAdminCreds().map(({ email: e, password: p, role }) => (
 <p key={e} className="font-mono text-amber-800 dark:text-amber-300/90">
 {role === "super_admin" ? "Super " : ""}Admin · <strong>{e}</strong> / <strong>{p}</strong>
 </p>
 ))}
 </div>
 <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
 <Link to="/" className="hover:underline">← Back to home</Link>
 </p>
 </form>
 </AuthLayout>
 );
 }

 /* ---------- API UI (OTP-based) ---------- */
 return (
 <AuthLayout
 title="Internal access"
 subtitle={stage === "email" ? "Sign in to the admin panel with a one-time code." : `We sent a 6-digit code to ${email}`}
 bgImage="/images/background-04.jpg"
 >
 {stage === "email" ? (
 <form onSubmit={submitEmail} className="flex flex-col gap-4">
 <TextField label="Admin email" value={email} onChange={setEmail} placeholder="admin@yourcompany.com" inputMode="email" autoFocus error={error ?? undefined} />
 <button type="submit" disabled={submitting} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
 <KeyRound size={16} /> {submitting ? "Sending OTP..." : "Send OTP"}
 </button>
 <p className="rounded-xl bg-zinc-50 p-3 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
 The first <strong>super admin</strong> is bootstrapped via the <code className="font-mono">SUPER_ADMIN_EMAIL</code> env var. Every other admin is created by a super admin from inside the app. All admins log in with the same one-time code flow as candidates and employers — no separate password.
 </p>
 <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
 <Link to="/" className="hover:underline">← Back to home</Link>
 </p>
 </form>
 ) : (
 <form onSubmit={submitOtp} className="flex flex-col gap-4">
 {demoCode && (
 <div className="flex items-center justify-between rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
 <span><strong>Demo only:</strong> Real email isn't wired yet — code from server below.</span>
 <span className="font-mono text-base font-bold tracking-widest">{demoCode}</span>
 </div>
 )}
 <div>
 <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Enter 6-digit code</label>
 <div className="flex justify-between gap-2">
 {digits.map((d, i) => (
 <input key={i} ref={(el) => { inputs.current[i] = el; }} value={d} onChange={(e) => onChange(i, e.target.value)} onKeyDown={(e) => onKeyDown(i, e)} inputMode="numeric" maxLength={1} className="h-14 w-12 rounded-lg bg-white text-center text-xl font-semibold text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 dark:text-zinc-100 sm:w-14 border border-zinc-200 dark:border-zinc-800" />
 ))}
 </div>
 {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
 </div>
 <button type="submit" disabled={submitting} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60 dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900">
 <ShieldCheck size={16} /> {submitting ? "Verifying..." : "Verify and continue"}
 </button>
 <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
 <button type="button" onClick={() => setStage("email")} className="hover:underline">← Wrong email?</button>
 <button type="button" onClick={resend} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Resend code</button>
 </div>
 </form>
 )}
 </AuthLayout>
 );
}
