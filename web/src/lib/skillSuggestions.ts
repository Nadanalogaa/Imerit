/**
 * Shared skill-suggestion lists used by both:
 *   - Employer job posting (JobFormWizard) — required skills for the job
 *   - Candidate profile builder (AboutYouStep) — the candidate's top 5 skills
 *
 * Kept in one place so a "React" added to the IT list surfaces on both
 * sides of the marketplace consistently.
 *
 * The three groups (IT / Non-IT / Common) are exposed separately so
 * callers can splice them per the current field:
 *   IT      → SKILL_SUGGESTIONS_IT ∪ SKILL_SUGGESTIONS_COMMON
 *   Non-IT  → SKILL_SUGGESTIONS_NON_IT ∪ SKILL_SUGGESTIONS_COMMON
 *   Unknown → all three merged
 *
 * Use `suggestionsForField()` for the merged view — it does the union
 * for you and dedupes.
 */

export const SKILL_SUGGESTIONS_IT = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Dart",
  "React", "Next.js", "Vue.js", "Angular", "Svelte", "HTML/CSS", "Tailwind CSS", "SASS", "Redux", "Zustand", "TanStack Query",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI", "Spring Boot", ".NET", "Laravel", "Ruby on Rails",
  "React Native", "Flutter", "iOS", "Android", "Xamarin",
  "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "MariaDB", "Cassandra", "DynamoDB", "Elasticsearch",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "CI/CD", "Linux",
  "Data Science", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Pandas", "NumPy", "Power BI", "Tableau",
  "Figma", "Adobe XD", "Sketch", "Illustrator", "Photoshop", "UI Design", "UX Design",
  "Selenium", "Cypress", "Jest", "Postman", "Git", "REST API", "GraphQL", "Microservices",
];

export const SKILL_SUGGESTIONS_NON_IT = [
  "Sales", "Field Sales", "Marketing", "Digital Marketing", "SEO", "Social Media", "Content Writing",
  "Customer Service", "Voice Process", "Non-Voice Process", "Insurance", "Telesales",
  "HR", "Recruitment", "Payroll", "Employee Engagement", "Administration",
  "Accounting", "Finance", "Excel", "Tally", "GST", "Financial Modeling", "Auditing", "Taxation",
  "Supply Chain", "Logistics", "Purchase", "Warehouse Management", "Inventory Management",
  "Operations", "Procurement",
  "Civil Engineering", "AutoCAD", "Site Management", "Electrical Wiring", "Plumbing", "Welding", "Carpentry",
  "Driving", "Delivery", "Two-wheeler License", "Heavy Vehicle License",
  "Nursing", "Pharmacy", "Teaching", "Retail", "Cashier",
];

export const SKILL_SUGGESTIONS_COMMON = [
  "Communication", "English", "Tamil", "Hindi", "Telugu", "Kannada", "Malayalam",
  "MS Word", "MS PowerPoint", "Team Management", "Problem Solving",
];

/**
 * Return the right suggestion pool for a given field.
 *   "it"     → IT + Common
 *   "non_it" → Non-IT + Common
 *   undefined → all three (candidate hasn't picked a field yet)
 *
 * Deduped case-sensitively — the source lists are hand-curated so
 * cross-list collisions are rare, but the guard is cheap.
 */
export function suggestionsForField(field: "it" | "non_it" | undefined): string[] {
  const base =
    field === "it"
      ? [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_COMMON]
      : field === "non_it"
        ? [...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON]
        : [...SKILL_SUGGESTIONS_IT, ...SKILL_SUGGESTIONS_NON_IT, ...SKILL_SUGGESTIONS_COMMON];
  return Array.from(new Set(base));
}
