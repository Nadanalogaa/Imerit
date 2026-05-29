import type { TemplateProps } from "./types";
import { EDU_LABELS, formatPeriod, fullName, highlightedSkills, shortRole } from "./types";

export function TechMonoTemplate({ user, profile }: TemplateProps) {
  const skills = highlightedSkills(profile);
  const eduList = profile.education.filter((e) => e.enabled);
  const initials = (user.name || "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="font-mono"
      style={{ background: "#0A0F0D", color: "#E5E7EB", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" }}
    >
      <header className="border-b border-emerald-500/30 px-7 py-6">
        <div className="flex items-center gap-5">
          {profile.photoDataUrl ? (
            <img src={profile.photoDataUrl} alt="" className="h-20 w-20 rounded-md border border-emerald-500/40 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/5 text-xl font-bold text-emerald-300">
              {initials || "—"}
            </div>
          )}
          <div className="flex-1">
            <p className="text-[10px] tracking-widest text-emerald-400">$ whoami</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{fullName(user, profile)}</h1>
            <p className="mt-1 text-xs text-emerald-300">// {shortRole(profile)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-1 text-[11px] sm:grid-cols-2">
          <Mono label="email" value={user.email} />
          {user.mobile && <Mono label="phone" value={`+91 ${user.mobile}`} />}
          {profile.preferredLocation && <Mono label="loc" value={profile.preferredLocation} />}
          {profile.yearsOfExperience !== undefined && profile.yearsOfExperience > 0 && (
            <Mono label="exp" value={`${profile.yearsOfExperience}y`} />
          )}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 px-7 py-6 text-[12px] leading-relaxed">
        <main className="col-span-8 flex flex-col gap-6">
          {(profile.shortTermAmbition || profile.longTermAmbition) && (
            <TechSection title="profile">
              {profile.shortTermAmbition && (
                <p className="mb-1.5">
                  <span className="text-emerald-400">// short:</span> {profile.shortTermAmbition}
                </p>
              )}
              {profile.longTermAmbition && (
                <p>
                  <span className="text-emerald-400">// long:</span>{" "}
                  <span className="text-zinc-400">{profile.longTermAmbition}</span>
                </p>
              )}
            </TechSection>
          )}

          {profile.experiences && profile.experiences.length > 0 && (
            <TechSection title="experience">
              <div className="space-y-3">
                {profile.experiences.map((e, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between">
                      <p>
                        <span className="text-emerald-300">{e.role || "role"}</span>{" "}
                        <span className="text-zinc-500">@</span>{" "}
                        <span className="text-cyan-300">{e.company || "company"}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">{formatPeriod(e.fromDate, e.toDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TechSection>
          )}

          {eduList.length > 0 && (
            <TechSection title="education">
              <div className="space-y-2">
                {eduList.map((e) => (
                  <div key={e.level} className="flex items-baseline justify-between">
                    <p>
                      <span className="text-cyan-300">
                        {e.level === "other" && e.courseName ? e.courseName : EDU_LABELS[e.level]}
                      </span>{" "}
                      {e.institution && <span className="text-zinc-500">@ {e.institution}</span>}
                      {e.percentage != null && <span className="text-emerald-400"> · {e.percentage}%</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500">{e.passedOutYear ?? "—"}</p>
                  </div>
                ))}
              </div>
            </TechSection>
          )}
        </main>

        <aside className="col-span-4 flex flex-col gap-5">
          {skills.length > 0 && (
            <TechSection title="skills.json">
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-[10.5px] text-emerald-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </TechSection>
          )}

          {profile.type === "fresher" && profile.field === "it" && profile.itSpecialization && (
            <TechSection title="focus">
              <p className="text-cyan-300">{profile.itSpecialization}</p>
            </TechSection>
          )}

          {profile.alternateMobile && (
            <TechSection title="alt">
              <p className="text-zinc-400">+91 {profile.alternateMobile}</p>
            </TechSection>
          )}
        </aside>
      </div>

      <div className="border-t border-emerald-500/20 px-7 py-3 text-[10px] text-emerald-400/70">
        <span className="text-emerald-400">$</span> end_of_profile
      </div>
    </div>
  );
}

function TechSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-[11px] text-emerald-400">
        <span className="text-emerald-500">{">"}</span> {title}
      </p>
      <div className="border-l border-emerald-500/20 pl-3">{children}</div>
    </section>
  );
}

function Mono({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-emerald-400">{label}:</span> <span className="text-zinc-300">{value}</span>
    </p>
  );
}
