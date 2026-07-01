import type { TemplateProps } from "./types";
import { EDU_LABELS, formatPeriod, fullName, highlightedSkills, shortRole } from "./types";

export function CreativeTemplate({ user, profile }: TemplateProps) {
 const skills = highlightedSkills(profile);
 const eduList = profile.education.filter((e) => e.enabled);
 const initials = (user.name || "")
 .split(" ")
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? "")
 .join("");

 return (
 <div className="bg-[#FFF8F1] text-zinc-900">
 {/* Hero */}
 <header className="relative overflow-hidden px-8 pb-8 pt-10">
 <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600" />
 <div className="absolute -bottom-16 -right-12 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />
 <div className="absolute -top-12 -left-8 h-40 w-40 rounded-full bg-fuchsia-300/30 blur-3xl" />

 <div className="relative flex items-center gap-5 text-white">
 {profile.photoDataUrl ? (
 <img
 src={profile.photoDataUrl}
 alt=""
 className="h-24 w-24 rounded-3xl border-4 border-white/30 object-cover shadow-xl"
 />
 ) : (
 <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white/30 bg-white/10 text-3xl font-bold backdrop-blur">
 {initials || "—"}
 </div>
 )}

 <div className="flex-1">
 <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">Hello, I'm</p>
 <h1 className="mt-1 text-3xl font-bold tracking-tight">{fullName(user, profile)}</h1>
 <p className="mt-1 text-sm text-white/90">{shortRole(profile)}</p>
 <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
 <Pill>✉ {user.email}</Pill>
 {user.mobile && <Pill>☎ +91 {user.mobile}</Pill>}
 {profile.preferredLocation && <Pill>◉ {profile.preferredLocation}</Pill>}
 </div>
 </div>
 </div>
 </header>

 <div className="grid grid-cols-12 gap-6 px-8 py-7 text-[12px] leading-relaxed">
 {/* Left main */}
 <main className="col-span-8 flex flex-col gap-5">
 {(profile.shortTermAmbition || profile.longTermAmbition) && (
 <CreativeSection title="My Story" color="from-orange-500 to-rose-500">
 <div className="space-y-2 text-zinc-700">
 {profile.shortTermAmbition && (
 <p>
 <span className="font-semibold text-orange-700">Soon:</span> {profile.shortTermAmbition}
 </p>
 )}
 {profile.longTermAmbition && (
 <p>
 <span className="font-semibold text-fuchsia-700">Eventually:</span> {profile.longTermAmbition}
 </p>
 )}
 </div>
 </CreativeSection>
 )}

 {profile.experiences && profile.experiences.length > 0 && (
 <CreativeSection title="Experience" color="from-fuchsia-500 to-violet-600">
 <div className="flex flex-col gap-3">
 {profile.experiences.map((e, i) => (
 <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
 <div className="flex items-baseline justify-between">
 <p className="font-semibold">{e.role || "Role"}</p>
 <p className="text-[10px] font-bold text-fuchsia-600">{formatPeriod(e.fromDate, e.toDate)}</p>
 </div>
 <p className="text-orange-600">{e.company || "Company"}</p>
 </div>
 ))}
 </div>
 </CreativeSection>
 )}

 {eduList.length > 0 && (
 <CreativeSection title="Education" color="from-amber-500 to-orange-500">
 <div className="flex flex-col gap-2">
 {eduList.map((e) => (
 <div key={e.level} className="rounded-xl bg-white p-3 shadow-sm">
 <div className="flex items-baseline justify-between">
 <p className="font-semibold">
 {e.level === "other" && e.courseName ? e.courseName : EDU_LABELS[e.level]}
 </p>
 <p className="text-[10px] font-bold text-amber-600">{e.passedOutYear ?? "—"}</p>
 </div>
 {e.institution && <p className="text-[11px] text-zinc-600">{e.institution}</p>}
 {e.percentage != null && <p className="text-[10.5px] text-zinc-500">{e.percentage}%</p>}
 {e.thesis && <p className="text-[11px] italic text-zinc-500">"{e.thesis}"</p>}
 </div>
 ))}
 </div>
 </CreativeSection>
 )}
 </main>

 {/* Right sidebar */}
 <aside className="col-span-4 flex flex-col gap-5">
 {skills.length > 0 && (
 <CreativeSection title="Skills" color="from-cyan-500 to-sky-500" compact>
 <div className="flex flex-wrap gap-1.5">
 {skills.map((s) => (
 <span
 key={s}
 className="rounded-full bg-gradient-to-r from-orange-100 to-rose-100 px-2.5 py-1 text-[10.5px] font-semibold text-orange-700"
 >
 {s}
 </span>
 ))}
 </div>
 </CreativeSection>
 )}

 {profile.type === "fresher" && profile.field === "it" && profile.itSpecialization && (
 <CreativeSection title="Specialization" color="from-violet-500 to-fuchsia-500" compact>
 <p className="text-zinc-700">{profile.itSpecialization}</p>
 </CreativeSection>
 )}

 {profile.alternateMobile && (
 <CreativeSection title="Alt Contact" color="from-emerald-500 to-teal-500" compact>
 <p>+91 {profile.alternateMobile}</p>
 </CreativeSection>
 )}
 </aside>
 </div>
 </div>
 );
}

function Pill({ children }: { children: React.ReactNode }) {
 return (
 <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 backdrop-blur">{children}</span>
 );
}

function CreativeSection({
 title,
 color,
 children,
 compact = false,
}: {
 title: string;
 color: string;
 children: React.ReactNode;
 compact?: boolean;
}) {
 return (
 <section className={["rounded-2xl bg-white/60 p-4 shadow-sm", compact ? "" : "p-4"].join(" ")}>
 <div className={["mb-2 inline-block bg-gradient-to-r bg-clip-text text-[10px] font-bold uppercase tracking-[0.25em] text-transparent", color].join(" ")}>
 {title}
 </div>
 {children}
 </section>
 );
}
