import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Users,
  RefreshCw,
  Trash2,
  MapPin,
  Briefcase,
  IndianRupee,
  CalendarClock,
  Clock,
  Sparkles,
  Wrench,
  GraduationCap,
  Bike,
  FileText,
  UserCheck,
  Laptop,
  Building2,
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
  Mail,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { JobFormWizard, type JobFormValues } from "../components/JobFormWizard";
import { useAuth } from "../store/auth";
import {
  useJobs,
  daysUntilExpiry,
  isExpired,
  type Job,
  type JobBenefit,
  type JobType,
} from "../store/jobs";
import { useApplications } from "../store/applications";
import { useLocations } from "../store/locations";
import { StaffTopBar } from "./StaffDashboard";

/**
 * Owner-facing view of a single job. Reachable from both employer and
 * staff my-jobs lists. Shows the full record with all fields, benefits,
 * and skills laid out clearly, plus action buttons for the four things
 * an owner actually does: **Edit** · **Applicants** · **Repost** · **Delete**.
 *
 * Edit swaps the view for the shared [JobFormWizard] pre-populated with
 * the current values; on save the wizard's onSubmit path patches via
 * useJobs.updateJobAsync. Expiry timer is preserved on edit — only
 * Repost bumps it.
 */
export function EmployerJobManage({ role }: { role: "employer" | "staff" }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const job = useJobs((s) => (id ? s.byId(id) : undefined));
  const updateJobAsync = useJobs((s) => s.updateJobAsync);
  const repostJobAsync = useJobs((s) => s.repostJobAsync);
  const deleteJob = useJobs((s) => s.deleteJob);
  const applications = useApplications((s) => s.applications);
  const talukById = useLocations((s) => s.talukById);

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<"repost" | "delete" | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const applicantCount = useMemo(
    () => applications.filter((a) => a.jobId === id).length,
    [applications, id],
  );

  if (!id) return <Navigate to={role === "staff" ? "/staff/jobs" : "/employer/my-jobs"} replace />;
  if (!job) {
    // Job either never existed or was deleted — bounce back to the list
    // so the URL bar doesn't linger with a dead id.
    return <Navigate to={role === "staff" ? "/staff/jobs" : "/employer/my-jobs"} replace />;
  }

  // Only the owning employer, staff-role users, or admins should reach
  // this page. RequireAuth already gates the role; here we just guard
  // against an employer opening another employer's job by URL.
  if (role === "employer" && job.employerId !== user.id) {
    return <Navigate to="/employer/my-jobs" replace />;
  }

  const initialValues: Partial<JobFormValues> = {
    title: job.title,
    description: job.description,
    field: job.field,
    type: job.type,
    experience: job.experience,
    yearsMin: job.yearsMin,
    yearsMax: job.yearsMax,
    salaryRange: job.salaryRange,
    skills: job.skills,
    place: {
      districtId: job.districtId,
      talukId: job.talukId,
      lat: job.lat,
      lng: job.lng,
      pincode: job.pincode,
      street: job.street,
    },
    benefits: job.benefits ?? [],
    companyName: job.employerName,
    contactEmail: job.contactEmail ?? "",
    logoUrl: null,
  };

  const listPath = role === "staff" ? "/staff/jobs" : "/employer/my-jobs";
  const applicantsPath = `/employer/jobs/${job.id}/applicants`;
  const Chrome: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    role === "staff" ? (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <StaffTopBar name={user.name} onLogout={() => useAuth.getState().logout()} />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    ) : (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
      </div>
    );

  if (editing) {
    return (
      <Chrome>
        <Link
          to="#"
          onClick={(e) => { e.preventDefault(); setEditing(false); }}
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Back to job
        </Link>

        <JobFormWizard
          mode="edit"
          hideBrandStep
          initialValues={initialValues}
          onSubmit={async (v) => {
            const taluk = v.place.talukId ? talukById(v.place.talukId) : undefined;
            const locationLabel = taluk ? `${taluk.taluk.name}, ${taluk.district.name}` : job.location;
            await updateJobAsync(job.id, {
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
            setEditing(false);
            setBanner("Changes saved.");
            setTimeout(() => setBanner(null), 2200);
          }}
        />
      </Chrome>
    );
  }

  const dLeft = daysUntilExpiry(job);
  const expired = isExpired(job);

  return (
    <Chrome>
      <Link
        to={listPath}
        className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <ArrowLeft size={14} /> {role === "staff" ? "My jobs" : "My jobs"}
      </Link>

      {banner && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {banner}
        </div>
      )}

      {/* Header + actions */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
            {role === "staff" ? "Staff · manage job" : "My job"}
          </span>
          <h1 className="mt-1.5 break-words text-2xl font-semibold tracking-tight md:text-3xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {job.employerName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={applicantsPath}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300"
          >
            <Users size={13} /> Applicants · {applicantCount}
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-500 bg-gradient-to-r from-brand-500 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:shadow-md"
          >
            <Pencil size={13} /> Edit job
          </button>
          <button
            type="button"
            disabled={busy === "repost"}
            onClick={async () => {
              setBusy("repost");
              try {
                await repostJobAsync(job.id);
                setBanner("Reposted — job is live for another 45 days.");
                setTimeout(() => setBanner(null), 2400);
              } finally { setBusy(null); }
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <RefreshCw size={13} /> {busy === "repost" ? "Reposting…" : "Repost"}
          </button>
          <button
            type="button"
            disabled={busy === "delete"}
            onClick={async () => {
              if (!confirm(`Delete this job? Candidates will no longer see "${job.title}". Existing applications stay recorded.`)) return;
              setBusy("delete");
              deleteJob(job.id);
              navigate(listPath);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </header>

      {/* Key facts strip */}
      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <FactCard
          icon={CalendarClock}
          tone={expired ? "rose" : (dLeft ?? 999) <= 5 ? "amber" : "emerald"}
          label={expired ? "Expired" : "Live for"}
          value={expired
            ? "Expired"
            : dLeft != null ? `${dLeft} day${dLeft === 1 ? "" : "s"}` : "—"}
          sub={`Posted ${relativeTime(job.postedAt)}`}
        />
        <FactCard
          icon={IndianRupee}
          tone="brand"
          label="Compensation"
          value={job.salaryRange || "Not disclosed"}
          sub={
            job.experience === "fresher"
              ? "Freshers only"
              : job.experience === "any"
                ? "Any experience"
                : (job.yearsMin != null && job.yearsMax != null)
                  ? `${job.yearsMin}–${job.yearsMax} yrs`
                  : (job.yearsMin != null ? `${job.yearsMin}+ yrs` : "Experienced")
          }
        />
        <FactCard
          icon={MapPin}
          tone="violet"
          label="Location"
          value={job.location || "—"}
          sub={job.pincode ? `PIN ${job.pincode}` : undefined}
        />
      </section>

      {/* Type + field + contact */}
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Field</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {job.field === "it" ? "IT" : "Non-IT"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Job type</p>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <JobTypeIcon type={job.type} className="h-4 w-4 text-zinc-500" />
              {JOB_TYPE_LABEL[job.type]}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Applications to</p>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <Mail size={14} className="text-zinc-500" />
              {job.contactEmail || <span className="font-normal text-zinc-500">In-app only</span>}
            </p>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <Building2 size={16} className="text-zinc-400" /> Role description
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          {job.description}
        </p>
      </section>

      {/* Skills */}
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <Sparkles size={16} className="text-brand-500" /> Required skills
        </h2>
        {job.skills.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">None specified.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Benefits */}
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          <HeartPulse size={16} className="text-rose-500" /> Employee benefits
        </h2>
        {(!job.benefits || job.benefits.length === 0) ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">None listed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {job.benefits.map((b) => {
              const meta = BENEFIT_META[b];
              const Icon = meta.icon;
              return (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <Icon size={12} className="text-brand-500" /> {BENEFIT_LABELS[b]}
                </span>
              );
            })}
          </div>
        )}
      </section>
    </Chrome>
  );
}

/* ---------------------------- primitives ---------------------------- */

type Tone = "brand" | "emerald" | "amber" | "rose" | "violet" | "sky";
const TONE_BG: Record<Tone, string> = {
  brand:   "from-brand-500 to-brand-600 shadow-brand-500/30",
  emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/30",
  amber:   "from-amber-500 to-amber-600 shadow-amber-500/30",
  rose:    "from-rose-500 to-rose-600 shadow-rose-500/30",
  violet:  "from-violet-500 to-violet-600 shadow-violet-500/30",
  sky:     "from-sky-500 to-sky-600 shadow-sky-500/30",
};

function FactCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-3 rounded-3xl bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)] dark:bg-zinc-900">
      <div className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", TONE_BG[tone]].join(" ")}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{sub}</p>}
      </div>
    </div>
  );
}

