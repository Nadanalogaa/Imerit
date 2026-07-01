import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { StepIndicator } from "../components/profile/StepIndicator";
import { StepShell } from "../components/profile/StepShell";
import { PhotoUpload } from "../components/profile/PhotoUpload";
import { EducationStep } from "../components/profile/EducationStep";
import { AmbitionStep } from "../components/profile/AmbitionStep";
import { AboutYouStep } from "../components/profile/AboutYouStep";
import { TemplatePicker } from "../components/profile/TemplatePicker";
import { LocationPicker } from "../components/LocationPicker";
import { DistrictMultiSelect } from "../components/profile/DistrictMultiSelect";
import { useLocations } from "../store/locations";
import { publicLabel, type PlaceRef } from "../store/locations";
import { TextField } from "../components/TextField";
import { useAuth } from "../store/auth";
import {
 useProfile,
 type Education,
 type CandidateType,
 type Field as FieldKind,
 type Experience,
 type TemplateId,
} from "../store/profile";

const STEPS = [
 { id: "personal", label: "Personal" },
 { id: "education", label: "Education" },
 { id: "ambition", label: "Ambition" },
 { id: "you", label: "About You" },
 { id: "preview", label: "Preview" },
];

export function CandidateProfileForm() {
 const navigate = useNavigate();
 const user = useAuth((s) => s.currentUser)!;
 const profile = useProfile((s) => s.get)(user.id);
 const patch = useProfile((s) => s.patch);

 const [step, setStep] = useState(0);

 // Personal step
 const [photo, setPhoto] = useState<string | undefined>(profile.photoDataUrl);
 const [name, setName] = useState(user.name);
 const [mobile, setMobile] = useState(user.mobile ?? "");
 const [altMobile, setAltMobile] = useState(profile.alternateMobile ?? "");

 // Current location
 const [currentPlace, setCurrentPlace] = useState<PlaceRef>({
 districtId: profile.currentDistrictId,
 talukId: profile.currentTalukId,
 lat: profile.currentLat,
 lng: profile.currentLng,
 pincode: profile.currentPincode,
 street: profile.currentStreet,
 });
 // Preferred work — multi-select list of district IDs the user is open
 // to working in. The matcher's "Near preferred" anchor uses the first
 // district's lat/lng (mirrored on save).
 const [preferredDistricts, setPreferredDistricts] = useState<string[]>(
 profile.preferredDistricts ?? (profile.preferredDistrictId ? [profile.preferredDistrictId] : []),
 );
 const allDistricts = useLocations((s) => s.districts);

 // Education step
 const [education, setEducation] = useState<Education[]>(profile.education);

 // Ambition step
 const [shortTerm, setShortTerm] = useState(profile.shortTermAmbition ?? "");
 const [longTerm, setLongTerm] = useState(profile.longTermAmbition ?? "");

 // About You step
 const [type, setType] = useState<CandidateType | undefined>(profile.type);
 const [internOrJob, setInternOrJob] = useState<"intern" | "job" | undefined>(profile.internOrJob);
 const [field, setField] = useState<FieldKind | undefined>(profile.field);
 const [itSpecialization, setItSpec] = useState<string | undefined>(profile.itSpecialization);
 const [itLanguages, setItLanguages] = useState<string[]>(profile.itLanguages ?? []);
 const [nonItDepartments, setNonItDepartments] = useState<string[]>(profile.nonItDepartments ?? []);
 const [yearsOfExperience, setYears] = useState<number | undefined>(profile.yearsOfExperience);
 const [topSkills, setTopSkills] = useState<string[]>(profile.topSkills ?? []);
 const [experiences, setExperiences] = useState<Experience[]>(profile.experiences ?? []);
 const [links, setLinks] = useState<import("../store/profile").ProfileLink[]>(profile.links ?? []);

 /**
 * Display label for the preferred work location, derived from the new
 * preferredDistricts multi-select. Falls back to the current location's
 * label, then to whatever was stored on the legacy free-text field.
 * Single source of truth — there's no separate "preferred location" input
 * elsewhere in the form.
 */
 /**
 * Derived legacy label — comma-joined district names from preferredDistricts
 * (when set), otherwise the current district. Old card UIs that read the
 * single preferredLocation string keep rendering something sensible.
 */
 const preferredLocation = (() => {
 if (preferredDistricts.length > 0) {
 const names = preferredDistricts
 .map((id) => allDistricts.find((d) => d.id === id)?.name)
 .filter(Boolean);
 if (names.length) return names.join(", ");
 }
 if (currentPlace.talukId) return publicLabel(currentPlace);
 return profile.preferredLocation;
 })();
 /** First selected district — drives the legacy single-anchor coords. */
 const firstPreferred = preferredDistricts.length
 ? allDistricts.find((d) => d.id === preferredDistricts[0])
 : undefined;

 // Template
 const [templateId, setTemplateId] = useState<TemplateId | undefined>(profile.selectedTemplateId);

 const [errors, setErrors] = useState<Record<string, string>>({});

 const liveProfile = {
 ...profile,
 photoDataUrl: photo,
 alternateMobile: altMobile || undefined,
 shortTermAmbition: shortTerm || profile.shortTermAmbition,
 longTermAmbition: longTerm || profile.longTermAmbition,
 education: education.length ? education : profile.education,
 type: type ?? profile.type,
 internOrJob: internOrJob ?? profile.internOrJob,
 field: field ?? profile.field,
 itSpecialization: itSpecialization ?? profile.itSpecialization,
 itLanguages: itLanguages.length ? itLanguages : profile.itLanguages,
 nonItDepartments: nonItDepartments.length ? nonItDepartments : profile.nonItDepartments,
 yearsOfExperience: yearsOfExperience ?? profile.yearsOfExperience,
 topSkills: topSkills.length ? topSkills : profile.topSkills,
 experiences: experiences.length ? experiences : profile.experiences,
 links: links.length ? links : profile.links,
 preferredLocation: preferredLocation ?? profile.preferredLocation,
 };

 const liveUser = { ...user, name, mobile };

 // Auto-save photo
 useEffect(() => {
 if (photo !== profile.photoDataUrl) patch(user.id, { photoDataUrl: photo });
 }, [photo, profile.photoDataUrl, patch, user.id]);

 const handleNext = () => {
 if (step === 0) {
 const next: Record<string, string> = {};
 if (!name.trim()) next.name = "Required";
 if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = "Enter a valid 10-digit Indian mobile number";
 if (altMobile && !/^[6-9]\d{9}$/.test(altMobile)) next.altMobile = "Enter a valid 10-digit number or leave blank";
 setErrors(next);
 if (Object.keys(next).length) return;
 patch(user.id, {
 alternateMobile: altMobile || undefined,
 currentDistrictId: currentPlace.districtId,
 currentTalukId: currentPlace.talukId,
 currentLat: currentPlace.lat,
 currentLng: currentPlace.lng,
 currentPincode: currentPlace.pincode,
 currentStreet: currentPlace.street,
 preferredDistricts,
 // Legacy mirror — first selected district's centroid powers the
 // "Near preferred" anchor in the matcher until that's rewritten.
 preferredDistrictId: firstPreferred?.id,
 preferredTalukId: undefined,
 preferredLat: firstPreferred?.lat,
 preferredLng: firstPreferred?.lng,
 preferredPincode: undefined,
 // Keep the legacy display label in sync with the structured picker so
 // existing card/list UIs that read `preferredLocation` keep working.
 preferredLocation: preferredLocation || undefined,
 });
 }

 if (step === 1) {
 const enabled = education.filter((e) => e.enabled);
 if (enabled.length === 0) {
 setErrors({ education: "Add at least one education level" });
 return;
 }
 const incomplete = enabled.find(
 (e) => e.percentage == null || e.passedOutYear == null,
 );
 if (incomplete) {
 setErrors({ education: "Each added level needs percentage and year" });
 return;
 }
 setErrors({});
 patch(user.id, { education });
 }

 if (step === 2) {
 const errs: Record<string, string> = {};
 if (!shortTerm.trim()) errs.shortTerm = "Required";
 if (!longTerm.trim()) errs.longTerm = "Required";
 setErrors(errs);
 if (Object.keys(errs).length) return;
 patch(user.id, {
 shortTermAmbition: shortTerm.trim(),
 longTermAmbition: longTerm.trim(),
 });
 }

 if (step === 3) {
 const errs: Record<string, string> = {};
 if (!type) errs.type = "Pick Fresher or Experienced";
 if (type === "fresher") {
 if (!internOrJob) errs.internOrJob = "Pick one";
 if (!field) errs.field = "Pick IT or Non-IT";
 if (field === "it") {
 if (!itSpecialization) errs.itSpecialization = "Pick a specialization";
 if (itLanguages.length === 0) errs.itLanguages = "Add at least one";
 }
 if (field === "non_it" && nonItDepartments.length === 0) {
 errs.nonItDepartments = "Add at least one department";
 }
 }
 if (type === "experienced") {
 if (!yearsOfExperience || yearsOfExperience <= 0) errs.years = "Enter years of experience";
 if (topSkills.length === 0) errs.topSkills = "Add at least one skill";
 if (experiences.length === 0) errs.experiences = "Add at least one company";
 else if (experiences.some((e) => !e.company.trim() || !e.role.trim() || !e.fromDate)) {
 errs.experiences = "Each experience needs company, role, and start date";
 }
 }
 setErrors(errs);
 if (Object.keys(errs).length) return;
 patch(user.id, {
 type,
 internOrJob: type === "fresher" ? internOrJob : undefined,
 field: type === "fresher" ? field : undefined,
 itSpecialization: type === "fresher" && field === "it" ? itSpecialization : undefined,
 itLanguages: type === "fresher" && field === "it" ? itLanguages : undefined,
 nonItDepartments: type === "fresher" && field === "non_it" ? nonItDepartments : undefined,
 yearsOfExperience: type === "experienced" ? yearsOfExperience : undefined,
 topSkills: type === "experienced" ? topSkills : undefined,
 experiences: type === "experienced" ? experiences : undefined,
 // Optional links — only persist non-empty URLs.
 links: links.filter((l) => l.url.trim()).length
 ? links.filter((l) => l.url.trim())
 : undefined,
 });
 }

 setStep((s) => Math.min(s + 1, STEPS.length - 1));
 };

 const handleBack = () => {
 setErrors({});
 setStep((s) => Math.max(s - 1, 0));
 };

 const currentStepEl = useMemo(() => {
 switch (step) {
 case 0:
 return (
 <StepShell
 key="personal"
 title="Personal details"
 subtitle="A clear photo and your contact details. We've pre-filled what you gave us at sign-up."
 onNext={handleNext}
 >
 <div className="flex flex-col gap-6">
 <PhotoUpload value={photo} onChange={setPhoto} />
 <div className="grid gap-4 md:grid-cols-2">
 <TextField label="Full name" value={name} onChange={setName} error={errors.name} />
 <TextField label="Email" value={user.email} onChange={() => {}} hint="Email is locked — used to log in." />
 <TextField
 label="Mobile number"
 value={mobile}
 onChange={(v) => setMobile(v.replace(/\D/g, "").slice(0, 10))}
 inputMode="numeric"
 maxLength={10}
 error={errors.mobile}
 />
 <TextField
 label="Alternate mobile (optional)"
 value={altMobile}
 onChange={(v) => setAltMobile(v.replace(/\D/g, "").slice(0, 10))}
 inputMode="numeric"
 maxLength={10}
 hint="We'll only use this if your primary number is unreachable."
 error={errors.altMobile}
 />
 </div>

 <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
 <h3 className="mb-3 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
 Where you live <span className="text-xs font-normal text-zinc-500">(optional)</span>
 </h3>
 <LocationPicker value={currentPlace} onChange={setCurrentPlace} />
 </div>

 <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
 <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-4">
 <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
 Preferred work districts <span className="text-xs font-normal text-zinc-500">(optional)</span>
 </h3>
 <p className="text-[11px] text-zinc-500 dark:text-zinc-400 md:text-right">
 Pick any number of districts you're open to working in.
 </p>
 </div>
 <DistrictMultiSelect value={preferredDistricts} onChange={setPreferredDistricts} />
 </div>
 </div>
 </StepShell>
 );

 case 1:
 return (
 <StepShell
 key="edu"
 title="Education"
 subtitle="Tick every level you have and fill in the details."
 onBack={handleBack}
 onNext={handleNext}
 >
 <EducationStep value={education} onChange={setEducation} />
 {errors.education && (
 <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {errors.education}
 </p>
 )}
 </StepShell>
 );

 case 2:
 return (
 <StepShell
 key="amb"
 title="Your ambition"
 subtitle="Tell us where you're heading — short and long term."
 onBack={handleBack}
 onNext={handleNext}
 >
 <AmbitionStep
 shortTerm={shortTerm}
 longTerm={longTerm}
 onShortTerm={setShortTerm}
 onLongTerm={setLongTerm}
 shortError={errors.shortTerm}
 longError={errors.longTerm}
 />
 </StepShell>
 );

 case 3:
 return (
 <StepShell key="you" title="About you" subtitle="Are you a fresher or experienced?" onBack={handleBack} onNext={handleNext}>
 <AboutYouStep
 type={type}
 onType={setType}
 internOrJob={internOrJob}
 onInternOrJob={setInternOrJob}
 field={field}
 onField={setField}
 itSpecialization={itSpecialization}
 onItSpec={setItSpec}
 itLanguages={itLanguages}
 onItLanguages={setItLanguages}
 nonItDepartments={nonItDepartments}
 onNonItDepartments={setNonItDepartments}
 yearsOfExperience={yearsOfExperience}
 onYears={setYears}
 topSkills={topSkills}
 onTopSkills={setTopSkills}
 experiences={experiences}
 onExperiences={setExperiences}
 links={links}
 onLinks={setLinks}
 errors={errors}
 />
 </StepShell>
 );

 case 4:
 return (
 <StepShell
 key="prev"
 title="Preview & template"
 subtitle="Pick a design — your profile renders live below."
 onBack={handleBack}
 onNext={() => {
 if (!templateId) {
 setErrors({ template: "Pick a template to continue" });
 return;
 }
 patch(user.id, { selectedTemplateId: templateId });
 navigate("/candidate/dashboard");
 }}
 nextLabel="Save & finish"
 isLast
 >
 <TemplatePicker
 user={liveUser}
 profile={liveProfile}
 selected={templateId}
 onSelect={(id) => {
 setTemplateId(id);
 setErrors({});
 }}
 />
 {errors.template && (
 <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
 {errors.template}
 </p>
 )}
 </StepShell>
 );

 default:
 return null;
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [
 step,
 photo,
 name,
 mobile,
 altMobile,
 education,
 shortTerm,
 longTerm,
 type,
 internOrJob,
 field,
 itSpecialization,
 itLanguages,
 nonItDepartments,
 yearsOfExperience,
 topSkills,
 experiences,
 currentPlace,
 preferredDistricts,
 firstPreferred,
 preferredLocation,
 templateId,
 errors,
 user,
 navigate,
 patch,
 liveProfile,
 liveUser,
 ]);

 return (
 <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
 <Navbar />
 <main className="mx-auto max-w-6xl px-5 py-6 md:py-6 md:py-10">
 <header className="mb-5">
 <span className="text-[11px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
 Build your profile
 </span>
 <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
 Let's build something employers will love
 </h1>
 <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
 Five short steps. We auto-save as you go — leave any time and come back.
 </p>
 </header>

 <StepIndicator steps={STEPS} current={step} />
 <AnimatePresence mode="wait">{currentStepEl}</AnimatePresence>
 </main>
 </div>
 );
}

