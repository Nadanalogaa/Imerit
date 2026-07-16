import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Building2,
  Camera,
  CheckCircle2,
  Code2,
  MapPin,
  GraduationCap,
  Wrench,
  Briefcase,
  Clock,
  Bike,
  FileText,
  UserCheck,
  Laptop,
  Sparkles,
  UsersRound,
  Landmark,
  HeartPulse,
  Home,
  Building,
  Utensils,
  Car,
  CalendarDays,
  BookOpen,
  TrendingUp,
  CandlestickChart,
  Dumbbell,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { TextField } from "./TextField";
import { ChipInput } from "./profile/ChipInput";
import { SegmentedToggle } from "./profile/SegmentedToggle";
import { LocationPicker } from "./LocationPicker";
import { StepIndicator } from "./profile/StepIndicator";
import { StepShell } from "./profile/StepShell";
import { JOB_BENEFITS, type JobBenefit, type JobExperience, type JobField, type JobType } from "../store/jobs";
import { type PlaceRef } from "../store/locations";

/**
 * Full state object the wizard captures + emits on submit. The parent
 * decides what to do with it (create a job, patch an existing job,
 * side-save brand fields to the employer profile).
 */
export interface JobFormValues {
  title: string;
  description: string;
  field?: JobField;
  type?: JobType;
  experience?: JobExperience;
  yearsMin?: number;
  yearsMax?: number;
  salaryRange?: string;
  skills: string[];
  place: PlaceRef;
  benefits: JobBenefit[];
  companyName: string;
  contactEmail: string;
  logoUrl: string | null;
  /** True when the user changed the logo in this session; parent uses
   *  this to decide whether to hit the profile-patch endpoint. */
  logoDirty: boolean;
}

export interface JobFormWizardProps {
  /** create → "Post job" CTA, opens on step 1.
   *  edit   → "Save changes" CTA, opens on step 1 but can jump ahead. */
  mode: "create" | "edit";
  /** Pre-fill the wizard — used in edit mode and to seed brand fields
   *  from the employer profile. Missing keys fall back to sensible
   *  defaults. */
  initialValues?: Partial<JobFormValues>;
  /** Rendered ABOVE the step indicator. Staff uses this slot for the
   *  employer picker card so the "posting on behalf of" context is
   *  always visible while the wizard runs. */
  topSection?: ReactNode;
  /** Called with the assembled JobFormValues when the user hits the
   *  final Submit. May reject with an ApiError-shaped object; the
   *  wizard surfaces the message + code inline. */
  onSubmit: (values: JobFormValues) => Promise<void>;
  /** Optional override for the primary CTA. Defaults to "Post job" in
   *  create mode, "Save changes" in edit mode. */
  submitLabel?: string;
  /** Optional page-heading override. Defaults to "List a new opening"
   *  in create mode, "Edit job" in edit mode. */
  heading?: string;
  subheading?: string;
  /** If true, skip the Brand step. Handy for the edit flow where brand
   *  is set once at company-onboarding and shouldn't be re-collected. */
  hideBrandStep?: boolean;
  /** True when the parent is in the middle of network I/O. The submit
   *  button label switches to a spinner-friendly label + disables the
   *  button so double-clicks can't fire the mutation twice. */
  externalSubmitting?: boolean;
}

/**
 * Shared post-job / edit-job wizard. Extracted from the original
 * EmployerPostJob so both employer-created and staff-created flows
 * (and now edit) share one code path.
 */

const STEPS_WITH_BRAND = [
  { id: "basics", label: "Basics" },
  { id: "skills", label: "Skills & pay" },
  { id: "location", label: "Location" },
  { id: "benefits", label: "Benefits" },
  { id: "brand", label: "Brand" },
];
const STEPS_NO_BRAND = STEPS_WITH_BRAND.slice(0, 4);

type Tone = "sky" | "emerald" | "violet" | "amber" | "rose" | "brand" | "indigo" | "teal";
const TONE: Record<Tone, string> = {
  sky:     "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  violet:  "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  amber:   "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  rose:    "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  brand:   "bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  indigo:  "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  teal:    "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300",
};

