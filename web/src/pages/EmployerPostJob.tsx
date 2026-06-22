import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Code2,
  MapPin,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TextField } from "../components/TextField";
import { ChipInput } from "../components/profile/ChipInput";
import { SegmentedToggle } from "../components/profile/SegmentedToggle";
import { LocationPicker } from "../components/LocationPicker";
import { StepIndicator } from "../components/profile/StepIndicator";
import { StepShell } from "../components/profile/StepShell";
import { useAuth } from "../store/auth";
import {
  JOB_BENEFITS,
  useJobs,
  type JobBenefit,
  type JobExperience,
  type JobField,
  type JobType,
} from "../store/jobs";
import { useLocations, type PlaceRef } from "../store/locations";
import { apiEnabled } from "../lib/api";
import { employerProfileApi } from "../lib/api/profile";

/**
 * Five-step wizard. Each step gates the next via validateStep(); the last
 * step fires addJobAsync + an employer-profile patch (only if logo/company
 * name actually changed).
 */
const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "skills", label: "Skills & pay" },
  { id: "location", label: "Location" },
  { id: "benefits", label: "Benefits" },
  { id: "brand", label: "Brand" },
];

export function EmployerPostJob() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const addJobAsync = useJobs((s) => s.addJobAsync);
  const talukById = useLocations((s) => s.talukById);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Job fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState<JobField | undefined>();
  const [type, setType] = useState<JobType | undefined>();
  const [experience, setExperience] = useState<JobExperience | undefined>();
  const [yearsMin, setYearsMin] = useState("");
  const [salary, setSalary] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [place, setPlace] = useState<PlaceRef>({});
  const [benefits, setBenefits] = useState<JobBenefit[]>([]);

  // Brand fields — saved on EmployerProfile, not the job
  const [companyName, setCompanyName] = useState(user.company ?? "");
  const [contactEmail, setContactEmail] = useState(user.email);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);

  // Pre-fill brand step from the saved employer profile so re-posters don't
  // have to upload their logo again.
  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    employerProfileApi.getMine()
      .then(({ profile }) => {
        if (!alive) return;
        if (profile.companyName) setCompanyName((c) => c || profile.companyName);
        if (profile.logoUrl) setLogoUrl(profile.logoUrl);
      })
      .catch(() => { /* swallow — wizard still works without it */ });
    return () => { alive = false; };
  }, []);

  const validateStep = (i: number): boolean => {
    const errs: Record<string, string> = {};
    if (i === 0) {
      if (!title.trim()) errs.title = "Required";
      if (!description.trim() || description.trim().length < 20) errs.description = "Tell us at least 20 characters";
      if (!field) errs.field = "Pick IT or Non-IT";
      if (!type) errs.type = "Pick a job type";
      if (!experience) errs.experience = "Pick an experience level";
    } else if (i === 1) {
      if (skills.length === 0) errs.skills = "Add at least one required skill";
    } else if (i === 2) {
      if (!place.districtId || !place.talukId) errs.location = "Pick district and taluk";
    } else if (i === 4) {
      if (!companyName.trim()) errs.companyName = "Required";
      if (!contactEmail.trim()) errs.contactEmail = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = async () => {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const taluk = place.talukId ? talukById(place.talukId) : undefined;
      const locationLabel = taluk ? `${taluk.taluk.name}, ${taluk.district.name}` : "";
      if (apiEnabled && (logoDirty || companyName.trim() !== (user.company ?? ""))) {
        await employerProfileApi.patch({
          companyName: companyName.trim(),
          ...(logoDirty ? { logoUrl } : {}),
        });
      }
      const job = await addJobAsync({
        title: title.trim(),
        description: description.trim(),
        location: locationLabel,
        districtId: place.districtId,
        talukId: place.talukId,
        lat: place.lat,
        lng: place.lng,
        pincode: place.pincode,
        street: place.street,
        field: field!,
        type: type!,
        experience: experience!,
        yearsMin: yearsMin ? Number(yearsMin) : undefined,
        salaryRange: salary.trim() || undefined,
        skills,
        benefits,
        contactEmail: contactEmail.trim() || undefined,
      });
      navigate(`/employer/jobs/${job.id}/applicants`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post the job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Link to="/employer/dashboard" className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Post a job</span>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight md:text-4xl">List a new opening</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Job posting is free. Be specific — required skills, location, and benefits drive a stronger match.
          </p>
        </div>

        <StepIndicator steps={STEPS} current={step} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <StepShell key="basics" title="Job basics" subtitle="Title, the role pitch, and how candidates should categorise it." onNext={next}>
              <BasicsStep
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                field={field} setField={setField}
                type={type} setType={setType}
                experience={experience} setExperience={setExperience}
                errors={errors}
              />
            </StepShell>
          )}
          {step === 1 && (
            <StepShell key="skills" title="Skills & pay" subtitle="What you need on day one, and what you're offering." onBack={back} onNext={next}>
              <SkillsStep
                skills={skills} setSkills={setSkills}
                yearsMin={yearsMin} setYearsMin={setYearsMin}
                salary={salary} setSalary={setSalary}
                errors={errors}
              />
            </StepShell>
          )}
          {step === 2 && (
            <StepShell key="location" title="Where is the role?" subtitle="District + taluk so we can match candidates near home." onBack={back} onNext={next}>
              <LocationStep place={place} setPlace={setPlace} errors={errors} />
            </StepShell>
          )}
          {step === 3 && (
            <StepShell key="benefits" title="Employee benefits" subtitle="Pick everything that applies. Candidates filter by these." onBack={back} onNext={next}>
              <BenefitsStep benefits={benefits} setBenefits={setBenefits} />
            </StepShell>
          )}
          {step === 4 && (
            <StepShell key="brand" title="Company brand" subtitle="Your logo and a hiring contact go on the listing." onBack={back} onNext={submit} nextLabel={submitting ? "Posting…" : "Post job"} isLast>
              <BrandStep
                companyName={companyName} setCompanyName={setCompanyName}
                contactEmail={contactEmail} setContactEmail={setContactEmail}
                logoUrl={logoUrl} setLogoUrl={(v) => { setLogoUrl(v); setLogoDirty(true); }}
                errors={errors}
              />
              {submitError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                  {submitError}
                </p>
              )}
            </StepShell>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ------------------------- Steps ------------------------- */

function BasicsStep(props: {
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  field?: JobField; setField: (v: JobField) => void;
  type?: JobType; setType: (v: JobType) => void;
  experience?: JobExperience; setExperience: (v: JobExperience) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <TextField label="Job title" value={props.title} onChange={props.setTitle} placeholder="e.g. Senior React developer" error={props.errors.title} />
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          <Building2 size={12} /> Description
        </label>
        <textarea
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          rows={5}
          placeholder="What the role involves, who you're looking for, day-to-day responsibilities…"
          className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{props.description.length} / 1500 characters</p>
        {props.errors.description && <p className="mt-1 text-[11px] text-rose-600">{props.errors.description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Field</p>
          <SegmentedToggle value={props.field} onChange={(v) => props.setField(v as JobField)} options={[{ id: "it", label: "IT" }, { id: "non_it", label: "Non-IT" }]} />
          {props.errors.field && <p className="mt-1 text-[11px] text-rose-600">{props.errors.field}</p>}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Job type</p>
          <SegmentedToggle value={props.type} onChange={(v) => props.setType(v as JobType)} options={[
            { id: "internship", label: "Intern" },
            { id: "full_time", label: "Full-time" },
            { id: "part_time", label: "Part-time" },
            { id: "contract", label: "Contract" },
          ]} />
          {props.errors.type && <p className="mt-1 text-[11px] text-rose-600">{props.errors.type}</p>}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Experience</p>
          <SegmentedToggle value={props.experience} onChange={(v) => props.setExperience(v as JobExperience)} options={[
            { id: "fresher", label: "Fresher" },
            { id: "experienced", label: "Experienced" },
            { id: "any", label: "Any" },
          ]} />
          {props.errors.experience && <p className="mt-1 text-[11px] text-rose-600">{props.errors.experience}</p>}
        </div>
      </div>
    </div>
  );
}

function SkillsStep(props: {
  skills: string[]; setSkills: (s: string[]) => void;
  yearsMin: string; setYearsMin: (s: string) => void;
  salary: string; setSalary: (s: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          <Code2 size={12} /> Required skills
        </label>
        <ChipInput value={props.skills} onChange={props.setSkills} placeholder="Type a skill and press Enter — e.g. React, TypeScript" />
        {props.errors.skills && <p className="mt-1 text-[11px] text-rose-600">{props.errors.skills}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Minimum years (optional)" type="number" value={props.yearsMin} onChange={props.setYearsMin} placeholder="e.g. 2" />
        <TextField label="Salary range (optional)" value={props.salary} onChange={props.setSalary} placeholder="e.g. ₹4–7 LPA" />
      </div>
    </div>
  );
}

function LocationStep(props: { place: PlaceRef; setPlace: (p: PlaceRef) => void; errors: Record<string, string> }) {
  return (
    <div>
      <LocationPicker value={props.place} onChange={props.setPlace} />
      {props.errors.location && <p className="mt-2 text-[11px] text-rose-600">{props.errors.location}</p>}
    </div>
  );
}

function BenefitsStep(props: { benefits: JobBenefit[]; setBenefits: (b: JobBenefit[]) => void }) {
  const toggle = (id: JobBenefit) => {
    props.setBenefits(
      props.benefits.includes(id) ? props.benefits.filter((b) => b !== id) : [...props.benefits, id],
    );
  };
  return (
    <div>
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">Pick everything that applies — candidates can filter listings by these.</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {JOB_BENEFITS.map((b) => {
          const active = props.benefits.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={[
                "group flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition",
                active
                  ? "border-brand-500/60 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              ].join(" ")}
            >
              <CheckCircle2 size={16} className={active ? "text-brand-600" : "text-zinc-300 dark:text-zinc-600"} />
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">{props.benefits.length} selected</p>
    </div>
  );
}

function BrandStep(props: {
  companyName: string; setCompanyName: (v: string) => void;
  contactEmail: string; setContactEmail: (v: string) => void;
  logoUrl: string | null; setLogoUrl: (v: string | null) => void;
  errors: Record<string, string>;
}) {
  const [logoError, setLogoError] = useState<string | null>(null);

  const onPickFile = async (file: File) => {
    setLogoError(null);
    // Cap at ~250KB so a base64 column stays manageable until object storage is wired.
    if (file.size > 250_000) {
      setLogoError("Logo must be under 250KB. Pick a smaller image.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
    props.setLogoUrl(dataUrl);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Company logo</p>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            {props.logoUrl ? (
              <img src={props.logoUrl} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <Camera size={22} className="text-zinc-400" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
              <Camera size={12} />
              {props.logoUrl ? "Replace logo" : "Upload logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickFile(f); }} />
            </label>
            {props.logoUrl && (
              <button type="button" onClick={() => props.setLogoUrl(null)} className="self-start text-[11px] font-semibold text-rose-600 hover:underline">
                Remove
              </button>
            )}
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">PNG / JPG / WebP, up to 250KB.</p>
          </div>
        </div>
        {logoError && <p className="mt-2 text-[11px] text-rose-600">{logoError}</p>}
      </div>
      <TextField label="Company name" value={props.companyName} onChange={props.setCompanyName} placeholder="e.g. Acme Tamil Pvt. Ltd." error={props.errors.companyName} />
      <TextField label="Hiring contact email" value={props.contactEmail} onChange={props.setContactEmail} placeholder="hiring@yourcompany.com" type="email" error={props.errors.contactEmail} />
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
        <MapPin size={11} className="-mt-0.5 inline" /> The logo + company name are saved on your profile and reused for every future job post.
      </p>
    </div>
  );
}
