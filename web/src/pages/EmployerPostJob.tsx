import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  MapPin,
  Code2,
  IndianRupee,
  Sparkles,
  Send,
  Info,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TextField } from "../components/TextField";
import { ChipInput } from "../components/profile/ChipInput";
import { SegmentedToggle } from "../components/profile/SegmentedToggle";
import { LocationPicker } from "../components/LocationPicker";
import { useAuth } from "../store/auth";
import { useJobs, type JobField, type JobType, type JobExperience } from "../store/jobs";
import { useLocations, type PlaceRef } from "../store/locations";

export function EmployerPostJob() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const addJobAsync = useJobs((s) => s.addJobAsync);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [field, setField] = useState<JobField | undefined>();
  const [type, setType] = useState<JobType | undefined>();
  const [experience, setExperience] = useState<JobExperience | undefined>();
  const [yearsMin, setYearsMin] = useState<string>("");
  const [place, setPlace] = useState<PlaceRef>({});
  const [salary, setSalary] = useState("");
  const talukById = useLocations((s) => s.talukById);
  const [skills, setSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Required";
    if (!description.trim()) errs.description = "Required";
    if (description.trim().length < 20) errs.description = "Tell us at least 20 characters";
    if (!field) errs.field = "Pick IT or Non-IT";
    if (!type) errs.type = "Pick a type";
    if (!experience) errs.experience = "Pick experience level";
    if (!place.districtId || !place.talukId) errs.location = "Pick district and taluk";
    if (skills.length === 0) errs.skills = "Add at least one required skill";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const taluk = talukById(place.talukId!);
    const locationLabel = taluk
      ? `${taluk.taluk.name}, ${taluk.district.name}`
      : "";

    setSubmitting(true);
    setSubmitError(null);
    try {
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
      });
      navigate(`/employer/jobs/${job.id}/applicants`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not post the job. Try again.");
    } finally {
      setSubmitting(false);
    }
  };
  // Use the value to satisfy the unused-var checker.
  void user;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link to="/employer/dashboard" className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">Post a job</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">List a new opening</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Job posting is free. Candidates with matching skills will see it sorted by fit.
            </p>
          </header>

          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 px-4 py-3 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-pink-500/5">
            <Info size={18} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              Be specific. Required skills + location + experience drive the match score. The clearer you are, the better candidates we send your way.
            </p>
          </div>

          <form onSubmit={submit} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-8">
            <div className="flex flex-col gap-5">
              <Group icon={<Briefcase size={16} className="text-brand-600 dark:text-brand-400" />} label="Job title">
                <TextField label="" value={title} onChange={setTitle} placeholder="e.g. Senior React Developer" error={errors.title} />
              </Group>

              <Group icon={<Building2 size={16} className="text-violet-600 dark:text-violet-400" />} label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1500))}
                  rows={5}
                  placeholder="What the role involves, who you're looking for, day-to-day responsibilities..."
                  className={[
                    "w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-950 dark:placeholder:text-zinc-500",
                    errors.description ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-zinc-200 focus:border-brand-500 focus:ring-brand-500/20 dark:border-zinc-800",
                  ].join(" ")}
                />
                <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                  <span>{errors.description ?? "Be specific about the role and expectations."}</span>
                  <span>{description.length} / 1500</span>
                </div>
              </Group>

              <div className="grid gap-5 md:grid-cols-2">
                <Group icon={<Code2 size={16} className="text-sky-600 dark:text-sky-400" />} label="Field">
                  <SegmentedToggle<JobField>
                    value={field}
                    onChange={setField}
                    options={[{ id: "it", label: "IT", icon: <Code2 size={14} /> }, { id: "non_it", label: "Non-IT", icon: <Building2 size={14} /> }]}
                  />
                  {errors.field && <ErrorLine msg={errors.field} />}
                </Group>

                <Group icon={<Briefcase size={16} className="text-amber-600 dark:text-amber-400" />} label="Job type">
                  <SegmentedToggle<JobType>
                    value={type}
                    onChange={setType}
                    options={[{ id: "full_time", label: "Full-time" }, { id: "internship", label: "Intern" }, { id: "contract", label: "Contract" }]}
                  />
                  {errors.type && <ErrorLine msg={errors.type} />}
                </Group>
              </div>

              <Group icon={<Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />} label="Experience">
                <SegmentedToggle<JobExperience>
                  value={experience}
                  onChange={setExperience}
                  options={[{ id: "fresher", label: "Fresher" }, { id: "experienced", label: "Experienced" }, { id: "any", label: "Any" }]}
                />
                {experience === "experienced" && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <TextField label="Minimum years required" value={yearsMin} onChange={(v) => setYearsMin(v.replace(/\D/g, "").slice(0, 2))} placeholder="e.g. 3" inputMode="numeric" />
                  </div>
                )}
                {errors.experience && <ErrorLine msg={errors.experience} />}
              </Group>

              <Group icon={<MapPin size={16} className="text-rose-600 dark:text-rose-400" />} label="Job location">
                <LocationPicker value={place} onChange={setPlace} />
                {errors.location && <ErrorLine msg={errors.location} />}
              </Group>

              <Group icon={<IndianRupee size={16} className="text-emerald-600 dark:text-emerald-400" />} label="Salary range (optional)">
                <TextField label="" value={salary} onChange={setSalary} placeholder="e.g. ₹3 – 5 LPA" />
              </Group>

              <Group icon={<Sparkles size={16} className="text-violet-600 dark:text-violet-400" />} label="Required skills">
                <ChipInput
                  value={skills}
                  onChange={setSkills}
                  max={8}
                  placeholder="e.g. React, Node.js, AWS"
                  hint="Add the skills you'll match candidates against."
                />
                {errors.skills && <ErrorLine msg={errors.skills} />}
              </Group>

              {submitError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-700 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-60"
              >
                <Send size={16} />
                {submitting ? "Posting…" : "Post job — it's free"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

function Group({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</label>
      </div>
      {children}
    </div>
  );
}

function ErrorLine({ msg }: { msg: string }) {
  return <p className="mt-2 text-xs text-rose-500">{msg}</p>;
}
