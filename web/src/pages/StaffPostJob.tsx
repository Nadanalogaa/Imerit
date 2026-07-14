import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Send,
  Check,
  Plus,
  Sparkles,
  MapPin,
  X,
  UserPlus,
  IndianRupee,
} from "lucide-react";
import { allUsers, useAuth, type User } from "../store/auth";
import {
  JOB_BENEFITS,
  useJobs,
  type JobBenefit,
  type JobExperience,
  type JobField,
  type JobType,
} from "../store/jobs";
import { publicLabel, type PlaceRef, isPlaceSet } from "../store/locations";
import { LocationPicker } from "../components/LocationPicker";
import { TextField } from "../components/TextField";
import { StaffTopBar } from "./StaffDashboard";
import { CredentialShareModal } from "../components/staff/CredentialShareModal";
import { ApiError } from "../lib/api";

const JOB_TYPES: { id: JobType; label: string }[] = [
  { id: "full_time", label: "Full-time" },
  { id: "part_time", label: "Part-time" },
  { id: "internship_training", label: "Internship / Training" },
  { id: "apprentice", label: "Apprentice" },
  { id: "contract", label: "Contract" },
  { id: "consultant", label: "Consultant" },
  { id: "freelancer", label: "Freelancer" },
  { id: "gig_delivery", label: "Gig / Delivery" },
];

/**
 * Staff-flavored post-job flow. Lean single-page form (no wizard) — staff
 * volume-post, so extra clicks per job compound. The centrepiece is the
 * Employer combobox at the top: type the employer name, see live matches
 * from the master, tap one to auto-fill; if nothing matches, a
 * "+ Create new employer" chip inlines the create flow so it happens as
 * part of Submit rather than a detour.
 */
