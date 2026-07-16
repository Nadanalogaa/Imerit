import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Users2 } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import { ApiError } from "../lib/api";

/**
 * Staff-only login. Password-based (no OTP) because staff is an internal
 * lane bootstrapped by super-admin and the auth flow needs to work before
 * email is wired. Same shell as the other login pages — different tone
 * (teal → matches the internal-ops feel of the admin login).
 */
export function StaffLogin() {
  const navigate = useNavigate();
  const passwordLogin = useAuth((s) => s.passwordLogin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    if (password.length < 6) {
      setError("Password looks incomplete");
      return;
    }
    setSubmitting(true);
    try {
      const user = await passwordLogin(email, password);
      if (user.role !== "staff") {
        setError("That account isn't a staff account. Use the correct login for your role.");
        return;
      }
      navigate("/staff/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ACCOUNT_DEACTIVATED") {
          setError("This staff account is deactivated. Ask a super-admin to reactivate it.");
        } else {
          setError("Incorrect email or password.");
        }
      } else {
        setError("Login failed — please try again in a moment.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Staff sign in"
      subtitle="Sign in with the credentials your super-admin shared with you."
      tone="sky"
      bgImage="/images/background-04.jpg"
      panelTitle="Post jobs on behalf of employers"
      panelCopy="Manage the Employer Master and publish jobs for the companies you support. Staff accounts are provisioned by the super-admin."
      highlights={[
        "Employer Master directory",
        "Smart post-job with typeahead",
        "One-tap password sharing",
      ]}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Staff email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          inputMode="email"
          autoFocus
        />
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
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg disabled:opacity-60"
        >
          <KeyRound size={16} /> {submitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <p className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
            <Users2 size={12} /> No account yet?
          </p>
          <p className="mt-1">
            Staff accounts are created by the super-admin from{" "}
            <span className="font-mono">/super-admin/staff</span>. Ask them to invite you.
          </p>
        </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