const JOB_TYPE_OPTIONS: { id: JobType; label: string; icon: LucideIcon; tone: Tone }[] = [
  { id: "internship_training", label: "Internship / Training", icon: GraduationCap, tone: "sky" },
  { id: "apprentice", label: "Apprentice", icon: Wrench, tone: "amber" },
  { id: "full_time", label: "Full-time", icon: Briefcase, tone: "violet" },
  { id: "part_time", label: "Part-time", icon: Clock, tone: "emerald" },
  { id: "gig_delivery", label: "Gig (Delivery)", icon: Bike, tone: "rose" },
  { id: "contract", label: "Contract", icon: FileText, tone: "brand" },
  { id: "consultant", label: "Consultant", icon: UserCheck, tone: "indigo" },
  { id: "freelancer", label: "Freelancer", icon: Laptop, tone: "teal" },
];

const BENEFIT_META: Record<JobBenefit, { icon: LucideIcon; tone: Tone }> = {
  PF: { icon: Landmark, tone: "violet" },
  ESI: { icon: Shield, tone: "sky" },
  HEALTH_INSURANCE: { icon: HeartPulse, tone: "rose" },
  WFH: { icon: Home, tone: "emerald" },
  HYBRID: { icon: Building, tone: "sky" },
  MEALS: { icon: Utensils, tone: "amber" },
  TRANSPORT: { icon: Car, tone: "brand" },
  PAID_LEAVE: { icon: CalendarDays, tone: "violet" },
  LEARNING_BUDGET: { icon: BookOpen, tone: "indigo" },
  PERFORMANCE_BONUS: { icon: TrendingUp, tone: "emerald" },
  STOCK_OPTIONS: { icon: CandlestickChart, tone: "teal" },
  GYM_WELLNESS: { icon: Dumbbell, tone: "rose" },
};

