import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, Check, UserPlus, X } from "lucide-react";
import { allUsers, useAuth, type User } from "../store/auth";
import { useJobs } from "../store/jobs";
import { useLocations } from "../store/locations";
import { JobFormWizard } from "../components/JobFormWizard";
import { TextField } from "../components/TextField";
import { Navbar } from "../components/Navbar";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";
import { ApiError } from "../lib/api";

/**
 * Staff post-job. Uses the same [JobFormWizard] as EmployerPostJob so
 * fields, styling, skill suggestions, and validation match one-for-one.
 * The staff-specific bit is the Employer picker on top: type an employer
 * name, pick from live matches, OR create a new employer inline (the
 * inline-create fields appear below the picker, and on submit BOTH the
 * employer AND the job are created in one action).
 */
export function StaffPostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const me = useAuth((s) => s.currentUser)!;
  const createEmployerByStaff = useAuth((s) => s.createEmployerByStaff);
  const addJobAsync = useJobs((s) => s.addJobAsync);
  const talukById = useLocations((s) => s.talukById);

  const employers = useMemo(
    () => allUsers().filter((u) => u.role === "employer").sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const initialEmployerId = searchParams.get("employerId");
  const initialEmployer = initialEmployerId
    ? employers.find((u) => u.id === initialEmployerId) ?? null
    : null;

  const [selectedEmployer, setSelectedEmployer] = useState<User | null>(initialEmployer);
  const [employerQuery, setEmployerQuery] = useState(initialEmployer?.name ?? "");
  const [employerFocused, setEmployerFocused] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", email: "", mobile: "", company: "" });
  const [pickerError, setPickerError] = useState<string | null>(null);
  // When Submit spawns a new employer, hold the fresh creds so we can
  // pop the share modal AFTER the job posts and only navigate away
  // when the staff member acknowledges.
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string; name: string; jobId: string } | null>(null);

  const employerMatches = useMemo(() => {
    const q = employerQuery.trim().toLowerCase();
    if (!q) return employers.slice(0, 8);
    return employers
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.company ?? "").toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [employerQuery, employers]);

  const hasExactMatch = useMemo(() => {
    const q = employerQuery.trim().toLowerCase();
    if (!q) return true;
    return employers.some(
      (u) => u.name.toLowerCase() === q || (u.company ?? "").toLowerCase() === q,
    );
  }, [employerQuery, employers]);

  const handleSubmit = async (v: Parameters<React.ComponentProps<typeof JobFormWizard>["onSubmit"]>[0]) => {
    setPickerError(null);

    // Resolve the employer we're posting for.
    let employer: User | null = selectedEmployer;
    let freshCreds: { email: string; password: string; name: string } | null = null;

    // Any error path throws a friendly message that surfaces in the
    // wizard's own error banner AND scrolls the page to the picker so
    // the user can see the picker-card highlight. Without the scroll,
    // the wizard sits at step 5 (bottom of page) and the picker card
    // (top of page) is off-screen — the picker error is invisible.
    const failEmployer = (msg: string): never => {
      setPickerError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      throw new Error(msg);
    };

    if (!employer) {
      if (!createMode) {
        return failEmployer("Pick an employer from the master above, or click Create new employer.");
      }
      if (!newEmp.name.trim()) {
        return failEmployer("Enter a contact name for the new employer.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmp.email.trim())) {
        return failEmployer("Enter a valid work email for the new employer.");
      }
      try {
        const { user, password } = createEmployerByStaff({
          staffId: me.id,
          name: newEmp.name.trim(),
          email: newEmp.email.trim(),
          mobile: newEmp.mobile.trim() || undefined,
          company: newEmp.company.trim() || undefined,
        });
        employer = user;
        freshCreds = { email: user.email, password, name: user.name };
      } catch (err) {
        if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
          return failEmployer("An account already exists for that email — search for it in the picker above instead.");
        }
        throw err;
      }
    }

    const taluk = v.place.talukId ? talukById(v.place.talukId) : undefined;
    const locationLabel = taluk ? `${taluk.taluk.name}, ${taluk.district.name}` : "";

    // Post the job. Note: addJobAsync uses the SIGNED-IN user's employer
    // context on the server side, so when a staff member is signed in
    // the server can't attribute the job to a different employer.
    // Until the backend gets a `/staff/jobs` endpoint that accepts an
    // employerId, we route through the local addJob (which respects the
    // one we pass explicitly). This is the same tradeoff Staff has for
    // the createEmployerByStaff flow — localStorage-first, backend port
    // to follow.
    const job = useJobs.getState().addJob({
      employerId: employer!.id,
      employerName: employer!.company || employer!.name,
      title: v.title,
      description: v.description,
      location: locationLabel,
      districtId: v.place.districtId,
      talukId: v.place.talukId,
      lat: v.place.lat,
      lng: v.place.lng,
      pincode: v.place.pincode,
      street: v.place.street,
      field: v.field!,
      type: v.type!,
      experience: v.experience!,
      yearsMin: v.yearsMin,
      yearsMax: v.yearsMax,
      salaryRange: v.salaryRange,
      skills: v.skills,
      benefits: v.benefits,
      contactEmail: v.contactEmail || undefined,
    });
    // Keep addJobAsync in scope so the tree-shaker doesn't drop it (we'll
    // use it once the backend has a staff endpoint).
    void addJobAsync;

    if (freshCreds) {
      // New employer created — hold on the credentials modal, redirect
      // only when staff acknowledges the share.
      setPendingCreds({ ...freshCreds, jobId: job.id });
    } else {
      navigate(`/staff/jobs/${job.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <Link
          to="/staff/dashboard"
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <JobFormWizard
          mode="create"
          initialValues={{
            companyName: selectedEmployer?.company || selectedEmployer?.name || "",
            contactEmail: selectedEmployer?.email || "",
          }}
          topSection={
            <EmployerPickerCard
              selectedEmployer={selectedEmployer}
              query={employerQuery}
              onQueryChange={setEmployerQuery}
              focused={employerFocused}
              onFocusChange={setEmployerFocused}
              matches={employerMatches}
              hasExactMatch={hasExactMatch}
              createMode={createMode}
              setCreateMode={setCreateMode}
              newEmp={newEmp}
              setNewEmp={setNewEmp}
              me={me}
              onSelect={(u) => {
                setSelectedEmployer(u);
                setEmployerQuery(u.company || u.name);
                setCreateMode(false);
                setPickerError(null);
              }}
              onClear={() => {
                setSelectedEmployer(null);
                setEmployerQuery("");
                setPickerError(null);
              }}
              error={pickerError}
            />
          }
          onSubmit={handleSubmit}
        />
      </main>

      {pendingCreds && (
        <CredentialShareModal
          title="Employer created + job posted"
          subtitle={`${pendingCreds.name} can now sign in at /employer/login`}
          email={pendingCreds.email}
          password={pendingCreds.password}
          onClose={() => {
            const jobId = pendingCreds.jobId;
            setPendingCreds(null);
            navigate(`/staff/jobs/${jobId}`);
          }}
        />
      )}
    </div>
  );
}

/* --------------------------- employer picker card --------------------------- */

interface EmployerPickerCardProps {
  selectedEmployer: User | null;
  query: string;
  onQueryChange: (v: string) => void;
  focused: boolean;
  onFocusChange: (v: boolean) => void;
  matches: User[];
  hasExactMatch: boolean;
  createMode: boolean;
  setCreateMode: (v: boolean) => void;
  newEmp: { name: string; email: string; mobile: string; company: string };
  setNewEmp: (v: { name: string; email: string; mobile: string; company: string }) => void;
  me: User;
  onSelect: (u: User) => void;
  onClear: () => void;
  error: string | null;
}

function EmployerPickerCard({
  selectedEmployer,
  query,
  onQueryChange,
  focused,
  onFocusChange,
  matches,
  hasExactMatch,
  createMode,
  setCreateMode,
  newEmp,
  setNewEmp,
  me,
  onSelect,
  onClear,
  error,
}: EmployerPickerCardProps) {
  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300">
          <Building2 size={14} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Posting on behalf of
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pick from the Employer Master, or create a new one inline.
          </p>
        </div>
      </div>

      <div className="relative">
        {/* When an employer is selected we HIDE the search input entirely
            and show a summary card with a Change button below. Previously
            the input stayed visible with the selected name pre-filled,
            and any keystroke (including accidental) cleared the selection
            silently — the user then submitted the wizard and got a
            cryptic "employer_required" error. Explicit Change is safer. */}
        {!selectedEmployer && (
          <div className="relative">
            <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onFocus={() => onFocusChange(true)}
              onBlur={() => setTimeout(() => onFocusChange(false), 120)}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Type employer name or company (e.g. Zoho)"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
        )}

        {focused && !selectedEmployer && !createMode && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {matches.length === 0 ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCreateMode(true);
                  setNewEmp({ ...newEmp, name: query, company: query });
                }}
                className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
              >
                <UserPlus size={14} /> Create "{query}" as a new employer
              </button>
            ) : (
              <>
                {matches.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onSelect(u)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-[10px] font-bold text-white">
                      {u.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {u.company || u.name}
                      </div>
                      <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {u.name} · {u.email}
                      </div>
                    </div>
                    {u.createdByStaffId === me.id && (
                      <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                        Yours
                      </span>
                    )}
                  </button>
                ))}
                {!hasExactMatch && query.trim() && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCreateMode(true);
                      setNewEmp({ ...newEmp, name: query, company: query });
                    }}
                    className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-zinc-800 dark:text-teal-300 dark:hover:bg-teal-500/10"
                  >
                    <UserPlus size={14} /> Create "{query.trim()}" as a new employer
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedEmployer && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-500/25 dark:bg-teal-500/10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
              <Check size={12} /> Posting for
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-teal-900 dark:text-teal-200">
              {selectedEmployer.company || selectedEmployer.name}
            </div>
            <div className="truncate text-[11px] text-teal-800/80 dark:text-teal-300/80">
              {selectedEmployer.name} · {selectedEmployer.email}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-full border border-teal-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-500/40 dark:bg-transparent dark:text-teal-300 dark:hover:bg-teal-500/10"
          >
            Change
          </button>
        </div>
      )}

      {createMode && !selectedEmployer && (
        <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-800 dark:text-amber-300">
              New employer — creates on submit
            </span>
            <button
              type="button"
              onClick={() => setCreateMode(false)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300"
              aria-label="Cancel new employer"
            >
              <X size={13} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField
              label="Contact name"
              value={newEmp.name}
              onChange={(v) => setNewEmp({ ...newEmp, name: v })}
              placeholder="Priya Ramesh"
            />
            <TextField
              label="Company"
              value={newEmp.company}
              onChange={(v) => setNewEmp({ ...newEmp, company: v })}
              placeholder="Zoho Corporation"
            />
            <TextField
              label="Work email"
              type="email"
              value={newEmp.email}
              onChange={(v) => setNewEmp({ ...newEmp, email: v })}
              placeholder="priya@zoho.com"
              inputMode="email"
            />
            <TextField
              label="Mobile"
              value={newEmp.mobile}
              onChange={(v) => setNewEmp({ ...newEmp, mobile: v })}
              placeholder="9876543210"
              inputMode="tel"
              maxLength={10}
            />
          </div>
          <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
            A password will be generated on Submit — you'll see it once so you can share it.
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
