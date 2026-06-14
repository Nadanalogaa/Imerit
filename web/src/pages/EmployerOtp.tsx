import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../store/auth";
import { generateOtp, getActiveOtp, verifyOtp as verifyOtpLocal } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

export function EmployerOtp() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const initialMode = params.get("mode") === "login" ? "login" : "register";
  const navigate = useNavigate();
  const verifyOtpAsync = useAuth((s) => s.verifyOtpAsync);
  const loginAsync = useAuth((s) => s.loginAsync);
  const markVerified = useAuth((s) => s.markVerified);
  const loginByEmail = useAuth((s) => s.loginByEmail);

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/employer/register", { replace: true });
      return;
    }
    if (apiEnabled) {
      const code = sessionStorage.getItem(`itr.devOtp.${email.toLowerCase()}`);
      if (code) setDemoCode(code);
    } else {
      setDemoCode(getActiveOtp(email));
    }
  }, [email, navigate]);

  const onChange = (i: number, v: string) => {
    const next = v.replace(/\D/g, "").slice(0, 1);
    setDigits((arr) => {
      const copy = [...arr];
      copy[i] = next;
      return copy;
    });
    if (next && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const arr = text.split("");
    setDigits([0, 1, 2, 3, 4, 5].map((i) => arr[i] ?? ""));
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    setSubmitting(true);
    try {
      if (apiEnabled) {
        await verifyOtpAsync({ email, code, purpose: mode });
        sessionStorage.removeItem(`itr.devOtp.${email.toLowerCase()}`);
      } else {
        if (!verifyOtpLocal(email, code)) {
          setError("Invalid or expired code. Try again.");
          return;
        }
        if (mode === "login") loginByEmail(email);
        else markVerified(email);
      }
      navigate("/employer/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const map: Record<string, string> = {
          OTP_NOT_FOUND: "No code requested for this email. Tap Resend below.",
          OTP_EXPIRED: "This code expired. Tap Resend to get a fresh one.",
          OTP_INVALID: "Incorrect code. Check the digits and try again.",
          OTP_LOCKED: "Too many wrong attempts. Tap Resend to start over.",
          RATE_LIMIT: "Too many attempts. Wait a minute, then resend.",
        };
        setError(map[err.code] ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Verification failed. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError(null);
    setDigits(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
    if (apiEnabled) {
      try {
        const { devCode } = await loginAsync(email);
        if (devCode) {
          sessionStorage.setItem(`itr.devOtp.${email.toLowerCase()}`, devCode);
          setDemoCode(devCode);
        }
        setMode("login");
      } catch (err) {
        if (err instanceof ApiError && err.code === "OTP_TOO_SOON") {
          setError("Please wait a minute before requesting another code.");
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not resend code.");
        }
      }
    } else {
      const code = generateOtp(email);
      setDemoCode(code);
    }
  };

  return (
    <AuthLayout
      title={mode === "login" ? "Sign in with code" : "Verify your email"}
      subtitle={`We sent a 6-digit code to ${email}`}
      bgImage="/images/background-02.jpg"
    >
      {demoCode && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span><strong>Demo only:</strong> {apiEnabled ? "Real email isn't wired yet — code from server below." : "No email is actually sent."}</span>
          <span className="font-mono text-base font-bold tracking-widest">{demoCode}</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Enter 6-digit code</label>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                inputMode="numeric"
                maxLength={1}
                className="h-14 w-12 rounded-2xl border border-zinc-200 bg-white text-center text-xl font-semibold text-zinc-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:w-14"
              />
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-60"
        >
          {submitting ? "Verifying..." : "Verify and continue"}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </button>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <Link to={mode === "login" ? "/employer/login" : "/employer/register"} className="hover:underline">
            ← Wrong email?
          </Link>
          <button type="button" onClick={resend} className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
            Resend code
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
