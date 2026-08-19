/**
 * Degree + specialisation taxonomy — Tamil Nadu / Indian education board
 * style. Used by the Education step of the candidate profile wizard so
 * degreeName and specialization become filtered dropdowns instead of
 * free-text fields.
 *
 * Every dropdown ends with "Other" so a candidate with a rarer course
 * (e.g. a niche paramedical course, an inter-disciplinary honours) can
 * still enter their own value — the wizard flips those fields to a free
 * TextInput when "Other" is chosen.
 *
 * Kept out of the industryTaxonomy file because the lists here map
 * education-level → degree → specialization and don't overlap with the
 * industry/department universe.
 */

import type { EducationLevel } from "../store/profile";

/** Marker value stored while the candidate is picking "Other" — the
 *  wizard swaps in a free-text input, and the actual free-text value
 *  overwrites this in the store on save. */
export const OTHER_DEGREE = "Other";

/**
 * Common Tamil Nadu / Indian degree names for each post-secondary
 * education level. Order is by frequency of enrolment (most common
 * first) so the dropdown reads naturally.
 *
 * MPhil / PhD each have a single canonical degree name ("M.Phil",
 * "Ph.D") — the candidate customises via specialisation instead.
 */
export const DEGREES_BY_LEVEL: Record<
  Extract<EducationLevel, "diploma" | "ug" | "pg" | "mphil" | "phd">,
  readonly string[]
> = {
  diploma: [
    "Polytechnic Diploma — Mechanical",
    "Polytechnic Diploma — Electrical & Electronics",
    "Polytechnic Diploma — Electronics & Communication",
    "Polytechnic Diploma — Computer Science",
    "Polytechnic Diploma — Civil",
    "Polytechnic Diploma — Automobile",
    "Polytechnic Diploma — Chemical",
    "Polytechnic Diploma — Textile Technology",
    "Polytechnic Diploma — Instrumentation & Control",
    "Diploma in Nursing (GNM)",
    "Diploma in Pharmacy (D.Pharm)",
    "D.El.Ed (Elementary Education)",
    "DTED (Diploma in Teacher Education)",
    "Diploma in Hotel Management",
    "Diploma in Fashion Design",
    "Other",
  ],
  ug: [
    "B.Sc",
    "B.A",
    "B.Com",
    "B.E",
    "B.Tech",
    "BBA",
    "BCA",
    "LLB (3-year)",
    "BA LLB (5-year integrated)",
    "MBBS",
    "BDS",
    "BAMS (Ayurveda)",
    "BHMS (Homeopathy)",
    "BSMS (Siddha)",
    "BUMS (Unani)",
    "B.Pharm",
    "B.Arch",
    "BVSc (Veterinary)",
    "B.Ed",
    "B.P.Ed (Physical Education)",
    "BFA (Fine Arts)",
    "BFT (Fashion Technology)",
    "BHM (Hotel Management)",
    "BJMC (Journalism & Mass Comm)",
    "Bachelor of Physiotherapy (BPT)",
    "B.Sc Agriculture",
    "B.Sc Nursing",
    "Other",
  ],
  pg: [
    "M.Sc",
    "M.A",
    "M.Com",
    "M.E",
    "M.Tech",
    "MBA",
    "MCA",
    "MSW (Social Work)",
    "LLM",
    "MD",
    "MS",
    "MDS",
    "M.Pharm",
    "M.Arch",
    "MFA (Fine Arts)",
    "M.Ed",
    "M.P.Ed",
    "MJMC (Journalism & Mass Comm)",
    "Master of Physiotherapy (MPT)",
    "M.Sc Nursing",
    "Other",
  ],
  mphil: ["M.Phil", "Other"],
  phd: ["Ph.D", "Other"],
};

// ---- Specialisation sub-lists (reused across multiple degrees). ----

const ENGINEERING_STREAMS: readonly string[] = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical",
  "Civil",
  "Chemical",
  "Automobile",
  "Aeronautical",
  "Biomedical",
  "Biotechnology",
  "Instrumentation & Control",
  "Marine",
  "Metallurgy",
  "Mining",
  "Petroleum",
  "Production",
  "Textile",
  "Agricultural",
  "Environmental",
];

const BSC_STREAMS: readonly string[] = [
  "Computer Science",
  "Information Technology",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Botany",
  "Zoology",
  "Biochemistry",
  "Microbiology",
  "Biotechnology",
  "Statistics",
  "Electronics",
  "Nursing",
  "Nutrition & Dietetics",
  "Home Science",
  "Psychology",
  "Visual Communication",
  "Agriculture",
  "Environmental Science",
  "Data Science",
];

