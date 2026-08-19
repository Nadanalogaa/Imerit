/// Dart mirror of `web/src/lib/industryTaxonomy.ts` — kept string-for-string
/// identical so the mobile client sends the same industry / department values
/// as web when filtering jobs or candidates on the backend. Any change to the
/// web taxonomy must be replicated here.
///
/// Two industry sub-lists (IT / Non-IT) gated by the candidate's field
/// selector. Departments are a single flat list because department names
/// (Sales, HR, Finance) cross the IT / Non-IT boundary.
library;

const List<String> kIndustriesIt = <String>[
  'IT Services & Consulting',
  'Software Product',
  'Hardware & Networking',
  'Analytics / KPO',
  'Internet / E-commerce',
  'FinTech',
  'EdTech',
  'IT-Enabled Services (ITES)',
  'Cybersecurity',
  'Cloud / SaaS',
  'Gaming',
  'AI / Machine Learning',
];

const List<String> kIndustriesNonIt = <String>[
  'Manufacturing',
  'Automobile',
  'Pharma / Healthcare',
  'Banking / Insurance (BFSI)',
  'Retail',
  'FMCG / Consumer Goods',
  'Construction / Real Estate',
  'Education / Training',
  'Media / Entertainment',
  'Telecom',
  'Energy / Power / Utilities',
  'Hospitality / Travel / Tourism',
  'Agriculture / Agri-tech',
  'Government / PSU / Defence',
  'Logistics / Supply Chain',
  'Textiles / Apparel',
  'Chemicals',
  'NGO / Social Services',
];

/// Full union of the two lists, alphabetically sorted — for filter dropdowns
/// where the visitor hasn't scoped to IT / Non-IT.
final List<String> kIndustriesAll = <String>[
  ...kIndustriesIt,
  ...kIndustriesNonIt,
]..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

/// Returns the industry list scoped to a field, or the full list when no
/// field is set. `field` matches the backend enum casing: `'IT'` / `'NON_IT'`.
List<String> industriesForField(String? field) {
  if (field == 'IT') return kIndustriesIt;
  if (field == 'NON_IT') return kIndustriesNonIt;
  return kIndustriesAll;
}

/// Departments — flat list because the same department names cross IT and
/// non-IT (Sales, HR, Finance work in both a SaaS company and a manufacturer).
const List<String> kDepartments = <String>[
  'Engineering — Software',
  'Engineering — Hardware / Networks',
  'Data Science / Analytics',
  'IT Infrastructure / DevOps',
  'Quality Assurance / Testing',
  'Product Management',
  'UX / UI / Design',
  'Cyber Security',
  'Sales & Business Development',
  'Marketing / Brand',
  'Human Resources',
  'Finance & Accounts',
  'Operations',
  'Customer Service',
  'Legal / Compliance',
  'Administration / Facilities',
  'Supply Chain / Logistics',
  'Manufacturing / Production',
  'Research & Development',
  'Procurement',
  'Consulting',
  'Content / Editorial',
  'Teaching / Training',
  'Healthcare / Clinical',
  'Retail / Store Operations',
  'Security / Physical',
  'Other',
];

/// Shared tail appended to every industry's department list — every
/// non-trivial company hires HR / Finance / Admin / Legal at minimum
/// so the tail keeps them reachable without repeating in the map.
const List<String> _kHrFinanceAdmin = <String>[
  'Human Resources',
  'Finance & Accounts',
  'Administration / Facilities',
  'Legal / Compliance',
  'Other',
];

