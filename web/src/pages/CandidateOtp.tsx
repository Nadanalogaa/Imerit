import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../store/auth";
import { generateOtp, getActiveOtp, verifyOtp } from "../lib/otp";

export function CandidateOtp() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const mode = params.get("mode") === "login" ? "login" : "register";
  const navigate = useNavigate();
  const markVerified = useAuth((s) => s.markVerified);
  const loginByEmail = useAuth((s) => s.loginByEmail);

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/candidate/register", { replace: true });
      return;
    }
    setDemoCode(getActiveOtp(email));
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits");
      return;
    }
    if (!verifyOtp(email, code)) {
      setError("Invalid or expired code. Try again.");
      return;
    }
    if (mode === "login") {
      loginByEmail(email);
    } else {
      markVerified(email);
    }
    navigate("/candidate/dashboard", { replace: true });
  };

  const resend = () => {
    const code = generateOtp(email);
    setDemoCode(code);
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    inputs.current[0]?.focus();
  };

  return (
    <AuthLayout
      title={mode === "login" ? "Sign in with code" : "Verify your email"}
      subtitle={`We sent a 6-digit code to ${email}`}
    >
      {demoCode && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          <span>
            <strong>Demo only:</strong> No email is actually sent.
          </span>
          <span className="font-mono text-base font-bold tracking-widest">{demoCode}</span>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Enter 6-digit code
          </label>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                inputMode="numeric"
                maxLength={1}
                className="h-14 w-12 rounded-2xl border border-zinc-200 bg-white text-center text-xl font-semibold text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 sm:w-14"
              />
            ))}
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40"
        >
          Verify and continue
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </button>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <Link to={mode === "login" ? "/candidate/login" : "/candidate/register"} className="hover:underline">
            ← Wrong email?
          </Link>
          <button type="button" onClick={resend} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Resend code
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
