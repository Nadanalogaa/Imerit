# Shared Type Contracts

Web (TypeScript) and Mobile (Dart) cannot share code, but they MUST share data shapes
so localStorage (web) and SharedPreferences (mobile) stay interchangeable.

When the backend lands, these become the API JSON contract.

## User
```ts
type Role = "candidate" | "employer" | "admin" | "super_admin";

interface User {
  id: string;            // uuid
  role: Role;
  name: string;
  email: string;
  mobile?: string;
  emailVerified: boolean;
  createdAt: string;     // ISO 8601
}
```

## Candidate Profile
```ts
type CandidateType = "fresher" | "experienced";
type Field = "it" | "non_it";

interface Education {
  level: "10th" | "12th" | "diploma" | "ug" | "pg" | "mphil" | "phd" | "other";
  percentage?: number;
  passedOutYear?: number;
  thesis?: string;       // phd only
  courseName?: string;   // other only
}

interface Experience {
  company: string;
  role: string;
  fromDate: string;      // ISO date
  toDate: string | null; // null = present
}

interface CandidateProfile {
  userId: string;
  photoDataUrl?: string;        // base64 in prototype
  shortTermAmbition: string;    // max 2 lines
  longTermAmbition: string;     // max 2 lines
  type: CandidateType;
  education: Education[];
  preferredLocation?: string;
  alternateMobile?: string;

  // fresher
  internOrJob?: "intern" | "job";
  field?: Field;
  itSpecialization?: string;       // e.g. "AI", "Cybersecurity"
  itLanguages?: string[];          // up to 5
  nonItDepartments?: string[];     // top 3

  // experienced
  yearsOfExperience?: number;
  topSkills?: string[];            // exactly 5
  experiences?: Experience[];

  // template
  selectedTemplateId: TemplateId;
}

type TemplateId = "classic" | "modern" | "creative" | "corporate" | "tech_mono";
```

## Job
```ts
interface Job {
  id: string;
  employerId: string;
  title: string;
  description: string;
  location: string;
  postedAt: string;
}
```

## Subscription
```ts
type SubscriberType = "candidate" | "employer_sme" | "employer_large";

interface SubscriptionPlan {
  id: string;
  type: SubscriberType;
  priceInr: number;
  durationDays: number;
  gstApplicable: boolean;
}

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startedAt: string;
  expiresAt: string;
  paymentRef: string;    // fake in prototype
}
```

## Pricing (hard-coded)
| Plan | Days | Price (₹) | GST |
|---|---|---|---|
| Candidate | 45 | 333 | No |
| Employer SME | 9 / 18 / 27 | 1,701 / 3,402 / 6,804 | Yes |
| Employer Large | 54 / 108 / 216 | 13,608 / 27,216 / 54,432 | Yes |

## Storage Keys (same on web + mobile)
- `itr.theme` → `"dark" | "light"`
- `itr.currentUser` → `User`
- `itr.users` → `User[]`
- `itr.candidateProfiles` → `Record<userId, CandidateProfile>`
- `itr.jobs` → `Job[]`
- `itr.subscriptions` → `Subscription[]`
- `itr.otp.<email>` → `{ code: string, expiresAt: string }` (sessionStorage only)