export function JobFormWizard({
  mode,
  initialValues,
  topSection,
  onSubmit,
  submitLabel,
  heading,
  subheading,
  hideBrandStep = false,
  externalSubmitting = false,
}: JobFormWizardProps) {
  const steps = hideBrandStep ? STEPS_NO_BRAND : STEPS_WITH_BRAND;
  const brandStepIndex = hideBrandStep ? -1 : 4;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Job fields — seeded from initialValues if present.
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [field, setField] = useState<JobField | undefined>(initialValues?.field);
  const [type, setType] = useState<JobType | undefined>(initialValues?.type);
  const [experience, setExperience] = useState<JobExperience | undefined>(initialValues?.experience);
  const [yearsMin, setYearsMin] = useState(initialValues?.yearsMin?.toString() ?? "");
  const [yearsMax, setYearsMax] = useState(initialValues?.yearsMax?.toString() ?? "");
  const [salary, setSalary] = useState(initialValues?.salaryRange ?? "");
  const [skills, setSkills] = useState<string[]>(initialValues?.skills ?? []);
  const [place, setPlace] = useState<PlaceRef>(initialValues?.place ?? {});
  const [benefits, setBenefits] = useState<JobBenefit[]>(initialValues?.benefits ?? []);
  const [companyName, setCompanyName] = useState(initialValues?.companyName ?? "");
  const [contactEmail, setContactEmail] = useState(initialValues?.contactEmail ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialValues?.logoUrl ?? null);
  const [logoDirty, setLogoDirty] = useState(false);

  // Re-seed when initialValues arrive asynchronously (e.g. edit page waits
  // for the job fetch, then hands over the values). Keeps the wizard from
  // rendering blank while the parent loads.
  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.title !== undefined) setTitle(initialValues.title);
    if (initialValues.description !== undefined) setDescription(initialValues.description);
    if (initialValues.field !== undefined) setField(initialValues.field);
    if (initialValues.type !== undefined) setType(initialValues.type);
    if (initialValues.experience !== undefined) setExperience(initialValues.experience);
    if (initialValues.yearsMin !== undefined) setYearsMin(String(initialValues.yearsMin));
    if (initialValues.yearsMax !== undefined) setYearsMax(String(initialValues.yearsMax));
    if (initialValues.salaryRange !== undefined) setSalary(initialValues.salaryRange);
    if (initialValues.skills !== undefined) setSkills(initialValues.skills);
    if (initialValues.place !== undefined) setPlace(initialValues.place);
    if (initialValues.benefits !== undefined) setBenefits(initialValues.benefits);
    if (initialValues.companyName !== undefined) setCompanyName(initialValues.companyName);
    if (initialValues.contactEmail !== undefined) setContactEmail(initialValues.contactEmail);
    if (initialValues.logoUrl !== undefined) setLogoUrl(initialValues.logoUrl);
  }, [initialValues]);

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
    } else if (i === brandStepIndex) {
      if (!companyName.trim()) errs.companyName = "Required";
      if (!contactEmail.trim()) errs.contactEmail = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const runSubmit = async () => {
    if (!validateStep(step)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        field,
        type,
        experience,
        yearsMin: experience === "fresher" ? undefined : (yearsMin ? Number(yearsMin) : undefined),
        yearsMax: experience === "fresher" ? undefined : (yearsMax ? Number(yearsMax) : undefined),
        salaryRange: salary.trim() || undefined,
        skills,
        place,
        benefits,
        companyName: companyName.trim(),
        contactEmail: contactEmail.trim(),
        logoUrl,
        logoDirty,
      });
    } catch (err) {
      const apiErr = err as { code?: string; message?: string };
      const parts: string[] = [];
      if (apiErr.message) parts.push(apiErr.message);
      if (apiErr.code && apiErr.code !== "ERROR") parts.push(`(${apiErr.code})`);
      setSubmitError(parts.join(" ") || `Failed to ${mode === "edit" ? "save changes" : "post the job"}`);
      // eslint-disable-next-line no-console
      console.error("[JobFormWizard] submit failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || externalSubmitting;
  const primaryLabel = submitLabel
    ?? (mode === "edit" ? (isBusy ? "Saving…" : "Save changes") : (isBusy ? "Posting…" : "Post job"));
  const defaultHeading = heading ?? (mode === "edit" ? "Edit job" : "List a new opening");
  const defaultSubheading = subheading
    ?? (mode === "edit"
      ? "Update the details below. The 45-day expiry timer is preserved — use Repost to reset it."
      : "Job posting is free. Your listing stays live for 45 days — repost with one click from My jobs if you're still hiring after that.");

  const isLast = step === steps.length - 1;

  return (
    <div className="mx-auto max-w-6xl">
      {topSection}

      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
          {mode === "edit" ? "Edit job" : "Post a job"}
        </span>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">{defaultHeading}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{defaultSubheading}</p>
      </div>

      <StepIndicator steps={steps} current={step} />

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
          <StepShell
            key="skills"
            title="Skills & pay"
            subtitle="What you need on day one, and what you're offering."
            onBack={back}
            onNext={hideBrandStep && steps.length === 4 ? next : next}
          >
            <SkillsStep
              field={field}
              experience={experience}
              skills={skills} setSkills={setSkills}
              yearsMin={yearsMin} setYearsMin={setYearsMin}
              yearsMax={yearsMax} setYearsMax={setYearsMax}
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
          <StepShell
            key="benefits"
            title="Employee benefits"
            subtitle="Pick everything that applies. Candidates filter by these."
            onBack={back}
            onNext={isLast ? runSubmit : next}
            nextLabel={isLast ? primaryLabel : undefined}
            isLast={isLast}
          >
            <BenefitsStep benefits={benefits} setBenefits={setBenefits} />
            {isLast && submitError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                {submitError}
              </p>
            )}
          </StepShell>
        )}
        {step === 4 && !hideBrandStep && (
          <StepShell
            key="brand"
            title="Company brand"
            subtitle="Your logo and a hiring contact go on the listing."
            onBack={back}
            onNext={runSubmit}
            nextLabel={primaryLabel}
            isLast
          >
            <BrandStep
              companyName={companyName} setCompanyName={setCompanyName}
              contactEmail={contactEmail} setContactEmail={setContactEmail}
              logoUrl={logoUrl}
              setLogoUrl={(v) => { setLogoUrl(v); setLogoDirty(true); }}
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
          className="w-full resize-none rounded-lg bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
        />
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{props.description.length} / 1500 characters</p>
        {props.errors.description && <p className="mt-1 text-[11px] text-rose-600">{props.errors.description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Field</p>
          <SegmentedToggle
            value={props.field}
            onChange={(v) => props.setField(v as JobField)}
            options={[
              { id: "it", label: "IT", icon: <Laptop size={14} className="text-sky-500" /> },
              { id: "non_it", label: "Non-IT", icon: <Building2 size={14} className="text-amber-500" /> },
            ]}
          />
          {props.errors.field && <p className="mt-1 text-[11px] text-rose-600">{props.errors.field}</p>}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Experience</p>
          <SegmentedToggle
            value={props.experience}
            onChange={(v) => props.setExperience(v as JobExperience)}
            options={[
              { id: "fresher", label: "Fresher", icon: <Sparkles size={14} className="text-emerald-500" /> },
              { id: "experienced", label: "Experienced", icon: <UserCheck size={14} className="text-violet-500" /> },
              { id: "any", label: "Any", icon: <UsersRound size={14} className="text-rose-500" /> },
            ]}
          />
          {props.errors.experience && <p className="mt-1 text-[11px] text-rose-600">{props.errors.experience}</p>}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Job type</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {JOB_TYPE_OPTIONS.map(({ id, label, icon: Icon, tone }) => {
            const active = props.type === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => props.setType(id)}
                className={[
                  "group flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center text-[12px] font-semibold transition",
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/60 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:border-brand-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-brand-500/40",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
                    active
                      ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/40"
                      : TONE[tone],
                  ].join(" ")}
                >
                  <Icon size={16} />
                </span>
                {label}
              </button>
            );
          })}
        </div>
        {props.errors.type && <p className="mt-1 text-[11px] text-rose-600">{props.errors.type}</p>}
      </div>
    </div>
  );
}

