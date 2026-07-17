import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, SkipForward } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../store/auth";
import { authApi } from "../lib/api/auth";
import { generateOtp, getActiveOtp, verifyOtp as verifyOtpLocal } from "../lib/otp";
import { apiEnabled, ApiError } from "../lib/api";

/**
 * Two-step wizard on one page:
 *   1. `verify`    — enter the 6-digit OTP → verifies + signs in
 *   2. `password`  — inline "set a password?" prompt, skippable
 *
 * Step 2 only appears when the newly-signed-in user has no password
 * yet AND the API is on (so we can actually POST /auth/password/set-
 * initial). Users who already have a password go straight to the
 * dashboard.
 *
 * User can Skip step 2 at any time and never see it again on future
 * OTP sign-ins (unless they clear it again from settings).
 */
export function CandidateOtp() {
  const [params] = useSearchParams();
  const email = params.get("email") ?? "";
  const initialMode = params.get("mode") === "login" ? "login" : "register";
  const navigate = useNavigate();
  const verifyOtpAsync = useAuth((s) => s.verifyOtpAsync);
  const loginAsync = useAuth((s) => s.loginAsync);
  const markVerified = useAuth((s) => s.markVerified);
  const loginByEmail = useAuth((s) => s.loginByEmail);

  const [step, setStep] = useState<"verify" | "password">("verify");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"register" | "login">(initialMode);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate("/candidate/register", { replace: true });
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
      // If the newly-signed-in user has no password yet, drop into
      // step 2 on this same page instead of navigating away. Simpler
      // mental model — "one page, done."
      const me = useAuth.getState().currentUser;
      if (apiEnabled && me && me.hasPassword === false) {
        setStep("password");
      } else {
        navigate("/candidate/dashboard", { replace: true });
      }
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
      title={step === "password" ? "One quick step" : mode === "login" ? "Sign in with code" : "Verify your email"}
      subtitle={step === "password"
        ? "Set a password so you can sign in faster next time — or skip."
        : `We sent a 6-digit code to ${email}`}
    >
      {step === "verify" ? (
        <>
          {demoCode && (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <span>
                <strong>Demo only:</strong> {apiEnabled ? "Real email isn't wired yet — code from server below." : "No email is actually sent."}
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
                    className="h-14 w-12 rounded-lg bg-white text-center text-xl font-semibold text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-zinc-950 dark:text-zinc-100 sm:w-14 border border-zinc-200 dark:border-zinc-800"
                  />
                ))}
              </div>
              {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg hover:shadow-brand-500/40 disabled:opacity-60"
            >
              {submitting ? "Verifying..." : "Verify and continue"}
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
        </>
      ) : (
        <InlineSetPasswordStep
          onDone={() => navigate("/candidate/dashboard", { replace: true })}
          brandClass="from-brand-500 to-brand-600 shadow-brand-500/30"
        />
      )}
    </AuthLayout>
  );
}

/**
 * Step-2 subform — appears inline once OTP is verified for a user
 * without a password. Skip and Set both call onDone() so the parent
 * navigates to the dashboard either way.
 */
export function InlineSetPasswordStep({
  onDone,
  brandClass = "from-brand-500 to-brand-600 shadow-brand-500/30",
}: {
  onDone: () => void;
  brandClass?: string;
}) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setIt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwd.length < 8) return setError("Password must be at least 8 characters.");
    if (pwd !== confirm) return setError("Passwords don't match.");
    setSubmitting(true);
    try {
      await authApi.setInitialPassword(pwd);
      // Flip hasPassword in the local store so the prompt doesn't
      // reappear on the next OTP session.
      useAuth.setState((s) => ({
        currentUser: s.currentUser ? { ...s.currentUser, hasPassword: true } : s.currentUser,
      }));
      onDone();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "PASSWORD_EXISTS"
          ? "You already have a password."
          : code === "PASSWORD_TOO_SHORT"
            ? "Password must be at least 8 characters."
            : "Could not set the password. Try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={setIt} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">New password</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="At least 8 characters"
            autoFocus
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Confirm password</label>
        <input
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type it again"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className={["mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60", brandClass].join(" ")}
      >
        <KeyRound size={16} /> {submitting ? "Saving..." : "Set password"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <SkipForward size={12} /> Skip — I'll use OTP for now
      </button>
      <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        You can set or change your password any time from{" "}
        <a href="/settings/account" className="hover:underline">
          account settings
        </a>
        .
      </p>
    </form>
  );
}
