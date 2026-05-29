import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";

export type JobField = "it" | "non_it";
export type JobType = "internship" | "full_time" | "part_time" | "contract";
export type JobExperience = "fresher" | "experienced" | "any";

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  /** Legacy display label; new code uses districtId/talukId for matching. */
  location: string;
  /** Structured location for distance/matching. */
  districtId?: string;
  talukId?: string;
  lat?: number;
  lng?: number;
  /** Optional private street — never shown publicly. */
  street?: string;
  pincode?: string;
  field: JobField;
  type: JobType;
  experience: JobExperience;
  yearsMin?: number;
  yearsMax?: number;
  salaryRange?: string;
  skills: string[];
  postedAt: string;
}

const SEED: Job[] = [
  {
    id: "job_001",
    employerId: "emp_zoho",
    employerName: "Zoho Corporation",
    title: "Junior React Developer",
    description: "Join our product engineering team in Chennai. You'll work on the next-gen Zoho CRM frontend, contribute to our component library, and learn from senior engineers.",
    location: "Sholinganallur, Chennai",
    districtId: "chennai", talukId: "chennai_sholinganallur", lat: 12.9010, lng: 80.2279,
    field: "it", type: "full_time", experience: "fresher",
    salaryRange: "₹3.5 – 5 LPA",
    skills: ["React", "TypeScript", "HTML/CSS", "Git"],
    postedAt: daysAgo(2),
  },
  {
    id: "job_002",
    employerId: "emp_freshworks",
    employerName: "Freshworks",
    title: "Senior Backend Engineer (Node.js)",
    description: "Help architect the next generation of Freshdesk's customer engagement platform. 5+ years of Node.js + microservices experience. Strong in MySQL, Redis, AWS.",
    location: "Coimbatore North",
    districtId: "coimbatore", talukId: "coimbatore_north", lat: 11.0510, lng: 76.9558,
    field: "it", type: "full_time", experience: "experienced", yearsMin: 5,
    salaryRange: "₹18 – 32 LPA",
    skills: ["Node.js", "MySQL", "AWS", "Microservices", "Redis"],
    postedAt: daysAgo(4),
  },
  {
    id: "job_003",
    employerId: "emp_cognizant",
    employerName: "Cognizant Madurai",
    title: "HR Executive — Recruitment",
    description: "Manage end-to-end recruitment for SME clients across Tamil Nadu. Excellent English + Tamil communication required.",
    location: "Madurai South",
    districtId: "madurai", talukId: "madurai_madurai_south", lat: 9.9000, lng: 78.1167,
    field: "non_it", type: "full_time", experience: "any",
    salaryRange: "₹3 – 5 LPA",
    skills: ["Recruitment", "Communication", "English", "Tamil"],
    postedAt: daysAgo(5),
  },
  {
    id: "job_004",
    employerId: "emp_techmahindra",
    employerName: "Tech Mahindra BPS",
    title: "Customer Support — Voice Process",
    description: "Excellent English communication with neutral accent required. Night shift (US clients). Fresh graduates welcome. Free transport, performance incentives.",
    location: "Perambur, Chennai",
    districtId: "chennai", talukId: "chennai_perambur", lat: 13.1149, lng: 80.2329,
    field: "non_it", type: "full_time", experience: "fresher",
    salaryRange: "₹2.5 – 3.8 LPA",
    skills: ["Voice Process", "English", "Customer Service"],
    postedAt: daysAgo(1),
  },
  {
    id: "job_005",
    employerId: "emp_zoho_trichy",
    employerName: "Zoho Trichy",
    title: "AI/ML Internship — 6 months",
    description: "6-month research internship working on multilingual NLP for Indian languages. Stipend ₹35K/month. Final-year B.Tech / M.Tech students preferred. Conversion based on performance.",
    location: "Srirangam, Tiruchirappalli",
    districtId: "tiruchirappalli", talukId: "tiruchirappalli_srirangam", lat: 10.8589, lng: 78.6890,
    field: "it", type: "internship", experience: "fresher",
    salaryRange: "₹35K / month",
    skills: ["Python", "PyTorch", "NLP", "Research"],
    postedAt: daysAgo(7),
  },
  {
    id: "job_006",
    employerId: "emp_kpmg",
    employerName: "KPMG India",
    title: "Junior Finance Analyst",
    description: "Join our finance advisory team. CA Inter/CS or B.Com graduates. Strong Excel + financial modeling. Exposure to top-tier clients.",
    location: "T. Nagar, Chennai",
    districtId: "chennai", talukId: "chennai_t_nagar", lat: 13.0418, lng: 80.2341,
    field: "non_it", type: "full_time", experience: "fresher",
    salaryRange: "₹4 – 6 LPA",
    skills: ["Excel", "Financial Modeling", "Accounting"],
    postedAt: daysAgo(3),
  },
  {
    id: "job_007",
    employerId: "emp_aviva",
    employerName: "Aviva BPO Tirunelveli",
    title: "Sales Executive — Insurance",
    description: "Drive insurance sales across Tirunelveli + nearby districts. Target-driven role with attractive incentives. Local language expertise required (Tamil mandatory). Bike + license a plus.",
    location: "Palayamkottai, Tirunelveli",
    districtId: "tirunelveli", talukId: "tirunelveli_palayamkottai", lat: 8.7269, lng: 77.7311,
    field: "non_it", type: "full_time", experience: "any",
    salaryRange: "₹2.5 LPA + incentives",
    skills: ["Sales", "Tamil", "Insurance", "Field Work"],
    postedAt: daysAgo(6),
  },
  {
    id: "job_008",
    employerId: "emp_lt",
    employerName: "L&T Construction",
    title: "Site Supervisor — Civil",
    description: "Supervise construction site activities for a metro rail project. Diploma/B.E. Civil + 2 yrs site experience. Two-wheeler license required.",
    location: "Mettupalayam, Coimbatore",
    districtId: "coimbatore", talukId: "coimbatore_mettupalayam", lat: 11.2989, lng: 76.9358,
    field: "non_it", type: "contract", experience: "experienced", yearsMin: 2,
    salaryRange: "₹4.5 – 6.5 LPA",
    skills: ["Civil Engineering", "AutoCAD", "Site Management"],
    postedAt: daysAgo(8),
  },
];