function SkillsStep(props: {
  field?: JobField;
  experience?: JobExperience;
  skills: string[]; setSkills: (s: string[]) => void;
  yearsMin: string; setYearsMin: (s: string) => void;
  yearsMax: string; setYearsMax: (s: string) => void;
  salary: string; setSalary: (s: string) => void;
  errors: Record<string, string>;
}) {
  const suggestions = useMemo(() => {
    if (props.field === "it") return [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_COMMON];
    if (props.field === "non_it") return [...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON];
    return [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON];
  }, [props.field]);

  const hint = props.field === "it"
    ? "Suggestions tuned for IT roles. Type freely to add anything else."
    : props.field === "non_it"
      ? "Suggestions tuned for Non-IT roles. Type freely to add anything else."
      : "Pick a Field on step 1 for tuned suggestions. Add up to 15 essential skills.";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          <Code2 size={12} /> Required skills
        </label>
        <ChipInput
          value={props.skills}
          onChange={props.setSkills}
          placeholder="Type a skill — pick from suggestions or add your own"
          suggestions={suggestions}
          hint={hint}
        />
        {props.errors.skills && <p className="mt-1 text-[11px] text-rose-600">{props.errors.skills}</p>}
      </div>
      {props.experience !== "fresher" && (
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
            Years of experience <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-1 dark:border-zinc-700 dark:bg-zinc-950">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                value={props.yearsMin}
                onChange={(e) => props.setYearsMin(e.target.value.replace(/\D/g, ""))}
                placeholder="Min"
                className="h-9 w-16 border-0 bg-transparent px-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">to</span>
            <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-1 dark:border-zinc-700 dark:bg-zinc-950">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                value={props.yearsMax}
                onChange={(e) => props.setYearsMax(e.target.value.replace(/\D/g, ""))}
                placeholder="Max"
                className="h-9 w-16 border-0 bg-transparent px-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">years</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Leave both blank if you're open to any experience level.
          </p>
        </div>
      )}
      <div>
        <SalaryRangePicker value={props.salary} onChange={props.setSalary} />
      </div>
    </div>
  );
}

const SKILL_SUGGESTIONS_IT = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Dart",
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "SASS", "Redux", "Zustand", "TanStack Query",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", ".NET", "Laravel", "Ruby on Rails",
  "React Native", "Flutter", "iOS", "Android", "Xamarin",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "MariaDB", "Cassandra", "DynamoDB", "Elasticsearch",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "CI/CD", "Linux",
  "Data Science", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Pandas", "NumPy", "Power BI", "Tableau",
  "Figma", "Adobe XD", "Sketch", "Illustrator", "Photoshop", "UI Design", "UX Design",
  "Selenium", "Cypress", "Jest", "Postman", "Git", "REST API", "GraphQL", "Microservices",
];

const SKILL_SUGGESTIONS_NON_IT = [
  "Sales", "Field Sales", "Marketing", "Digital Marketing", "SEO", "Social Media", "Content Writing",
  "Customer Service", "Voice Process", "Non-Voice Process", "Insurance", "Telesales",
  "HR", "Recruitment", "Payroll", "Employee Engagement", "Administration",
  "Accounting", "Finance", "Excel", "Tally", "GST", "Financial Modeling", "Auditing", "Taxation",
  "Supply Chain", "Logistics", "Purchase", "Warehouse Management", "Inventory Management",
  "Operations", "Procurement",
  "Civil Engineering", "AutoCAD", "Site Management", "Electrical Wiring", "Plumbing", "Welding", "Carpentry",
  "Driving", "Delivery", "Two-wheeler License", "Heavy Vehicle License",
  "Nursing", "Pharmacy", "Teaching", "Retail", "Cashier",
];

