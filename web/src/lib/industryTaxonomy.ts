/**
 * Naukri-style industry + department taxonomy — shared between:
 *   - the candidate profile wizard (About You step)
 *   - the employer job-posting wizard (Basics step)
 *   - the Browse Jobs filter panel
 *   - the Employer Search Candidates filter panel
 *
 * Two industry sub-lists, gated by the field selector (IT / Non-IT).
 * Departments are a single flat list because department names (Sales,
 * HR, Finance) cross the IT / Non-IT boundary in practice — the same
 * Sales team can sit inside an IT-services company or a manufacturing
 * company, and filtering by department shouldn't force the visitor
 * to also pick a field.
 *
 * Kept in one file so a future taxonomy tweak (add "Web3", split
 * "BFSI" into Banking / Insurance) is a one-line edit that ripples
 * through every surface automatically.
 */

export const INDUSTRIES_IT: readonly string[] = [
  "IT Services & Consulting",
  "Software Product",
  "Hardware & Networking",
  "Analytics / KPO",
  "Internet / E-commerce",
  "FinTech",
  "EdTech",
  "IT-Enabled Services (ITES)",
  "Cybersecurity",
  "Cloud / SaaS",
  "Gaming",
  "AI / Machine Learning",
];

export const INDUSTRIES_NON_IT: readonly string[] = [
  "Manufacturing",
  "Automobile",
  "Pharma / Healthcare",
  "Banking / Insurance (BFSI)",
  "Retail",
  "FMCG / Consumer Goods",
  "Construction / Real Estate",
  "Education / Training",
  "Media / Entertainment",
  "Telecom",
  "Energy / Power / Utilities",
  "Hospitality / Travel / Tourism",
  "Agriculture / Agri-tech",
  "Government / PSU / Defence",
  "Logistics / Supply Chain",
  "Textiles / Apparel",
  "Chemicals",
  "NGO / Social Services",
];

/** Full union of the two lists — for filter dropdowns where the visitor
 *  hasn't scoped to IT / Non-IT. Sorted alphabetically for scan-ability. */
export const INDUSTRIES_ALL: readonly string[] = [...INDUSTRIES_IT, ...INDUSTRIES_NON_IT]
  .slice()
  .sort((a, b) => a.localeCompare(b));

/** Returns the industry list scoped to a field, or the full list when
 *  no field is set. */
export function industriesForField(field: "IT" | "NON_IT" | null | undefined): readonly string[] {
  if (field === "IT") return INDUSTRIES_IT;
  if (field === "NON_IT") return INDUSTRIES_NON_IT;
  return INDUSTRIES_ALL;
}

/**
 * Departments — a flat list because the same department names cross IT
 * and non-IT (Sales, HR, Finance are department names in both a SaaS
 * company and a manufacturer). Naukri-inspired.
 */
export const DEPARTMENTS: readonly string[] = [
  "Engineering — Software",
  "Engineering — Hardware / Networks",
  "Data Science / Analytics",
  "IT Infrastructure / DevOps",
  "Quality Assurance / Testing",
  "Product Management",
  "UX / UI / Design",
  "Cyber Security",
  "Sales & Business Development",
  "Marketing / Brand",
  "Human Resources",
  "Finance & Accounts",
  "Operations",
  "Customer Service",
  "Legal / Compliance",
  "Administration / Facilities",
  "Supply Chain / Logistics",
  "Manufacturing / Production",
  "Research & Development",
  "Procurement",
  "Consulting",
  "Content / Editorial",
  "Teaching / Training",
  "Healthcare / Clinical",
  "Retail / Store Operations",
  "Security / Physical",
  "Other",
];