const BA_STREAMS: readonly string[] = [
  "Tamil",
  "English",
  "History",
  "Economics",
  "Sociology",
  "Political Science",
  "Psychology",
  "Journalism",
  "Philosophy",
  "Public Administration",
  "Fine Arts",
  "Music",
  "Sanskrit",
  "Malayalam",
  "Kannada",
  "Telugu",
  "Hindi",
  "Islamic Studies",
  "Christian Studies",
  "Anthropology",
  "Rural Development",
];

const BCOM_STREAMS: readonly string[] = [
  "General",
  "Corporate Secretaryship",
  "Bank Management",
  "Accounting & Finance",
  "Computer Applications",
  "Information Technology",
  "Marketing",
  "International Business",
  "Taxation",
  "Foreign Trade",
  "Cost Accounting",
];

const BBA_STREAMS: readonly string[] = [
  "General",
  "Marketing",
  "Finance",
  "Human Resources",
  "International Business",
  "Logistics & Supply Chain",
  "Retail Management",
  "Hospital Administration",
  "Aviation Management",
  "Entrepreneurship",
];

const MBA_STREAMS: readonly string[] = [
  "General",
  "Marketing",
  "Finance",
  "Human Resources",
  "Operations",
  "IT / Systems",
  "International Business",
  "Healthcare Management",
  "Business Analytics",
  "Retail Management",
  "Rural Management",
  "Entrepreneurship",
  "Logistics & Supply Chain",
];

const MSC_STREAMS: readonly string[] = [...BSC_STREAMS];
const MA_STREAMS: readonly string[] = [...BA_STREAMS];
const MCOM_STREAMS: readonly string[] = [...BCOM_STREAMS];
const MENG_STREAMS: readonly string[] = [...ENGINEERING_STREAMS];

const DIPLOMA_STREAMS: readonly string[] = [...ENGINEERING_STREAMS, "General"];

/** Fallback pool for degrees without a per-degree entry (M.Phil / Ph.D
 *  discipline free-select, plus the "Other" degree option). */
const ALL_STREAMS: readonly string[] = Array.from(
  new Set([
    ...ENGINEERING_STREAMS,
    ...BSC_STREAMS,
    ...BA_STREAMS,
    ...BCOM_STREAMS,
    ...BBA_STREAMS,
    ...MBA_STREAMS,
  ]),
).sort((a, b) => a.localeCompare(b));

/**
 * Which specialisations make sense for each degree. The keys here MUST
 * match the exact strings in DEGREES_BY_LEVEL above. Every list gets
 * "Other" appended by the helper so free-text is always available.
 */