const SKILL_SUGGESTIONS_COMMON = [
  "Communication", "English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam",
  "MS Word", "MS PowerPoint", "Team Management", "Problem Solving",
];

function SalaryRangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseLpaRange(value);
  const [min, setMin] = useState<string>(parsed?.min?.toString() ?? "");
  const [max, setMax] = useState<string>(parsed?.max?.toString() ?? "");
  const [unit, setUnit] = useState<"LPA" | "monthly">(parsed?.unit ?? "LPA");

  useEffect(() => {
    if (!min && !max) { onChange(""); return; }
    if (unit === "monthly") {
      const fmt = (n: string) => (n ? `₹${n}K` : "");
      if (min && max) onChange(`${fmt(min)} – ${fmt(max)} / month`);
      else if (min) onChange(`${fmt(min)}+ / month`);
      else onChange(`Up to ${fmt(max)} / month`);
    } else {
      if (min && max) onChange(`₹${min}–${max} LPA`);
      else if (min) onChange(`₹${min}+ LPA`);
      else onChange(`Up to ₹${max} LPA`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, unit]);

  const applyPreset = (a: string, b: string) => { setMin(a); setMax(b); };

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
        Salary range <span className="font-normal text-zinc-500">(optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-1 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="pl-2 text-[13px] text-zinc-400">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
            placeholder="Min"
            className="h-9 w-20 border-0 bg-transparent px-1 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-0"
          />
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">to</span>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-1 py-1 dark:border-zinc-700 dark:bg-zinc-950">
          <span className="pl-2 text-[13px] text-zinc-400">₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
            placeholder="Max"
            className="h-9 w-20 border-0 bg-transparent px-1 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-0"
          />
        </div>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "LPA" | "monthly")}
          className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="LPA">LPA</option>
          <option value="monthly">/ month (K)</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(unit === "LPA" ? LPA_PRESETS : MONTHLY_PRESETS).map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.min, p.max)}
            className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-brand-500/10"
          >
            {p.label}
          </button>
        ))}
      </div>
      {value && (
        <p className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400">
          Preview: <strong>{value}</strong>
        </p>
      )}
    </div>
  );
}

const LPA_PRESETS = [
  { label: "₹3–5", min: "3", max: "5" },
  { label: "₹5–8", min: "5", max: "8" },
  { label: "₹8–12", min: "8", max: "12" },
  { label: "₹12–18", min: "12", max: "18" },
  { label: "₹18–30", min: "18", max: "30" },
  { label: "₹30+", min: "30", max: "" },
];
const MONTHLY_PRESETS = [
  { label: "₹15–25K", min: "15", max: "25" },
  { label: "₹25–35K", min: "25", max: "35" },
  { label: "₹35–50K", min: "35", max: "50" },
  { label: "₹50–75K", min: "50", max: "75" },
  { label: "₹75K–1L", min: "75", max: "100" },
];

function parseLpaRange(s: string): { min?: number; max?: number; unit: "LPA" | "monthly" } | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  const monthly = lower.includes("month") || lower.includes("/m");
  const nums = s.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return null;
  return {
    min: nums[0],
    max: nums[1],
    unit: monthly ? "monthly" : "LPA",
  };
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
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
        Pick everything that applies — candidates can filter listings by these.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {JOB_BENEFITS.map((b) => {
          const active = props.benefits.includes(b.id);
          const { icon: Icon, tone } = BENEFIT_META[b.id];
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className={[
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                active
                  ? "border-brand-500/60 bg-brand-50 text-brand-700 shadow-sm dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                  active
                    ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/40"
                    : TONE[tone],
                ].join(" ")}
              >
                <Icon size={16} />
              </span>
              <span className="flex-1">{b.label}</span>
              {active && <CheckCircle2 size={14} className="shrink-0 text-brand-500" />}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        {props.benefits.length} selected
      </p>
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
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
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
        <MapPin size={11} className="-mt-0.5 inline" /> The logo + company name are saved on the employer profile and reused for every future job post.
      </p>
    </div>
  );
}
