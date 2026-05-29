import type { TemplateProps } from "./types";
import { EDU_LABELS, formatPeriod, fullName, highlightedSkills, shortRole } from "./types";

export function ModernTemplate({ user, profile }: TemplateProps) {
  const skills = highlightedSkills(profile);
  const eduList = profile.education.filter((e) => e.enabled);
  const initials = (user.name || "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="grid grid-cols-12 bg-white text-zinc-900">
      {/* Left rail */}
      <aside className="col-span-4 bg-zinc-50 px-6 py-8">
        <div className="flex flex-col items-center text-center">
          {profile.photoDataUrl ? (
            <img src={profile.photoDataUrl} alt="" className="h-28 w-28 rounded-full object-cover ring-2 ring-zinc-200" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-3xl font-bold text-white">
              {initials || "—"}
            </div>
          )}
          <h1 className="mt-4 text-xl font-semibold tracking-tight">{fullName(user, profile)}</h1>
          <p className="mt-1 text-xs text-zinc-500">{shortRole(profile)}</p>
        </div>

        <div className="mt-6 space-y-4 text-[11px] text-zinc-600">
          <Block title="Contact">
            <p className="break-all">{user.email}</p>
            {user.mobile && <p>+91 {user.mobile}</p>}
            {profile.alternateMobile && <p className="text-zinc-400">+91 {profile.alternateMobile}</p>}
            {profile.preferredLocation && <p className="mt-1.5 inline-flex items-center gap-1 text-zinc-500">📍 {profile.preferredLocation}</p>}
          </Block>

          {skills.length > 0 && (
            <Block title="Skills">
              <ul className="space-y-1.5">
                {skills.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {profile.type === "fresher" && profile.field === "it" && profile.itSpecialization && (
            <Block title="Specialization">
              <p className="text-[11px]">{profile.itSpecialization}</p>
            </Block>
          )}

          {profile.yearsOfExperience !== undefined && profile.yearsOfExperience > 0 && (
            <Block title="Experience">
              <p className="text-2xl font-bold text-sky-600">{profile.yearsOfExperience}<span className="text-xs font-normal text-zinc-500"> yrs</span></p>
            </Block>
          )}
        </div>
      </aside>

      {/* Right content */}
      <main className="col-span-8 px-8 py-8 text-[12px] leading-relaxed">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">Profile</p>
          <h2 className="mt-2 text-base font-semibold tracking-tight">{shortRole(profile)}</h2>
        </header>

        {(profile.shortTermAmbition || profile.longTermAmbition) && (
          <div className="mt-3 space-y-1.5 text-zinc-700">
            {profile.shortTermAmbition && <p>{profile.shortTermAmbition}</p>}
            {profile.longTermAmbition && <p className="text-zinc-500">{profile.longTermAmbition}</p>}
          </div>
        )}

        {profile.experiences && profile.experiences.length > 0 && (
          <Section title="Experience">
            {profile.experiences.map((e, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">{e.role || "Role"}</p>
                  <p className="text-[10px] text-zinc-400">{formatPeriod(e.fromDate, e.toDate)}</p>
                </div>
                <p className="text-sky-600">{e.company || "Company"}</p>
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
                  <p className="text-[10px] text-zinc-400">{e.passedOutYear ?? "—"}</p>
                </div>
                {e.institution && <p className="text-[11px] text-zinc-600">{e.institution}</p>}
                {e.percentage != null && <p className="text-[10.5px] text-zinc-500">{e.percentage}%</p>}
                {e.thesis && <p className="mt-0.5 text-[11px] italic text-zinc-500">"{e.thesis}"</p>}
              </div>
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-600">{title}</p>
      <div className="border-t border-zinc-200 pt-3">{children}</div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">{title}</p>
      {children}
    </div>
  );
}