/// Which departments make sense for each industry. Verbatim mirror of
/// `DEPARTMENTS_BY_INDUSTRY` in `web/src/lib/industryTaxonomy.ts`.
/// Names MUST exist in `kDepartments` — this is a subset filter, not a
/// rename. Order inside each list is deliberate — the departments the
/// industry hires most for come first.
const Map<String, List<String>> _kDepartmentsByIndustry = <String, List<String>>{
  // -------- IT industries --------
  'IT Services & Consulting': <String>[
    'Engineering — Software',
    'IT Infrastructure / DevOps',
    'Quality Assurance / Testing',
    'Data Science / Analytics',
    'Product Management',
    'UX / UI / Design',
    'Consulting',
    'Sales & Business Development',
    'Customer Service',
  ],
  'Software Product': <String>[
    'Engineering — Software',
    'Product Management',
    'UX / UI / Design',
    'Quality Assurance / Testing',
    'IT Infrastructure / DevOps',
    'Data Science / Analytics',
    'Sales & Business Development',
    'Marketing / Brand',
    'Customer Service',
  ],
  'Hardware & Networking': <String>[
    'Engineering — Hardware / Networks',
    'IT Infrastructure / DevOps',
    'Cyber Security',
    'Sales & Business Development',
    'Customer Service',
    'Supply Chain / Logistics',
  ],
  'Analytics / KPO': <String>[
    'Data Science / Analytics',
    'Consulting',
    'Operations',
    'Quality Assurance / Testing',
  ],
  'Internet / E-commerce': <String>[
    'Engineering — Software',
    'Product Management',
    'UX / UI / Design',
    'Marketing / Brand',
    'Sales & Business Development',
    'Operations',
    'Customer Service',
    'Supply Chain / Logistics',
    'Data Science / Analytics',
  ],
  'FinTech': <String>[
    'Engineering — Software',
    'Product Management',
    'Data Science / Analytics',
    'Cyber Security',
    'Sales & Business Development',
    'Customer Service',
  ],
  'EdTech': <String>[
    'Engineering — Software',
    'Product Management',
    'Content / Editorial',
    'Teaching / Training',
    'Sales & Business Development',
    'Marketing / Brand',
    'Customer Service',
  ],
  'IT-Enabled Services (ITES)': <String>[
    'Customer Service',
    'Operations',
    'Sales & Business Development',
    'Quality Assurance / Testing',
  ],
  'Cybersecurity': <String>[
    'Cyber Security',
    'Engineering — Software',
    'IT Infrastructure / DevOps',
    'Consulting',
  ],
  'Cloud / SaaS': <String>[
    'Engineering — Software',
    'IT Infrastructure / DevOps',
    'Product Management',
    'Sales & Business Development',
    'Customer Service',
    'Marketing / Brand',
  ],
  'Gaming': <String>[
    'Engineering — Software',
    'Product Management',
    'UX / UI / Design',
    'Content / Editorial',
    'Quality Assurance / Testing',
    'Marketing / Brand',
  ],
  'AI / Machine Learning': <String>[
    'Data Science / Analytics',
    'Engineering — Software',
    'Research & Development',
    'Product Management',
  ],
  // -------- Non-IT industries --------
  'Manufacturing': <String>[
    'Manufacturing / Production',
    'Supply Chain / Logistics',
    'Research & Development',
    'Quality Assurance / Testing',
    'Procurement',
    'Operations',
    'Sales & Business Development',
    'Engineering — Hardware / Networks',
  ],
  'Automobile': <String>[
    'Manufacturing / Production',
    'Research & Development',
    'Engineering — Hardware / Networks',
    'Supply Chain / Logistics',
    'Quality Assurance / Testing',
    'Procurement',
    'Sales & Business Development',
    'Customer Service',
  ],
  'Pharma / Healthcare': <String>[
    'Manufacturing / Production',
    'Research & Development',
    'Healthcare / Clinical',
    'Quality Assurance / Testing',
    'Sales & Business Development',
    'Marketing / Brand',
    'Supply Chain / Logistics',
  ],
  'Banking / Insurance (BFSI)': <String>[
    'Sales & Business Development',
    'Customer Service',
    'Operations',
    'Data Science / Analytics',
    'Marketing / Brand',
  ],
  'Retail': <String>[
    'Retail / Store Operations',
    'Sales & Business Development',
    'Marketing / Brand',
    'Operations',
    'Supply Chain / Logistics',
    'Customer Service',
    'Procurement',
  ],
  'FMCG / Consumer Goods': <String>[
    'Sales & Business Development',
    'Marketing / Brand',
    'Manufacturing / Production',
    'Supply Chain / Logistics',
    'Research & Development',
    'Operations',
  ],
  'Construction / Real Estate': <String>[
    'Engineering — Hardware / Networks',
    'Operations',
    'Sales & Business Development',
    'Marketing / Brand',
    'Procurement',
    'Supply Chain / Logistics',
  ],
  'Education / Training': <String>[
    'Teaching / Training',
    'Content / Editorial',
    'Sales & Business Development',
    'Marketing / Brand',
    'Operations',
  ],
  'Media / Entertainment': <String>[
    'Content / Editorial',
    'Marketing / Brand',
    'UX / UI / Design',
    'Sales & Business Development',
    'Manufacturing / Production',
  ],
  'Telecom': <String>[
    'Engineering — Hardware / Networks',
    'Customer Service',
    'Sales & Business Development',
    'Marketing / Brand',
    'IT Infrastructure / DevOps',
    'Operations',
  ],
  'Energy / Power / Utilities': <String>[
    'Manufacturing / Production',
    'Research & Development',
    'Engineering — Hardware / Networks',
    'Operations',
    'Procurement',
    'Supply Chain / Logistics',
  ],
  'Hospitality / Travel / Tourism': <String>[
    'Operations',
    'Customer Service',
    'Sales & Business Development',
    'Marketing / Brand',
  ],
  'Agriculture / Agri-tech': <String>[
    'Manufacturing / Production',
    'Research & Development',
    'Supply Chain / Logistics',
    'Sales & Business Development',
  ],
  'Government / PSU / Defence': <String>[
    'Administration / Facilities',
    'Operations',
    'Research & Development',
    'Security / Physical',
  ],
  'Logistics / Supply Chain': <String>[
    'Supply Chain / Logistics',
    'Operations',
    'Sales & Business Development',
    'Customer Service',
    'Procurement',
  ],
  'Textiles / Apparel': <String>[
    'Manufacturing / Production',
    'UX / UI / Design',
    'Sales & Business Development',
    'Marketing / Brand',
    'Supply Chain / Logistics',
  ],
  'Chemicals': <String>[
    'Manufacturing / Production',
    'Research & Development',
    'Quality Assurance / Testing',
    'Supply Chain / Logistics',
    'Sales & Business Development',
  ],
  'NGO / Social Services': <String>[
    'Administration / Facilities',
    'Operations',
    'Content / Editorial',
    'Marketing / Brand',
  ],
};

/// Returns the department options for a given industry. Every result ends
/// with the shared HR / Finance / Admin / Legal / Other tail so cross-
/// cutting hires stay reachable from every industry.
///
/// When `industry` is empty/null OR isn't in the map, returns the full
/// `kDepartments` list — the visitor hasn't scoped yet, so keep every
/// option in play. Mirrors `departmentsForIndustry` in
/// `web/src/lib/industryTaxonomy.ts`.
List<String> departmentsForIndustry(String? industry) {
  if (industry == null || industry.isEmpty) return kDepartments;
  final specific = _kDepartmentsByIndustry[industry];
  if (specific == null) return kDepartments;
  final seen = specific.toSet();
  final tail = _kHrFinanceAdmin.where((d) => !seen.contains(d));
  return <String>[...specific, ...tail];
}