export function StaffPostJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const me = useAuth((s) => s.currentUser)!;
  const logout = useAuth((s) => s.logout);
  const createEmployerByStaff = useAuth((s) => s.createEmployerByStaff);
  const addJob = useJobs((s) => s.addJob);

  // ---------- employer picker state ----------
  const employers = useMemo(
    () => allUsers().filter((u) => u.role === "employer").sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const initialEmployerId = searchParams.get("employerId");
  const initialEmployer = initialEmployerId ? employers.find((u) => u.id === initialEmployerId) ?? null : null;

  const [selectedEmployer, setSelectedEmployer] = useState<User | null>(initialEmployer);
  const [employerQuery, setEmployerQuery] = useState(initialEmployer?.name ?? "");
  const [employerFocused, setEmployerFocused] = useState(false);

  // Inline new-employer create fields — shown when staff opts to create
  // rather than pick.
  const [createMode, setCreateMode] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: "", email: "", mobile: "", company: "" });

  // ---------- job fields ----------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState<JobField>("it");
  const [type, setType] = useState<JobType>("full_time");
  const [experience, setExperience] = useState<JobExperience>("any");
  const [yearsMin, setYearsMin] = useState<string>("");
  const [yearsMax, setYearsMax] = useState<string>("");
  const [salaryRange, setSalaryRange] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<JobBenefit[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [place, setPlace] = useState<PlaceRef>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // When the created job spawns fresh credentials for a NEW employer,
  // hold them here so we can show the modal + only navigate away when
  // staff acknowledges the share.
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string; name: string; jobId: string } | null>(null);

  // Prefill contact email from selected employer if staff hasn't typed one.
  useEffect(() => {
    if (selectedEmployer && !contactEmail) setContactEmail(selectedEmployer.email);
  }, [selectedEmployer, contactEmail]);

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

  /* ---------- skills chip helpers ---------- */

  const addSkill = () => {
    const v = skillDraft.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) {
      setSkillDraft("");
      return;
    }
    setSkills([...skills, v]);
    setSkillDraft("");
  };

  /* ---------- benefits toggle ---------- */

  const toggleBenefit = (id: JobBenefit) => {
    setBenefits((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  /* ---------- submit ---------- */

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Resolve the employer we're posting for.
    let employer: User | null = selectedEmployer;
    let freshCreds: { email: string; password: string; name: string } | null = null;

    if (!employer) {
      if (!createMode) {
        setError("Pick an employer from the master, or tap “Create new employer”.");
        return;
      }
      if (!newEmp.name.trim()) return setError("Enter the employer contact name.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmp.email.trim())) {
        return setError("Enter a valid email for the employer.");
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
          return setError(
            "An account already exists for that email — search for it in the picker above instead.",
          );
        }
        return setError(err instanceof Error ? err.message : "Could not create employer.");
      }
    }

    // Field validation for the job itself.
    if (!title.trim()) return setError("Job title is required.");
    if (description.trim().length < 20) {
      return setError("Add at least a short description (20+ characters).");
    }
    if (!isPlaceSet(place)) return setError("Pick a location (district + taluk).");
    if (skills.length === 0) return setError("Add at least one required skill.");
    if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail.trim())) {
      return setError("Contact email looks invalid.");
    }
    if (experience === "experienced") {
      const min = yearsMin === "" ? null : Number(yearsMin);
      const max = yearsMax === "" ? null : Number(yearsMax);
      if (min == null) return setError("Set the minimum years of experience.");
      if (max != null && max < min) return setError("Max years must be ≥ min years.");
    }

    setSubmitting(true);
    const locationLabel = publicLabel(place);
    const job = addJob({
      employerId: employer.id,
      employerName: employer.company || employer.name,
      title: title.trim(),
      description: description.trim(),
      location: locationLabel,
      districtId: place.districtId,
      talukId: place.talukId,
      lat: place.lat,
      lng: place.lng,
      street: place.street,
      pincode: place.pincode,
      field,
      type,
      experience,
      yearsMin: experience === "experienced" ? Number(yearsMin) : undefined,
      yearsMax: experience === "experienced" && yearsMax !== "" ? Number(yearsMax) : undefined,
      salaryRange: salaryRange.trim() || undefined,
      skills,
      benefits: benefits.length > 0 ? benefits : undefined,
      contactEmail: contactEmail.trim() || undefined,
    });
    setSubmitting(false);

    if (freshCreds) {
      // New employer created — hold on the credentials modal, redirect
      // only when staff acknowledges the share.
      setPendingCreds({ ...freshCreds, jobId: job.id });
    } else {
      navigate("/staff/jobs", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StaffTopBar name={me.name} onLogout={logout} />
      <main className="mx-auto max-w-3xl px-5 py-8 md:py-10">
        <Link
          to="/staff/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft size={12} /> Dashboard
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Post a job on behalf of…
            </p>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              New job posting
            </h1>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Employer picker */}
          <FormCard title="Employer" hint="Pick from the master, or create a new one inline.">
            <div className="relative">
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  value={employerQuery}
                  onFocus={() => setEmployerFocused(true)}
                  onBlur={() => setTimeout(() => setEmployerFocused(false), 120)}
                  onChange={(e) => {
                    setEmployerQuery(e.target.value);
                    setSelectedEmployer(null);
                    setCreateMode(false);
                  }}
                  placeholder="Type employer name or company (e.g. Zoho)"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
                {selectedEmployer && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployer(null);
                      setEmployerQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    aria-label="Clear employer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {employerFocused && !selectedEmployer && !createMode && (
                <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  {employerMatches.length === 0 ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCreateMode(true);
                        setNewEmp((n) => ({ ...n, name: employerQuery, company: employerQuery }));
                      }}
                      className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-500/10"
                    >
                      <UserPlus size={14} /> Create "{employerQuery}" as a new employer
                    </button>
                  ) : (
                    <>
                      {employerMatches.map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedEmployer(u);
                            setEmployerQuery(u.company || u.name);
                            setCreateMode(false);
                          }}
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
                      {!hasExactMatch && employerQuery.trim() && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCreateMode(true);
                            setNewEmp((n) => ({ ...n, name: employerQuery, company: employerQuery }));
                          }}
                          className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-zinc-800 dark:text-teal-300 dark:hover:bg-teal-500/10"
                        >
                          <UserPlus size={14} /> Create "{employerQuery.trim()}" as a new employer
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {selectedEmployer && (
              <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-500/25 dark:bg-teal-500/10">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                  <Check size={12} /> Posting for
                </div>
                <div className="mt-0.5 text-sm font-semibold text-teal-900 dark:text-teal-200">
                  {selectedEmployer.company || selectedEmployer.name}
                </div>
                <div className="text-[11px] text-teal-800/80 dark:text-teal-300/80">
                  {selectedEmployer.name} · {selectedEmployer.email}
                </div>
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
                    onChange={(v) => setNewEmp((n) => ({ ...n, name: v }))}
                    placeholder="Priya Ramesh"
                  />
                  <TextField
                    label="Company"
                    value={newEmp.company}
                    onChange={(v) => setNewEmp((n) => ({ ...n, company: v }))}
                    placeholder="Zoho Corporation"
                  />
                  <TextField
                    label="Work email"
                    type="email"
                    value={newEmp.email}
                    onChange={(v) => setNewEmp((n) => ({ ...n, email: v }))}
                    placeholder="priya@zoho.com"
                    inputMode="email"
                  />
                  <TextField
                    label="Mobile"
                    value={newEmp.mobile}
                    onChange={(v) => setNewEmp((n) => ({ ...n, mobile: v }))}
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
          </FormCard>

          {/* Basics */}
          <FormCard title="Role basics">
            <div className="space-y-3">
              <TextField
                label="Job title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Senior React Developer"
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="What the role involves, who you're looking for, what a great week looks like…"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SegField label="Field">
                  <Seg selected={field === "it"} onClick={() => setField("it")}>IT</Seg>
                  <Seg selected={field === "non_it"} onClick={() => setField("non_it")}>Non-IT</Seg>
                </SegField>
                <SegField label="Experience">
                  <Seg selected={experience === "fresher"} onClick={() => setExperience("fresher")}>Fresher</Seg>
                  <Seg selected={experience === "experienced"} onClick={() => setExperience("experienced")}>Experienced</Seg>
                  <Seg selected={experience === "any"} onClick={() => setExperience("any")}>Any</Seg>
                </SegField>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Job type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as JobType)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {JOB_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {experience === "experienced" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Min years"
                    value={yearsMin}
                    onChange={setYearsMin}
                    placeholder="2"
                    inputMode="numeric"
                    maxLength={2}
                  />
                  <TextField
                    label="Max years (optional)"
                    value={yearsMax}
                    onChange={setYearsMax}
                    placeholder="5"
                    inputMode="numeric"
                    maxLength={2}
                  />
                </div>
              )}
              <TextField
                label="Salary range (optional)"
                value={salaryRange}
                onChange={setSalaryRange}
                placeholder="₹8–15 LPA"
              />
              <TextField
                label="Applications go to (optional)"
                type="email"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder={selectedEmployer?.email ?? "hiring@company.com"}
                inputMode="email"
              />
            </div>
          </FormCard>

          {/* Location */}
          <FormCard title="Location" hint="Where the role sits. Candidates match on district/taluk distance.">
            <LocationPicker value={place} onChange={setPlace} allowStreet allowPincode />
            {isPlaceSet(place) && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                <MapPin size={11} /> {publicLabel(place)}
              </div>
            )}
          </FormCard>

          {/* Skills */}
          <FormCard title="Required skills" hint="Hit Enter to add. Fuzzy-matched against candidate skill sets.">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/30"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                    aria-label={`Remove ${s}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                onBlur={addSkill}
                placeholder={skills.length === 0 ? "e.g. React, Node.js, PostgreSQL" : "Add another…"}
                className="min-w-[120px] flex-1 bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </FormCard>

          {/* Benefits */}
          <FormCard title="Benefits" hint="Optional — shown as pills on the job card.">
            <div className="flex flex-wrap gap-1.5">
              {JOB_BENEFITS.map((b) => {
                const selected = benefits.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBenefit(b.id)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                      selected
                        ? "border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/30"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                    ].join(" ")}
                  >
                    {selected ? <Check size={11} /> : <Plus size={11} />}
                    {b.label}
                  </button>
                );
              })}
            </div>
          </FormCard>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Posts live for <strong>45 days</strong>. Can be reposted from the employer's my-jobs.
            </div>
            <div className="flex gap-2">
              <Link
                to="/staff/dashboard"
                className="inline-flex items-center gap-1.5 rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:shadow-lg disabled:opacity-60"
              >
                <Send size={14} /> {submitting ? "Publishing…" : "Publish job"}
              </button>
            </div>
          </div>
        </form>
      </main>

      {pendingCreds && (
        <CredentialShareModal
          title="Employer created + job posted"
          subtitle={`${pendingCreds.name} can now sign in at /employer/login`}
          email={pendingCreds.email}
          password={pendingCreds.password}
          onClose={() => {
            navigate("/staff/jobs", { replace: true });
          }}
        />
      )}
    </div>
  );
}

/* --------------------------------- primitives -------------------------------- */

function FormCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {hint && <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SegField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}

function Seg({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
        selected
          ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// Referenced icon imports we ended up needing beyond the initial set —
// kept here so a future edit that reorders sections doesn't accidentally
// tree-shake the icons away.
export const _ICONS_USED = { Sparkles, IndianRupee };