const SPECIALIZATIONS_BY_DEGREE: Record<string, readonly string[]> = {
  // -------- UG --------
  "B.Sc": BSC_STREAMS,
  "B.A": BA_STREAMS,
  "B.Com": BCOM_STREAMS,
  "B.E": ENGINEERING_STREAMS,
  "B.Tech": ENGINEERING_STREAMS,
  "BBA": BBA_STREAMS,
  "BCA": ["General", "Data Science", "Cyber Security", "AI/ML"],
  "LLB (3-year)": ["General", "Corporate Law", "Criminal Law", "Constitutional Law", "Family Law", "Intellectual Property"],
  "BA LLB (5-year integrated)": ["General", "Corporate Law", "Criminal Law", "Constitutional Law", "Family Law"],
  "MBBS": ["General Medicine"],
  "BDS": ["General Dentistry"],
  "BAMS (Ayurveda)": ["General"],
  "BHMS (Homeopathy)": ["General"],
  "BSMS (Siddha)": ["General"],
  "BUMS (Unani)": ["General"],
  "B.Pharm": ["Pharmaceutical Chemistry", "Pharmaceutics", "Pharmacology", "Pharmacognosy", "Pharmacy Practice"],
  "B.Arch": ["General"],
  "BVSc (Veterinary)": ["General"],
  "B.Ed": ["Tamil", "English", "Mathematics", "Science", "Social Studies", "Computer Science", "Physical Science", "Biological Science", "Commerce"],
  "B.P.Ed (Physical Education)": ["General"],
  "BFA (Fine Arts)": ["Painting", "Sculpture", "Applied Arts", "Photography", "Animation"],
  "BFT (Fashion Technology)": ["Fashion Design", "Textile Design", "Apparel Production"],
  "BHM (Hotel Management)": ["General", "Culinary Arts", "Front Office", "Housekeeping"],
  "BJMC (Journalism & Mass Comm)": ["General", "Print Journalism", "Broadcast Journalism", "Digital Media", "Advertising", "Public Relations"],
  "Bachelor of Physiotherapy (BPT)": ["General"],
  "B.Sc Agriculture": ["General", "Horticulture", "Agronomy", "Soil Science", "Plant Pathology"],
  "B.Sc Nursing": ["General"],
  // -------- PG --------
  "M.Sc": MSC_STREAMS,
  "M.A": MA_STREAMS,
  "M.Com": MCOM_STREAMS,
  "M.E": MENG_STREAMS,
  "M.Tech": MENG_STREAMS,
  "MBA": MBA_STREAMS,
  "MCA": ["General", "Software Engineering", "Data Science", "Cyber Security", "AI/ML", "Cloud Computing"],
  "MSW (Social Work)": ["Community Development", "Medical & Psychiatric", "Human Resource", "Family & Child Welfare"],
  "LLM": ["Corporate Law", "Criminal Law", "Constitutional Law", "Intellectual Property", "International Law", "Human Rights"],
  "MD": ["General Medicine", "Paediatrics", "Dermatology", "Radiology", "Anaesthesia", "Psychiatry", "Pathology", "Community Medicine"],
  "MS": ["General Surgery", "Orthopaedics", "ENT", "Ophthalmology", "Obstetrics & Gynaecology", "Urology"],
  "MDS": ["Orthodontics", "Periodontics", "Prosthodontics", "Endodontics", "Oral Surgery", "Paedodontics"],
  "M.Pharm": ["Pharmaceutical Chemistry", "Pharmaceutics", "Pharmacology", "Pharmacognosy", "Pharmacy Practice", "Industrial Pharmacy"],
  "M.Arch": ["General", "Urban Design", "Landscape Architecture", "Sustainable Design"],
  "MFA (Fine Arts)": ["Painting", "Sculpture", "Applied Arts", "Photography"],
  "M.Ed": ["Tamil", "English", "Mathematics", "Science", "Social Studies", "Educational Psychology", "Educational Technology"],
  "M.P.Ed": ["General"],
  "MJMC (Journalism & Mass Comm)": ["General", "Digital Media", "Broadcast", "Advertising & PR"],
  "Master of Physiotherapy (MPT)": ["Musculoskeletal", "Neurology", "Cardiopulmonary", "Sports"],
  "M.Sc Nursing": ["Medical-Surgical", "Community Health", "Paediatric", "Obstetric & Gynae", "Psychiatric"],
  // -------- MPhil / PhD --------
  "M.Phil": ALL_STREAMS,
  "Ph.D": ALL_STREAMS,
};

/**
 * Returns the degree options for a given education level. Callers pass
 * the same level the form's LevelCard already uses.
 */
export function degreesForLevel(
  level: EducationLevel,
): readonly string[] {
  if (level === "diploma" || level === "ug" || level === "pg" || level === "mphil" || level === "phd") {
    return DEGREES_BY_LEVEL[level];
  }
  // 10th / 12th / other — the wizard doesn't render a Degree Name
  // dropdown for these; return an empty list so the caller can decide
  // to hide the row entirely.
  return [];
}

/**
 * Returns the specialisation options for a given degree. Every result
 * ends with "Other" so free-text is always reachable.
 *
 * For diploma we default to engineering streams because the diploma
 * options above are pre-scoped to a stream (e.g. "Polytechnic Diploma
 * — Mechanical") — most candidates won't need to specialise further,
 * so the specialisation dropdown becomes optional context.
 *
 * When the caller passes an empty/unknown degree we return the union
 * ALL_STREAMS so the dropdown isn't blocked before a degree is picked.
 */
export function specializationsForDegree(
  degree: string | undefined | null,
  level?: EducationLevel,
): readonly string[] {
  const withOther = (list: readonly string[]) =>
    list.includes("Other") ? list : [...list, "Other"];
  if (!degree) {
    if (level === "diploma") return withOther(DIPLOMA_STREAMS);
    return withOther(ALL_STREAMS);
  }
  const list = SPECIALIZATIONS_BY_DEGREE[degree];
  if (list) return withOther(list);
  // Custom / free-text degree (Other, or a value that isn't in the
  // curated map) → fall back to the full union so the specialisation
  // dropdown still helps.
  return withOther(ALL_STREAMS);
}
