import type { TemplateProps } from "./types";
import { EDU_LABELS, formatPeriod, fullName, highlightedSkills, shortRole } from "./types";

export function CorporateTemplate({ user, profile }: TemplateProps) {
 const skills = highlightedSkills(profile);
 const eduList = profile.education.filter((e) => e.enabled);
 const initials = (user.name || "")
 .split(" ")
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");

 return (
 <div className="grid grid-cols-12 bg-white text-slate-900">
 {/* Dark sidebar */}
 <aside className="col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-slate-100">
 <div className="flex flex-col items-start">
 {profile.photoDataUrl ? (
 <img
 src={profile.photoDataUrl}
 alt=""
 className="h-28 w-28 rounded-2xl object-cover ring-4 ring-slate-700/60"
 />
 ) : (
 <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-700 text-2xl font-bold ring-4 ring-slate-700/60">
 {initials || "—"}
 </div>
 )}
 <h1 className="mt-4 text-xl font-bold tracking-tight">{fullName(user, profile)}</h1>
 <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">{shortRole(profile)}</p>
 </div>

 <div className="mt-6 space-y-5 text-[11px]">
 <SidebarSection title="Contact">
 <p className="break-all text-slate-300">{user.email}</p>
 {user.mobile && <p className="text-slate-300">+91 {user.mobile}</p>}
 {profile.alternateMobile && <p className="text-slate-400">+91 {profile.alternateMobile}</p>}
 {profile.preferredLocation && <p className="text-slate-300">📍 {profile.preferredLocation}</p>}
 </SidebarSection>

 {skills.length > 0 && (
 <SidebarSection title="Top Skills">
 <div className="flex flex-wrap gap-1.5">
 {skills.map((s) => (
 <span
 key={s}
 className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-200"
 >
 {s}
 </span>
 ))}
 </div>
 </SidebarSection>
 )}

 {profile.type === "fresher" && profile.field === "it" && profile.itSpecialization && (
 <SidebarSection title="Specialization">
 <p className="text-slate-300">{profile.itSpecialization}</p>
 </SidebarSection>
 )}

 {profile.yearsOfExperience !== undefined && profile.yearsOfExperience > 0 && (
 <SidebarSection title="Experience">
 <p>
 <span className="text-2xl font-bold text-emerald-400">{profile.yearsOfExperience}</span>{" "}
 <span className="text-slate-400">years</span>
 </p>
 </SidebarSection>
 )}
 </div>
 </aside>

 {/* Light main */}
 <main className="col-span-7 px-7 py-6 md:py-6 md:py-10 text-[12px] leading-relaxed">
 {(profile.shortTermAmbition || profile.longTermAmbition) && (
 <Section title="Profile" color="emerald">
 {profile.shortTermAmbition && <p className="mb-2 text-slate-700">{profile.shortTermAmbition}</p>}
 {profile.longTermAmbition && <p className="text-slate-500">{profile.longTermAmbition}</p>}
 </Section>
 )}

 {profile.experiences && profile.experiences.length > 0 && (
 <Section title="Experience" color="emerald">
 <div className="space-y-3">
 {profile.experiences.map((e, i) => (
 <div key={i} className="border-l-2 border-emerald-500 pl-3">
 <div className="flex items-baseline justify-between">
 <p className="font-semibold">{e.role || "Role"}</p>
 <p className="text-[10px] text-slate-500">{formatPeriod(e.fromDate, e.toDate)}</p>
 </div>
 <p className="text-emerald-700">{e.company || "Company"}</p>
 </div>
 ))}
 </div>
 </Section>
 )}

 {eduList.length > 0 && (
 <Section title="Education" color="emerald">
 <div className="space-y-2.5">
 {eduList.map((e) => (
 <div key={e.level} className="border-l-2 border-slate-300 pl-3">
 <div className="flex items-baseline justify-between">
 <p className="font-semibold">
 {e.level === "other" && e.courseName ? e.courseName : EDU_LABELS[e.level]}
 </p>
 <p className="text-[10px] text-slate-500">{e.passedOutYear ?? "—"}</p>
 </div>
 {e.institution && <p className="text-[11px] text-slate-600">{e.institution}</p>}
 {e.percentage != null && <p className="text-[10.5px] text-slate-500">Score: {e.percentage}%</p>}
 {e.thesis && <p className="mt-0.5 text-[11px] italic text-slate-500">"{e.thesis}"</p>}
 </div>
 ))}
 </div>
 </Section>
 )}
 </main>
 </div>
 );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
 return (
 <section className="mb-5 last:mb-0">
 <p className={["mb-2 text-[10px] font-bold uppercase tracking-[0.25em]", `text-${color}-700`].join(" ")}>{title}</p>
 {children}
 </section>
 );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <div>
 <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-emerald-400">{title}</p>
 {children}
 </div>
 );
}
