import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { TextField } from "../components/TextField";
import { adminLogin, getAdminCreds } from "../store/admin";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = adminLogin(email, password);
    if (!role) {
      setError("Invalid email or password");
      return;
    }
    navigate(role === "super_admin" ? "/super-admin/dashboard" : "/admin/dashboard", { replace: true });
  };

  return (
    <AuthLayout title="Internal access" subtitle="Sign in to the admin panel" bgImage="/images/background-04.jpg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="admin@itr.com"
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
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-11 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900"
        >
          <ShieldCheck size={16} />
          Sign in
        </button>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="mb-1 font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">Demo credentials</p>
          {getAdminCreds().map(({ email, password, role }) => (
            <p key={email} className="font-mono text-amber-800 dark:text-amber-300/90">
              {role === "super_admin" ? "Super " : ""}Admin · <strong>{email}</strong> / <strong>{password}</strong>
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
