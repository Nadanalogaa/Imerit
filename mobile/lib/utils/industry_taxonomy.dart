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