const JOB_TYPE_LABEL: Record<JobType, string> = {
  internship_training: "Internship / Training",
  apprentice: "Apprentice",
  full_time: "Full-time",
  part_time: "Part-time",
  gig_delivery: "Gig (Delivery)",
  contract: "Contract",
  consultant: "Consultant",
  freelancer: "Freelancer",
};

function JobTypeIcon({ type, className }: { type: JobType; className?: string }) {
  const map: Record<JobType, LucideIcon> = {
    internship_training: GraduationCap,
    apprentice: Wrench,
    full_time: Briefcase,
    part_time: Clock,
    gig_delivery: Bike,
    contract: FileText,
    consultant: UserCheck,
    freelancer: Laptop,
  };
  const Icon = map[type];
  return <Icon className={className} />;
}

const BENEFIT_META: Record<JobBenefit, { icon: LucideIcon }> = {
  PF: { icon: Landmark },
  ESI: { icon: Shield },
  HEALTH_INSURANCE: { icon: HeartPulse },
  WFH: { icon: Home },
  HYBRID: { icon: Building },
  MEALS: { icon: Utensils },
  TRANSPORT: { icon: Car },
  PAID_LEAVE: { icon: CalendarDays },
  LEARNING_BUDGET: { icon: BookOpen },
  PERFORMANCE_BONUS: { icon: TrendingUp },
  STOCK_OPTIONS: { icon: CandlestickChart },
  GYM_WELLNESS: { icon: Dumbbell },
};

const BENEFIT_LABELS: Record<JobBenefit, string> = {
  PF: "Provident Fund",
  ESI: "ESI",
  HEALTH_INSURANCE: "Health insurance",
  WFH: "Work from home",
  HYBRID: "Hybrid",
  MEALS: "Meals",
  TRANSPORT: "Transport",
  PAID_LEAVE: "Paid leave",
  LEARNING_BUDGET: "Learning budget",
  PERFORMANCE_BONUS: "Performance bonus",
  STOCK_OPTIONS: "Stock options",
  GYM_WELLNESS: "Gym / wellness",
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.round((now - then) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// Suppress unused import warning under strict tsc
export const _JOB_UNUSED: Job | null = null;
