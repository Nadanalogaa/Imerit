import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { JobFormWizard } from "../components/JobFormWizard";
import { useAuth } from "../store/auth";
import { useJobs } from "../store/jobs";
import { useLocations } from "../store/locations";
import { apiEnabled } from "../lib/api";
import { employerProfileApi } from "../lib/api/profile";

/**
 * Thin wrapper around [JobFormWizard]. Owns the employer-profile side
 * effects (fetch prior logo/company for pre-fill, patch on submit) —
 * the wizard itself is field-shape only.
 */
export function EmployerPostJob() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser)!;
  const addJobAsync = useJobs((s) => s.addJobAsync);
  const talukById = useLocations((s) => s.talukById);

  // Pre-fill brand step from the saved employer profile so re-posters don't
  // have to upload their logo again on every job.
  const [profileLogoUrl, setProfileLogoUrl] = useState<string | null>(null);
  const [profileCompany, setProfileCompany] = useState<string>("");
  useEffect(() => {
    if (!apiEnabled) return;
    let alive = true;
    employerProfileApi.getMine()
      .then(({ profile }) => {
        if (!alive) return;
        if (profile.companyName) setProfileCompany(profile.companyName);
        if (profile.logoUrl) setProfileLogoUrl(profile.logoUrl);
      })
      .catch(() => { /* wizard works without it */ });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <Link
          to="/employer/dashboard"
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <JobFormWizard
          mode="create"
          initialValues={{
            // Prefer profile values (fetched async); fall back to what
            // we know from the User row.
            companyName: profileCompany || user.company || "",
            contactEmail: user.email,
            logoUrl: profileLogoUrl,
          }}
          onSubmit={async (v) => {
            const taluk = v.place.talukId ? talukById(v.place.talukId) : undefined;
            const locationLabel = taluk ? `${taluk.taluk.name}, ${taluk.district.name}` : "";

            // Save brand fields back to the profile only when actually
            // changed — avoids clobbering nothing on every post.
            if (apiEnabled && (v.logoDirty || v.companyName !== (user.company ?? ""))) {
              await employerProfileApi.patch({
                companyName: v.companyName,
                ...(v.logoDirty ? { logoUrl: v.logoUrl } : {}),
              });
            }

            const job = await addJobAsync({
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
            // Land on the manage page so the employer sees the full job
            // they just created + Edit / Applicants / Repost actions.
            navigate(`/employer/jobs/${job.id}`);
          }}
        />
      </main>
    </div>
  );
}
