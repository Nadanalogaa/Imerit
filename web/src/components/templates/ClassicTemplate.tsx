import type { TemplateProps } from "./types";
import { EDU_LABELS, formatPeriod, fullName, highlightedSkills, shortRole } from "./types";

export function ClassicTemplate({ user, profile }: TemplateProps) {
  const skills = highlightedSkills(profile);
  const eduList = profile.education.filter((e) => e.enabled);

  return (
    <div className="font-serif" style={{ background: "#FBF7EE", color: "#0B1B3A" }}>
      <div className="flex items-start gap-6 border-b-2 border-[#1E3A8A] p-8">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-wide" style={{ letterSpacing: "0.04em" }}>
            {fullName(user, profile).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm italic text-[#1E3A8A]">{shortRole(profile)}</p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#27314D]">
            <Line label="✉" value={user.email} />
            {user.mobile && <Line label="☎" value={`+91 ${user.mobile}`} />}
            {profile.alternateMobile && <Line label="☎" value={`+91 ${profile.alternateMobile}`} />}
            {profile.preferredLocation && <Line label="◉" value={profile.preferredLocation} />}
          </div>
        </div>
        {profile.photoDataUrl && (
          <img
            src={profile.photoDataUrl}
            alt=""
            className="h-24 w-24 border border-[#1E3A8A] object-cover"
            style={{ borderWidth: 2 }}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-6 p-8 pt-6 text-[12px] leading-snug">
        <main className="col-span-2 flex flex-col gap-5">
          {(profile.shortTermAmbition || profile.longTermAmbition) && (
            <Section title="Profile">
              {profile.shortTermAmbition && <p className="mb-1">{profile.shortTermAmbition}</p>}
              {profile.longTermAmbition && <p className="text-[#27314D]">{profile.longTermAmbition}</p>}
            </Section>
          )}

          {profile.experiences && profile.experiences.length > 0 && (
            <Section title="Professional Experience">
              {profile.experiences.map((e, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{e.role || "Role"}</p>
                    <p className="text-[10px] tracking-wide text-[#27314D]">
                      {formatPeriod(e.fromDate, e.toDate)}
                    </p>
                  </div>
                  <p className="text-[#1E3A8A]">{e.company || "Company"}</p>
                </div>
              ))}
            </Section>
          )}

          {eduList.length > 0 && (
            <Section title="Education">
              {eduList.map((e) => (
                <div key={e.level} className="mb-2.5 last:mb-0">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">
                      {e.level === "other" && e.courseName ? e.courseName : EDU_LABELS[e.level]}
                    </p>
                    <p className="text-[10px] text-[#27314D]">{e.passedOutYear ?? "—"}</p>
                  </div>
                  {e.institution && <p className="text-[11px] text-[#27314D]">{e.institution}</p>}
                  {e.percentage != null && <p className="text-[10.5px] italic text-[#27314D]">Score: {e.percentage}%</p>}
                  {e.thesis && <p className="text-[11px] italic">"{e.thesis}"</p>}
                </div>
              ))}
            </Section>
          )}
        </main>

        <aside className="col-span-1 flex flex-col gap-5">
          {skills.length > 0 && (
            <Section title="Skills">
              <ul className="space-y-1">
                {skills.map((s) => (
                  <li key={s} className="border-b border-dotted border-[#27314D]/40 py-0.5">
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.type === "fresher" && profile.field === "it" && profile.itSpecialization && (
            <Section title="Specialization">
              <p>{profile.itSpecialization}</p>
            </Section>
          )}

          {profile.yearsOfExperience !== undefined && profile.yearsOfExperience > 0 && (
            <Section title="Experience">
              <p>{profile.yearsOfExperience} years</p>
            </Section>
          )}

          {profile.preferredLocation && (
            <Section title="Preferred Location">
              <p>{profile.preferredLocation}</p>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 border-b border-[#1E3A8A] pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1E3A8A]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-[#1E3A8A]">{label}</span> {value}
    </span>
  );
}
