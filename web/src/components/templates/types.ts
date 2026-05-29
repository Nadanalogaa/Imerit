import type { CandidateProfile } from "../../store/profile";
import type { User } from "../../store/auth";

export interface TemplateProps {
  user: User;
  profile: CandidateProfile;
}

export const EDU_LABELS: Record<string, string> = {
  "10th": "10th Standard",
  "12th": "12th Standard",
  diploma: "Diploma",
  ug: "Undergraduate",
  pg: "Postgraduate",
  mphil: "M.Phil",
  phd: "Ph.D",
  other: "Other",
};

export function shortRole(p: CandidateProfile): string {
  if (p.type === "experienced") {
    if (p.experiences && p.experiences.length > 0) {
      const current = p.experiences.find((e) => e.toDate === null) ?? p.experiences[0];
      return current.role || "Professional";
    }
    return `${p.yearsOfExperience ?? "—"} years experience`;
  }
  if (p.type === "fresher") {
    if (p.field === "it" && p.itSpecialization) return `Aspiring ${p.itSpecialization}`;
    if (p.field === "non_it" && p.nonItDepartments && p.nonItDepartments.length > 0) {
      return `Aspiring ${p.nonItDepartments[0]}`;
    }
    return p.internOrJob === "intern" ? "Intern / Trainee" : "Fresher";
  }
  return "Candidate";
}

export function highlightedSkills(p: CandidateProfile): string[] {
  if (p.type === "experienced") return p.topSkills ?? [];
  if (p.type === "fresher") {
    if (p.field === "it") return p.itLanguages ?? [];
    if (p.field === "non_it") return p.nonItDepartments ?? [];
  }
  return [];
}

export function formatPeriod(from: string, to: string | null): string {
  if (!from) return "";
  const fmt = (s: string) => {
    const [y, m] = s.split("-");
    if (!y) return s;
    if (!m) return y;
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  return `${fmt(from)} – ${to === null ? "Present" : fmt(to)}`;
}

export function fullName(user: User, _profile: CandidateProfile): string {
  return user.name || "Your Name";
}

export const TEMPLATE_META = [
  { id: "classic", label: "Classic Executive", desc: "Formal, navy & cream, serif headings" },
  { id: "modern", label: "Modern Minimal", desc: "Apple-clean, two-column, lots of whitespace" },
  { id: "creative", label: "Creative Bold", desc: "Gradient hero, color-blocked sections" },
  { id: "corporate", label: "Corporate Sidebar", desc: "LinkedIn-style sidebar, polished and pro" },
  { id: "tech_mono", label: "Tech / Dark Mono", desc: "Terminal vibe, monospace, neon accents" },
] as const;
