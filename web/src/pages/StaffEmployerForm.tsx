import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Building2, KeyRound, RotateCcw } from "lucide-react";
import { allUsers, useAuth } from "../store/auth";
import { StaffTopBar } from "./StaffDashboard";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";
import { TextField } from "../components/TextField";
import { ApiError } from "../lib/api";

/**
 * Add / edit an employer in the master. Two flows in one file:
 *
 *  - `/staff/employers/new` — id param is absent → create form. On submit
 *    generates a password and pops the CredentialShareModal so staff can
 *    hand it off before navigating back.
 *
 *  - `/staff/employers/:id` — id present → edit form. Password reset is
 *    a dedicated button (same modal for the share hand-off) so accidental
 *    field edits can't silently change the auth key.
 */
export function StaffEmployerForm() {
  const { id } = useParams<{ id?: string }>();
  const editing = !!id;
  const navigate = useNavigate();
  const me = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logout);
  const createEmployerByStaff = useAuth((s) => s.createEmployerByStaff);
  const updateEmployer = useAuth((s) => s.updateEmployer);
  const resetEmployerPassword = useAuth((s) => s.resetEmployerPassword);

  const target = useMemo(() => (id ? allUsers().find((u) => u.id === id) : null), [id]);

  const [name, setName] = useState(target?.name ?? "");
  const [email, setEmail] = useState(target?.email ?? "");
  const [mobile, setMobile] = useState(target?.mobile ?? "");
  const [company, setCompany] = useState(target?.company ?? "");
  const [error, setError] = useState<string | null>(null);
  const [freshCreds, setFreshCreds] = useState<{ email: string; password: string; name: string } | null>(null);

  if (editing && !target) {
    // ID was passed but the employer no longer exists — bounce.
    return (
      <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">Employer not found.</p>
        <Link to="/staff/employers" className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:underline">
          ← Back to master
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Enter a contact name");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("Enter a valid email");

    if (editing && target) {
      updateEmployer(target.id, {
        name: name.trim(),
        mobile: mobile.trim() || undefined,
        company: company.trim() || undefined,
      });
      navigate("/staff/employers", { replace: true });
      return;
    }

    try {
      const { user, password } = createEmployerByStaff({
        staffId: me.id,
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim() || undefined,
        company: company.trim() || undefined,
      });
      setFreshCreds({ email: user.email, password, name: user.name });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setError("An account already exists for that email. Use edit instead.");
      } else {
        setError(err instanceof Error ? err.message : "Could not create employer.");
      }
    }
  };

  const handleReset = () => {
    if (!target) return;
    if (!confirm(`Generate a new password for ${target.name}? The old one will stop working.`)) return;
    const password = resetEmployerPassword(target.id);
    setFreshCreds({ email: target.email, password, name: target.name });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StaffTopBar name={me.name} onLogout={logout} />
      <main className="mx-auto max-w-2xl px-5 py-8 md:py-10">
        <Link
          to="/staff/employers"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft size={12} /> Employer Master
        </Link>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {editing ? "Edit employer" : "Add employer to master"}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {editing
                  ? "Update contact info or reset the login password."
                  : "A password will be generated automatically — hand it to the employer so they can log in through the employer portal."}
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <TextField
              label="Contact name"
              value={name}
              onChange={setName}
              placeholder="e.g. Priya Ramesh"
              autoFocus
            />
            <TextField
              label="Company"
              value={company}
              onChange={setCompany}
              placeholder="e.g. Zoho Corporation"
            />
            <TextField
              label="Work email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="priya@zoho.com"
              inputMode="email"
              disabled={editing}
            />
            {editing && (
              <p className="-mt-1 text-[10px] text-zinc-400">
                Email is the auth key — reset the password instead of changing the address.
              </p>
            )}
            <TextField
              label="Mobile (optional)"
              value={mobile}
              onChange={setMobile}
              placeholder="9876543210"
              inputMode="tel"
              maxLength={10}
            />

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div>
                {editing && target?.sharedPassword && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    <RotateCcw size={12} /> Reset password
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  to="/staff/employers"
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition hover:shadow-lg"
                >
                  {editing ? <Save size={14} /> : <KeyRound size={14} />}
                  {editing ? "Save changes" : "Create + generate password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {freshCreds && (
        <CredentialShareModal
          title={editing ? "Password reset" : "Employer created"}
          subtitle={
            editing
              ? `New credentials for ${freshCreds.name}`
              : `${freshCreds.name} can now sign in through /employer/login`
          }
          email={freshCreds.email}
          password={freshCreds.password}
          onClose={() => {
            setFreshCreds(null);
            navigate("/staff/employers", { replace: true });
          }}
        />
      )}
    </div>
  );
}
