import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, KeyRound, Lock, Pencil, ShieldCheck, User as UserIcon, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { authApi } from "../lib/api/auth";
import { employerProfileApi } from "../lib/api/profile";
import { useAuth } from "../store/auth";
import { ApiError, apiEnabled } from "../lib/api";
import { TextField } from "../components/TextField";

/**
 * Signed-in user's account settings — currently just the password
 * management surface, but named generically so future settings
 * (notifications, profile, delete-account) can slot in as new
 * sections without a route change.
 *
 * The password section renders one of two forms based on
 * `user.hasPassword`:
 *   - hasPassword = true  → "Change password" (old + new)
 *   - hasPassword = false → "Set a password" (just new, links to
 *     the shared /set-password page)
 */
export function AccountSettings() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser);

  if (!user) {
    // Shouldn't happen — this route is behind RequireAuth — but guard
    // anyway so a stale redirect doesn't crash on user=null.
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8 md:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            Account settings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            {user.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {user.email}
          </p>
        </div>

        {/* Password section */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Password</h2>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                {user.hasPassword
                  ? "Change your password. You'll still be able to sign in via OTP too."
                  : "Set a password so you can sign in without waiting for an OTP email."}
              </p>
            </div>
          </div>

          {user.hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <Link
              to="/set-password"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg"
            >
              <ShieldCheck size={14} /> Set a password
            </Link>
          )}
        </section>

        {/* Account section — editable name + mobile via the pencil icon.
            Email and role stay locked (email = account key; role changes
            are admin-only). */}
        <AccountIdentitySection />
      </main>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={["mt-0.5 text-sm text-zinc-900 dark:text-zinc-100", className].join(" ")}>{value}</dd>
    </div>
  );
}

/**
 * "Account" card — read-only view by default, flips to an inline edit
 * form when the pencil icon in the header is clicked. Only name and
 * mobile are editable (email is the account key; role changes are
 * admin-only). On save we hit PATCH /auth/me and refresh the local
 * useAuth store so the header + dashboards pick up the new values
 * without a page reload.
 */
function AccountIdentitySection() {
  const user = useAuth((s) => s.currentUser)!;
  const refreshFromServer = useAuth((s) => s.refreshFromServer);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Employer accounts get a locked Company row sourced from
  // EmployerProfile.companyName — the User.name column is the CONTACT
  // PERSON's name (which some employers unfortunately filled with the
  // company name at signup), and only super-admin can change the
  // canonical company on /admin/employers/:id.
  const [company, setCompany] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (user.role !== "employer" || !apiEnabled) return;
    let alive = true;
    employerProfileApi.getMine()
      .then(({ profile }) => { if (alive) setCompany(profile.companyName?.trim() || undefined); })
      .catch(() => { /* leave blank */ });
    return () => { alive = false; };
  }, [user.role]);

  const startEdit = () => {
    setName(user.name);
    setMobile(user.mobile ?? "");
    setError(null);
    setSuccess(null);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    setError(null);
    setSuccess(null);
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await authApi.updateMe({
        name: trimmedName,
        mobile: mobile.trim() === "" ? null : mobile.trim(),
      });
      // Pull the fresh user row back through the store so every hook
      // that reads `useAuth(s => s.currentUser)` re-renders.
      await refreshFromServer?.();
      setSuccess("Saved.");
      setEditing(false);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "MOBILE_TOO_SHORT"
          ? "Mobile number looks too short."
          : code === "NAME_TOO_SHORT"
            ? "Name must be at least 2 characters."
            : code === "NAME_TOO_LONG"
              ? "Name is too long."
              : "Could not save. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
            <UserIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold">Account</h2>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              Update your contact name or mobile number. Email{user.role === "employer" ? ", role and company name" : " and role"} are locked.
            </p>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            title="Edit contact details"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={user.role === "employer" ? "Contact person name" : "Name"}
              value={name}
              onChange={setName}
              placeholder={user.role === "employer" ? "e.g. Priya Ramesh" : "Your full name"}
            />
            <TextField label="Mobile" value={mobile} onChange={setMobile} placeholder="9876543210" inputMode="tel" />
          </div>
          {user.role === "employer" && (
            <LockedCompanyRow value={company} />
          )}
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label={user.role === "employer" ? "Contact person" : "Name"} value={user.name} />
            <Field label="Email" value={user.email} />
            {user.mobile && <Field label="Mobile" value={user.mobile} />}
            <Field label="Role" value={user.role.replace("_", " ")} className="capitalize" />
            <Field
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            />
          </dl>
          {user.role === "employer" && (
            <div className="mt-3">
              <LockedCompanyRow value={company} />
            </div>
          )}
          {success && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{success}</p>}
        </>
      )}
    </section>
  );
}

/** The change-password subform. Extracted so the parent can conditionally render it. */
function ChangePasswordForm() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!oldPwd) return setError("Enter your current password.");
    if (newPwd.length < 8) return setError("New password must be at least 8 characters.");
    if (newPwd === oldPwd) return setError("New password must be different from the current one.");
    if (newPwd !== confirm) return setError("New passwords don't match.");

    setSubmitting(true);
    try {
      await authApi.changePassword(oldPwd, newPwd);
      setOldPwd(""); setNewPwd(""); setConfirm("");
      setSuccess("Password changed. Use the new one next time you sign in.");
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "OLD_PASSWORD_INVALID"
          ? "Current password is incorrect."
          : code === "PASSWORD_TOO_SHORT"
            ? "New password must be at least 8 characters."
            : code === "PASSWORD_UNCHANGED"
              ? "New password must be different from the current one."
              : "Could not change the password. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-3 max-w-md">
      <FieldPassword label="Current password" value={oldPwd} onChange={setOldPwd} show={show} />
      <FieldPassword label="New password" value={newPwd} onChange={setNewPwd} show={show} placeholder="At least 8 characters" />
      <FieldPassword label="Confirm new password" value={confirm} onChange={setConfirm} show={show} />
      <label className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-3.5 w-3.5" />
        Show passwords
      </label>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg disabled:opacity-60"
      >
        <KeyRound size={14} /> {submitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

function FieldPassword({
  label,
  value,
  onChange,
  show,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Clear"
          tabIndex={-1}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

/**
 * Locked "Company" row for the employer account settings. The value is
 * the canonical `EmployerProfile.companyName` — Super Admin owns it, so
 * we render it disabled with a padlock and a "Contact your account
 * manager" hint. Employers see it always; other roles never render.
 */
function LockedCompanyRow({ value }: { value?: string }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <Building2 size={11} /> Company (locked)
      </label>
      <div className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3.5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <Lock size={12} className="text-zinc-400" />
        <span className="truncate">{value?.trim() || "—"}</span>
      </div>
      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        Only Super Admin can change your company name. Contact your account manager to update it.
      </p>
    </div>
  );
}
