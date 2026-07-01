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

/**
 * Palette of soft-tinted icon badges. Each `tone` maps to a bg + text pair
 * so an inactive option still reads as *coloured* (not grayscale). When an
 * option is selected we override with a gradient brand-fill instead — the
 * selection state has to feel distinctly "picked".
 * Full class strings are enumerated below (Tailwind can't resolve dynamic
 * concatenation like `bg-${tone}-100`).
 */
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

/** Job-type catalogue — icon + label + per-option tone. */
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

/** Icon + tone per benefit — same palette pool so the wizard reads unified. */
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
 const [yearsMax, setYearsMax] = useState("");
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
 // Freshers by definition have 0 years — don't ship a stale value
 // if the employer picked "Fresher" after typing something earlier.
 yearsMin: experience === "fresher" ? undefined : (yearsMin ? Number(yearsMin) : undefined),
 yearsMax: experience === "fresher" ? undefined : (yearsMax ? Number(yearsMax) : undefined),
 salaryRange: salary.trim() || undefined,
 skills,
 benefits,
 contactEmail: contactEmail.trim() || undefined,
 });
 navigate(`/employer/jobs/${job.id}/applicants`);
 } catch (err) {
 // Surface the actual backend code + message so the user sees
 // something actionable instead of a generic "Failed to post" wall.
 const apiErr = err as { code?: string; message?: string; details?: unknown };
 const parts: string[] = [];
 if (apiErr.message) parts.push(apiErr.message);
 if (apiErr.code && apiErr.code !== "ERROR") parts.push(`(${apiErr.code})`);
 setSubmitError(parts.join(" ") || "Failed to post the job");
 // eslint-disable-next-line no-console
 console.error("[post-job] submit failed", err);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-6xl px-5 py-6">
 <Link to="/employer/dashboard" className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
 <ArrowLeft size={14} /> Dashboard
 </Link>

 <div className="mb-6">
 <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Post a job</span>
 <h1 className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">List a new opening</h1>
 <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
 Job posting is free. Your listing stays live for <strong className="text-zinc-900 dark:text-zinc-100">45 days</strong> — repost with one click from <em>My jobs</em> if you're still hiring after that.
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
 className="w-full resize-none rounded-lg bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
 />
 <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{props.description.length} / 1500 characters</p>
 {props.errors.description && <p className="mt-1 text-[11px] text-rose-600">{props.errors.description}</p>}
 </div>
 {/* Field + Experience share a row — both are tiny binary/ternary
 choices and previously took 2 rows unnecessarily. */}
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

 {/* Job type — 8 options, each with its own icon. 4×2 on desktop,
 stacks 2×4 on mobile so tap targets stay big. */}
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
 // Filter the suggestion pool by the field the employer picked on Basics.
 // Common skills (Tamil / English / Excel / Communication) show for both.
 const suggestions =
 props.field === "it"
 ? [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_COMMON]
 : props.field === "non_it"
 ? [...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON]
 : [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON];

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
 {/* Years-of-experience fields — hidden entirely for freshers (they
 have 0 by definition), min+max shown for experienced/any so the
 employer can express a range. Both remain optional. */}
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

/**
 * Curated skill suggestions — split by the field the employer picks on the
 * Basics step. IT and Non-IT get their own pools; a small set of common
 * skills (Tamil/English/Excel/Communication) appears in both.
 * Users can still type freeform to add anything off-catalog.
 */
const SKILL_SUGGESTIONS_IT = [
 // Programming languages
 "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Dart",
 // Web frontend
 "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "SASS", "Redux", "Zustand", "TanStack Query",
 // Backend / frameworks
 "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", ".NET", "Laravel", "Ruby on Rails",
 // Mobile
 "React Native", "Flutter", "iOS", "Android", "Xamarin",
 // Databases
 "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "MariaDB", "Cassandra", "DynamoDB", "Elasticsearch",
 // Cloud + DevOps
 "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "CI/CD", "Linux",
 // Data & AI
 "Data Science", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Pandas", "NumPy", "Power BI", "Tableau",
 // Design
 "Figma", "Adobe XD", "Sketch", "Illustrator", "Photoshop", "UI Design", "UX Design",
 // Testing / QA / other IT
 "Selenium", "Cypress", "Jest", "Postman", "Git", "REST API", "GraphQL", "Microservices",
];

const SKILL_SUGGESTIONS_NON_IT = [
 // Sales / marketing / customer-facing
 "Sales", "Field Sales", "Marketing", "Digital Marketing", "SEO", "Social Media", "Content Writing",
 "Customer Service", "Voice Process", "Non-Voice Process", "Insurance", "Telesales",
 // HR / admin
 "HR", "Recruitment", "Payroll", "Employee Engagement", "Administration",
 // Finance / accounting
 "Accounting", "Finance", "Excel", "Tally", "GST", "Financial Modeling", "Auditing", "Taxation",
 // Supply chain / operations
 "Supply Chain", "Logistics", "Purchase", "Warehouse Management", "Inventory Management",
 "Operations", "Procurement",
 // Skilled trades
 "Civil Engineering", "AutoCAD", "Site Management", "Electrical Wiring", "Plumbing", "Welding", "Carpentry",
 "Driving", "Delivery", "Two-wheeler License", "Heavy Vehicle License",
 // Healthcare / teaching / retail
 "Nursing", "Pharmacy", "Teaching", "Retail", "Cashier",
];

/** Skills that read as universal — languages + soft skills. Shown for both. */
const SKILL_SUGGESTIONS_COMMON = [
 "Communication", "English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam",
 "MS Word", "MS PowerPoint", "Team Management", "Problem Solving",
];

/**
 * Two-input range picker with quick preset chips underneath. Emits the same
 * legacy string ("₹3-5 LPA" / "₹35K / month") that the Job.salaryRange
 * column expects, so no backend changes required — this is purely a UX
 * upgrade over the free-text field.
 */
function SalaryRangePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
 // Try to parse the existing free-text salary into min/max so re-editing
 // preserves the numbers. Falls back to empty if it doesn't match.
 const parsed = parseLpaRange(value);
 const [min, setMin] = useState<string>(parsed?.min?.toString() ?? "");
 const [max, setMax] = useState<string>(parsed?.max?.toString() ?? "");
 const [unit, setUnit] = useState<"LPA" | "monthly">(parsed?.unit ?? "LPA");

 // Emit a canonical string whenever the fields change.
 useEffect(() => {
 if (!min && !max) { onChange(""); return; }
 if (unit === "monthly") {
 // Monthly displays in K to stay compact
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
 {/* Quick presets — one click, no math */}
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

/** Best-effort parser for the legacy free-text salary string. */
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
 <MapPin size={11} className="-mt-0.5 inline" /> The logo + company name are saved on your profile and reused for every future job post.
 </p>
 </div>
 );
}
