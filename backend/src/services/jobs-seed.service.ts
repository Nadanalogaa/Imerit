import { JobExperience, JobField, JobStatus, JobType, ModerationStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

/**
 * Boot-time seeding for the 8 demo jobs that the frontend used to ship
 * hardcoded. Runs only when the `jobs` table is completely empty so we
 * don't duplicate after the first real employer signs up.
 *
 * To anchor the FK constraint we also create a single demo-employer user
 * if one doesn't exist yet — its email is well-known and the row gets
 * `emailVerified` so it can't be confused with a candidate-style signup.
 */
const DEMO_EMPLOYER_EMAIL = "demo@itamilrecruit.com";

interface JobSeed {
  employerName: string;
  title: string;
  description: string;
  location: string;
  districtId: string;
  talukId: string;
  lat: number;
  lng: number;
  field: JobField;
  type: JobType;
  experience: JobExperience;
  yearsMin?: number;
  salaryRange?: string;
  skills: string[];
  postedDaysAgo: number;
}

const SEED_JOBS: JobSeed[] = [
  { employerName: "Zoho Corporation", title: "Junior React Developer", description: "Join our product engineering team in Chennai. You'll work on the next-gen Zoho CRM frontend, contribute to our component library, and learn from senior engineers.", location: "Sholinganallur, Chennai", districtId: "chennai", talukId: "chennai_sholinganallur", lat: 12.9010, lng: 80.2279, field: JobField.IT, type: JobType.FULL_TIME, experience: JobExperience.FRESHER, salaryRange: "₹3.5 – 5 LPA", skills: ["React", "TypeScript", "HTML/CSS", "Git"], postedDaysAgo: 2 },
  { employerName: "Freshworks", title: "Senior Backend Engineer (Node.js)", description: "Help architect the next generation of Freshdesk's customer engagement platform. 5+ years of Node.js + microservices experience. Strong in MySQL, Redis, AWS.", location: "Coimbatore North", districtId: "coimbatore", talukId: "coimbatore_north", lat: 11.0510, lng: 76.9558, field: JobField.IT, type: JobType.FULL_TIME, experience: JobExperience.EXPERIENCED, yearsMin: 5, salaryRange: "₹18 – 32 LPA", skills: ["Node.js", "MySQL", "AWS", "Microservices", "Redis"], postedDaysAgo: 4 },
  { employerName: "Cognizant Madurai", title: "HR Executive — Recruitment", description: "Manage end-to-end recruitment for SME clients across Tamil Nadu. Excellent English + Tamil communication required.", location: "Madurai South", districtId: "madurai", talukId: "madurai_madurai_south", lat: 9.9000, lng: 78.1167, field: JobField.NON_IT, type: JobType.FULL_TIME, experience: JobExperience.ANY, salaryRange: "₹3 – 5 LPA", skills: ["Recruitment", "Communication", "English", "Tamil"], postedDaysAgo: 5 },
  { employerName: "Tech Mahindra BPS", title: "Customer Support — Voice Process", description: "Excellent English communication with neutral accent required. Night shift (US clients). Fresh graduates welcome. Free transport, performance incentives.", location: "Perambur, Chennai", districtId: "chennai", talukId: "chennai_perambur", lat: 13.1149, lng: 80.2329, field: JobField.NON_IT, type: JobType.FULL_TIME, experience: JobExperience.FRESHER, salaryRange: "₹2.5 – 3.8 LPA", skills: ["Voice Process", "English", "Customer Service"], postedDaysAgo: 1 },
  { employerName: "Zoho Trichy", title: "AI/ML Internship — 6 months", description: "6-month research internship working on multilingual NLP for Indian languages. Stipend ₹35K/month. Final-year B.Tech / M.Tech students preferred. Conversion based on performance.", location: "Srirangam, Tiruchirappalli", districtId: "tiruchirappalli", talukId: "tiruchirappalli_srirangam", lat: 10.8589, lng: 78.6890, field: JobField.IT, type: JobType.INTERNSHIP, experience: JobExperience.FRESHER, salaryRange: "₹35K / month", skills: ["Python", "PyTorch", "NLP", "Research"], postedDaysAgo: 7 },
  { employerName: "KPMG India", title: "Junior Finance Analyst", description: "Join our finance advisory team. CA Inter/CS or B.Com graduates. Strong Excel + financial modeling. Exposure to top-tier clients.", location: "T. Nagar, Chennai", districtId: "chennai", talukId: "chennai_t_nagar", lat: 13.0418, lng: 80.2341, field: JobField.NON_IT, type: JobType.FULL_TIME, experience: JobExperience.FRESHER, salaryRange: "₹4 – 6 LPA", skills: ["Excel", "Financial Modeling", "Accounting"], postedDaysAgo: 3 },
  { employerName: "Aviva BPO Tirunelveli", title: "Sales Executive — Insurance", description: "Drive insurance sales across Tirunelveli + nearby districts. Target-driven role with attractive incentives. Local language expertise required (Tamil mandatory). Bike + license a plus.", location: "Palayamkottai, Tirunelveli", districtId: "tirunelveli", talukId: "tirunelveli_palayamkottai", lat: 8.7269, lng: 77.7311, field: JobField.NON_IT, type: JobType.FULL_TIME, experience: JobExperience.ANY, salaryRange: "₹2.5 LPA + incentives", skills: ["Sales", "Tamil", "Insurance", "Field Work"], postedDaysAgo: 6 },
  { employerName: "L&T Construction", title: "Site Supervisor — Civil", description: "Supervise construction site activities for a metro rail project. Diploma/B.E. Civil + 2 yrs site experience. Two-wheeler license required.", location: "Mettupalayam, Coimbatore", districtId: "coimbatore", talukId: "coimbatore_mettupalayam", lat: 11.2989, lng: 76.9358, field: JobField.NON_IT, type: JobType.CONTRACT, experience: JobExperience.EXPERIENCED, yearsMin: 2, salaryRange: "₹4.5 – 6.5 LPA", skills: ["Civil Engineering", "AutoCAD", "Site Management"], postedDaysAgo: 8 },
];

export async function ensureDemoJobs(): Promise<void> {
  const count = await prisma.job.count();
  if (count > 0) return; // Don't reseed once anyone has posted a real job.

  const employer = await ensureDemoEmployer();

  for (const seed of SEED_JOBS) {
    const postedAt = new Date(Date.now() - seed.postedDaysAgo * 24 * 60 * 60 * 1000);
    const { employerName, postedDaysAgo: _ignore, ...rest } = seed;
    void _ignore;
    await prisma.job.create({
      data: {
        ...rest,
        employerId: employer.id,
        employerName,
        skills: seed.skills,
        status: JobStatus.ACTIVE,
        moderationStatus: ModerationStatus.APPROVED,
        postedAt,
      },
    });
  }
  logger.info({ count: SEED_JOBS.length }, "Seeded demo jobs");
}

async function ensureDemoEmployer() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMPLOYER_EMAIL } });
  if (existing) return existing;
  const created = await prisma.user.create({
    data: {
      role: UserRole.EMPLOYER,
      email: DEMO_EMPLOYER_EMAIL,
      name: "Demo Companies",
      emailVerified: true,
    },
  });
  logger.info({ email: DEMO_EMPLOYER_EMAIL }, "Seeded demo employer (anchor for demo jobs)");
  return created;
}