interface JobsState {
  jobs: Job[];
  byId: (id: string) => Job | undefined;
  addJob: (input: Omit<Job, "id" | "postedAt">) => Job;
  postedBy: (employerId: string) => Job[];
  deleteJob: (id: string) => void;
}

const STORAGE_KEY = KEYS.jobs;

const seed = (): Job[] => {
  const existing = load<Job[]>(STORAGE_KEY, []);
  if (existing.length === 0) {
    save(STORAGE_KEY, SEED);
    return SEED;
  }
  // Migrate: if any seed-id job lacks districtId, replace seeds + keep employer-posted ones
  const hasOldSeeds = existing.some((j) => j.id.startsWith("job_00") && !j.districtId);
  if (hasOldSeeds) {
    const employerJobs = existing.filter((j) => !j.id.startsWith("job_00"));
    const next = [...SEED, ...employerJobs];
    save(STORAGE_KEY, next);
    return next;
  }
  return existing;
};

export const useJobs = create<JobsState>((set, get) => ({
  jobs: seed(),
  byId: (id) => get().jobs.find((j) => j.id === id),
  addJob: (input) => {
    const job: Job = {
      ...input,
      id: "job_" + Math.random().toString(36).slice(2, 10),
      postedAt: new Date().toISOString(),
    };
    const next = [job, ...get().jobs];
    save(STORAGE_KEY, next);
    set({ jobs: next });
    return job;
  },
  postedBy: (employerId) => get().jobs.filter((j) => j.employerId === employerId),
  deleteJob: (id) => {
    const next = get().jobs.filter((j) => j.id !== id);
    save(STORAGE_KEY, next);
    set({ jobs: next });
  },
}));

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export const FIELD_LABEL: Record<JobField, string> = { it: "IT", non_it: "Non-IT" };
export const TYPE_LABEL: Record<JobType, string> = {
  internship: "Internship",
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};
