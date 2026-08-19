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
 * Departments — the full flat list. Used as the fallback whenever the
 * caller hasn't picked an industry yet (or picks one that isn't in the
 * per-industry map). Same names cross IT and non-IT (Sales, HR, Finance
 * are department names in both a SaaS company and a manufacturer).
 * Naukri-inspired.
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

/**
 * Which departments make sense for each industry. The department names
 * here MUST exist verbatim in `DEPARTMENTS` above — the filter is a
 * subset filter, not a rename.
 *
 * Order inside each list is deliberate — the departments the industry
 * hires most for are listed first so the dropdown reads naturally.
 *
 * "Human Resources", "Finance & Accounts", "Administration / Facilities",
 * "Legal / Compliance" and "Other" are appended to every entry because
 * every non-trivial company hires for at least those. Adding them once
 * at the helper layer keeps this map short.
 */
const HR_FINANCE_ADMIN: readonly string[] = [
  "Human Resources",
  "Finance & Accounts",
  "Administration / Facilities",
  "Legal / Compliance",
  "Other",
];

const DEPARTMENTS_BY_INDUSTRY: Record<string, readonly string[]> = {
  // -------- IT industries --------
  "IT Services & Consulting": [
    "Engineering — Software",
    "IT Infrastructure / DevOps",
    "Quality Assurance / Testing",
    "Data Science / Analytics",
    "Product Management",
    "UX / UI / Design",
    "Consulting",
    "Sales & Business Development",
    "Customer Service",
  ],
  "Software Product": [
    "Engineering — Software",
    "Product Management",
    "UX / UI / Design",
    "Quality Assurance / Testing",
    "IT Infrastructure / DevOps",
    "Data Science / Analytics",
    "Sales & Business Development",
    "Marketing / Brand",
    "Customer Service",
  ],
  "Hardware & Networking": [
    "Engineering — Hardware / Networks",
    "IT Infrastructure / DevOps",
    "Cyber Security",
    "Sales & Business Development",
    "Customer Service",
    "Supply Chain / Logistics",
  ],
  "Analytics / KPO": [
    "Data Science / Analytics",
    "Consulting",
    "Operations",
    "Quality Assurance / Testing",
  ],
  "Internet / E-commerce": [
    "Engineering — Software",
    "Product Management",
    "UX / UI / Design",
    "Marketing / Brand",
    "Sales & Business Development",
    "Operations",
    "Customer Service",
    "Supply Chain / Logistics",
    "Data Science / Analytics",
  ],
  "FinTech": [
    "Engineering — Software",
    "Product Management",
    "Data Science / Analytics",
    "Cyber Security",
    "Sales & Business Development",
    "Customer Service",
  ],
  "EdTech": [
    "Engineering — Software",
    "Product Management",
    "Content / Editorial",
    "Teaching / Training",
    "Sales & Business Development",
    "Marketing / Brand",
    "Customer Service",
  ],
  "IT-Enabled Services (ITES)": [
    "Customer Service",
    "Operations",
    "Sales & Business Development",
    "Quality Assurance / Testing",
  ],
  "Cybersecurity": [
    "Cyber Security",
    "Engineering — Software",
    "IT Infrastructure / DevOps",
    "Consulting",
  ],
  "Cloud / SaaS": [
    "Engineering — Software",
    "IT Infrastructure / DevOps",
    "Product Management",
    "Sales & Business Development",
    "Customer Service",
    "Marketing / Brand",
  ],
  "Gaming": [
    "Engineering — Software",
    "Product Management",
    "UX / UI / Design",
    "Content / Editorial",
    "Quality Assurance / Testing",
    "Marketing / Brand",
  ],
  "AI / Machine Learning": [
    "Data Science / Analytics",
    "Engineering — Software",
    "Research & Development",
    "Product Management",
  ],
  // -------- Non-IT industries --------
  "Manufacturing": [
    "Manufacturing / Production",
    "Supply Chain / Logistics",
    "Research & Development",
    "Quality Assurance / Testing",
    "Procurement",
    "Operations",
    "Sales & Business Development",
    "Engineering — Hardware / Networks",
  ],
  "Automobile": [
    "Manufacturing / Production",
    "Research & Development",
    "Engineering — Hardware / Networks",
    "Supply Chain / Logistics",
    "Quality Assurance / Testing",
    "Procurement",
    "Sales & Business Development",
    "Customer Service",
  ],
  "Pharma / Healthcare": [
    "Manufacturing / Production",
    "Research & Development",
    "Healthcare / Clinical",
    "Quality Assurance / Testing",
    "Sales & Business Development",
    "Marketing / Brand",
    "Supply Chain / Logistics",
  ],
  "Banking / Insurance (BFSI)": [
    "Sales & Business Development",
    "Customer Service",
    "Operations",
    "Data Science / Analytics",
    "Marketing / Brand",
  ],
  "Retail": [
    "Retail / Store Operations",
    "Sales & Business Development",
    "Marketing / Brand",
    "Operations",
    "Supply Chain / Logistics",
    "Customer Service",
    "Procurement",
  ],
  "FMCG / Consumer Goods": [
    "Sales & Business Development",
    "Marketing / Brand",
    "Manufacturing / Production",
    "Supply Chain / Logistics",
    "Research & Development",
    "Operations",
  ],
  "Construction / Real Estate": [
    "Engineering — Hardware / Networks",
    "Operations",
    "Sales & Business Development",
    "Marketing / Brand",
    "Procurement",
    "Supply Chain / Logistics",
  ],
  "Education / Training": [
    "Teaching / Training",
    "Content / Editorial",
    "Sales & Business Development",
    "Marketing / Brand",
    "Operations",
  ],
  "Media / Entertainment": [
    "Content / Editorial",
    "Marketing / Brand",
    "UX / UI / Design",
    "Sales & Business Development",
    "Manufacturing / Production",
  ],
  "Telecom": [
    "Engineering — Hardware / Networks",
    "Customer Service",
    "Sales & Business Development",
    "Marketing / Brand",
    "IT Infrastructure / DevOps",
    "Operations",
  ],
  "Energy / Power / Utilities": [
    "Manufacturing / Production",
    "Research & Development",
    "Engineering — Hardware / Networks",
    "Operations",
    "Procurement",
    "Supply Chain / Logistics",
  ],
  "Hospitality / Travel / Tourism": [
    "Operations",
    "Customer Service",
    "Sales & Business Development",
    "Marketing / Brand",
  ],
  "Agriculture / Agri-tech": [
    "Manufacturing / Production",
    "Research & Development",
    "Supply Chain / Logistics",
    "Sales & Business Development",
  ],
  "Government / PSU / Defence": [
    "Administration / Facilities",
    "Operations",
    "Research & Development",
    "Security / Physical",
  ],
  "Logistics / Supply Chain": [
    "Supply Chain / Logistics",
    "Operations",
    "Sales & Business Development",
    "Customer Service",
    "Procurement",
  ],
  "Textiles / Apparel": [
    "Manufacturing / Production",
    "UX / UI / Design",
    "Sales & Business Development",
    "Marketing / Brand",
    "Supply Chain / Logistics",
  ],
  "Chemicals": [
    "Manufacturing / Production",
    "Research & Development",
    "Quality Assurance / Testing",
    "Supply Chain / Logistics",
    "Sales & Business Development",
  ],
  "NGO / Social Services": [
    "Administration / Facilities",
    "Operations",
    "Content / Editorial",
    "Marketing / Brand",
  ],
};

/**
 * Returns the department options for a given industry. Every result
 * ends with the shared HR / Finance / Admin / Legal / Other tail so
 * cross-cutting hires stay reachable from every industry.
 *
 * When `industry` is empty/undefined OR isn't in the map, returns the
 * full DEPARTMENTS list — the visitor hasn't scoped yet, so keep every
 * option in play.
 */
export function departmentsForIndustry(industry: string | undefined | null): readonly string[] {
  if (!industry) return DEPARTMENTS;
  const specific = DEPARTMENTS_BY_INDUSTRY[industry];
  if (!specific) return DEPARTMENTS;
  // Dedup — the specific list already declares Sales / Operations etc.
  // that could overlap with the tail; we keep the specific-list order
  // and drop duplicates from the tail.
  const seen = new Set(specific);
  const tail = HR_FINANCE_ADMIN.filter((d) => !seen.has(d));
  return [...specific, ...tail];
}
