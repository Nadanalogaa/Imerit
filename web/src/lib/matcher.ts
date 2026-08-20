import type { Job } from "../store/jobs";
import type { CandidateProfile } from "../store/profile";
import { distanceKm } from "./distance";
import { canonicalize, skillsMatch } from "./skillSynonyms";

/**
 * Scoring philosophy: skills + location are the real signal. Everything
 * else nudges within-band. A candidate whose preferred district contains
 * the job location AND who has every required skill hits 100. Missing
 * skills sting less-than-linearly (sqrt) so a partial-skill fit still
 * lands in the "high" band when everything else lines up.
 *
 * Weight table (max 100):
 *   Skills            50   sqrt(matched/required) * 50 — softened so
 *                          1-of-3 doesn't crash out to 17%; 1 required
 *                          skill matched = 29 pts, 2 = 41, 3 = 50.
 *   Location          25   Full 25 if job's district ∈ candidate's
 *                          preferredDistricts OR = currentDistrictId.
 *                          Falls back to distance-in-km if no district
 *                          overlap: ≤25km 20, ≤75 12, ≤200 5, else 0.
 *                          Multi-location jobs match if ANY location's
 *                          district matches (mirrors browse filter).
 *   Field IT/Non-IT   10
 *   Experience fit    10
 *   Specialization     5   Job title/description substring OR the
 *                          candidate's chosen industry/department
 *                          matching the job's industry/department.
 */
const W_SKILLS = 50;
const W_LOCATION = 25;
const W_FIELD = 10;
const W_EXPERIENCE = 10;
const W_SPECIALIZATION = 5;

export interface MatchBreakdown {
  skills: { score: number; max: number; matched: string[]; missing: string[] };
  field: { score: number; max: number; matches: boolean };
  location: { score: number; max: number; distanceKm: number | null; level: "district_match" | "very_close" | "close" | "workable" | "far" | "none" };
  experience: { score: number; max: number; ok: boolean };
  specialization: { score: number; max: number; matches: boolean };
}

export interface MatchResult {
  score: number;
  band: "high" | "medium" | "low";
  breakdown: MatchBreakdown;
  reasons: string[];
}

const norm = (s: string) => s.toLowerCase().trim();

/**
 * Location scoring — district-first, distance as a fallback.
 *
 *   1. If the job's district (primary OR any extra JobLocation) is in
 *      the candidate's preferredDistricts / currentDistrictId → full
 *      W_LOCATION. This is what a candidate means when they say
 *      "I'm open to Chennai."
 *   2. Otherwise scale by straight-line km from the nearest anchor.
 *
 * Distance is still returned (for UI chips) even when the district
 * shortcut fires — computed as 0 in the district-match case.
 */
function locationScore(
  job: Job,
  profile: CandidateProfile
): { score: number; distanceKm: number | null; level: MatchBreakdown["location"]["level"] } {
  // ---- District overlap (preferred rule) ----
  const preferred = new Set<string>();
  for (const id of profile.preferredDistricts ?? []) preferred.add(id);
  if (profile.currentDistrictId) preferred.add(profile.currentDistrictId);

  const jobDistricts = new Set<string>();
  if (job.districtId) jobDistricts.add(job.districtId);
  for (const l of job.extraLocations ?? []) {
    if (l.districtId) jobDistricts.add(l.districtId);
  }

  const hasDistrictMatch = [...jobDistricts].some((d) => preferred.has(d));
  if (hasDistrictMatch) {
    // Optional: report the km distance for UI even when the district
    // shortcut fires, so cards still show "5 km away".
    const dKm = nearestDistanceKm(job, profile);
    return { score: W_LOCATION, distanceKm: dKm, level: "district_match" };
  }

  // ---- Distance fallback (no district overlap) ----
  const d = nearestDistanceKm(job, profile);
  if (d == null) return { score: 0, distanceKm: null, level: "none" };
  if (d <= 25) return { score: 20, distanceKm: d, level: "close" };
  if (d <= 75) return { score: 12, distanceKm: d, level: "workable" };
  if (d <= 200) return { score: 5, distanceKm: d, level: "far" };
  return { score: 0, distanceKm: d, level: "far" };
}

function nearestDistanceKm(job: Job, profile: CandidateProfile): number | null {
  const points: Array<{ lat: number; lng: number }> = [];
  if (job.lat != null && job.lng != null) points.push({ lat: job.lat, lng: job.lng });
  for (const l of job.extraLocations ?? []) {
    if (l.lat != null && l.lng != null) points.push({ lat: l.lat, lng: l.lng });
  }
  if (points.length === 0) return null;

  const anchors: Array<{ lat: number; lng: number }> = [];
  if (profile.currentLat != null && profile.currentLng != null) {
    anchors.push({ lat: profile.currentLat, lng: profile.currentLng });
  }
  if (profile.preferredLat != null && profile.preferredLng != null) {
    anchors.push({ lat: profile.preferredLat, lng: profile.preferredLng });
  }
  if (anchors.length === 0) return null;

  let best: number | null = null;
  for (const p of points) {
    for (const a of anchors) {
      const d = distanceKm(a, p);
      if (d == null) continue;
      if (best == null || d < best) best = d;
    }
  }
  return best;
}

export function matchScore(job: Job, profile: CandidateProfile | undefined): MatchResult {
  if (!profile) {
    return {
      score: 0,
      band: "low",
      breakdown: emptyBreakdown(),
      reasons: [],
    };
  }

  const candidateSkills = [
    ...(profile.itLanguages ?? []),
    ...(profile.nonItDepartments ?? []),
    ...(profile.topSkills ?? []),
  ];

  const jobSkills = job.skills;

  // Skills overlap (W_SKILLS pts). Uses word-boundary + synonym matching
  // from skillSynonyms.ts (fixes the old "JavaScript matches Java" bug).
  //
  // Non-linear (sqrt) weighting so partial matches don't crash out —
  // 1-of-3 = 29/50 (58%), 2-of-3 = 41/50 (82%), 3-of-3 = 50/50 (100%).
  // Linear weighting would give 17/33/50 which flatters no-one.
  const matched: string[] = [];
  const missing: string[] = [];
  for (const js of jobSkills) {
    const found = candidateSkills.some((cs) => skillsMatch(cs, js));
    (found ? matched : missing).push(canonicalize(js));
  }
  const skillsScore = jobSkills.length === 0
    ? W_SKILLS // no requirements posted → everyone's "skill-eligible"
    : Math.round(Math.sqrt(matched.length / jobSkills.length) * W_SKILLS);

  // Field IT/Non-IT (W_FIELD pts)
  const fieldOk = !!profile.field && profile.field === job.field;
  const fieldScore = fieldOk ? W_FIELD : 0;

  // Location (W_LOCATION pts) — district-first, distance-fallback.
  const locRes = locationScore(job, profile);
  const locationScoreValue = locRes.score;
  const locationLevel = locRes.level;
  const distance = locRes.distanceKm;

  // Experience fit (W_EXPERIENCE pts)
  let expScore = 0;
  let expOk = false;
  if (job.experience === "any") {
    expScore = W_EXPERIENCE;
    expOk = true;
  } else if (job.experience === "fresher" && profile.type === "fresher") {
    expScore = W_EXPERIENCE;
    expOk = true;
  } else if (job.experience === "experienced" && profile.type === "experienced") {
    const need = job.yearsMin ?? 0;
    const have = profile.yearsOfExperience ?? 0;
    if (have >= need) {
      expScore = W_EXPERIENCE;
      expOk = true;
    } else if (have >= Math.max(0, need * 0.7)) {
      expScore = Math.round(W_EXPERIENCE * 0.55);
    }
  }

  // Specialization / industry-department match (W_SPECIALIZATION pts).
  //
  // Prefers a structured match on the new Industry / Department fields
  // (both sides now capture them from the Naukri-style taxonomy) and
  // falls back to the old substring hunt in title/description so
  // legacy jobs that never got tagged still surface.
  let specScore = 0;
  let specMatches = false;
  if (profile.industry && job.industry && norm(profile.industry) === norm(job.industry)) {
    specScore = W_SPECIALIZATION;
    specMatches = true;
  } else if (profile.department && job.department && norm(profile.department) === norm(job.department)) {
    specScore = W_SPECIALIZATION;
    specMatches = true;
  } else {
    const haystack = `${job.title} ${job.description}`.toLowerCase();
    if (profile.field === "it" && profile.itSpecialization) {
      if (haystack.includes(norm(profile.itSpecialization))) {
        specScore = W_SPECIALIZATION;
        specMatches = true;
      }
    } else if (profile.field === "non_it" && profile.nonItDepartments) {
      if (profile.nonItDepartments.some((d) => haystack.includes(norm(d)))) {
        specScore = W_SPECIALIZATION;
        specMatches = true;
      }
    }
  }

  const total = skillsScore + fieldScore + locationScoreValue + expScore + specScore;
  const band: MatchResult["band"] = total >= 75 ? "high" : total >= 50 ? "medium" : "low";

  const reasons: string[] = [];
  if (jobSkills.length === 0) {
    reasons.push("Employer didn't list required skills");
  } else if (matched.length === jobSkills.length) {
    reasons.push(`All ${jobSkills.length} required skill${jobSkills.length === 1 ? "" : "s"} match`);
  } else if (matched.length > 0) {
    reasons.push(
      `You have ${matched.length} of ${jobSkills.length} required skill${jobSkills.length === 1 ? "" : "s"}`
    );
  }
  if (fieldOk) {
    reasons.push(`Same field (${job.field === "it" ? "IT" : "Non-IT"})`);
  }
  if (locationLevel === "district_match") {
    reasons.push(distance != null && distance <= 30 ? "Job is in your preferred district" : "Job is in a district you're open to");
  } else if (distance != null) {
    if (locationLevel === "very_close") reasons.push(`Just ${distance} km away`);
    else if (locationLevel === "close") reasons.push(`${distance} km — easy commute`);
    else if (locationLevel === "workable") reasons.push(`${distance} km — within district / neighbouring`);
  }
  if (expOk) {
    reasons.push(
      job.experience === "fresher"
        ? "Open to freshers"
        : job.experience === "any"
        ? "Open to all experience levels"
        : "Your experience level matches"
    );
  }
  if (specMatches) {
    reasons.push(
      profile.industry && job.industry && norm(profile.industry) === norm(job.industry)
        ? `Same industry (${job.industry})`
        : profile.department && job.department && norm(profile.department) === norm(job.department)
        ? `Same department (${job.department})`
        : profile.field === "it"
        ? `Matches your ${profile.itSpecialization} focus`
        : "Matches your preferred department",
    );
  }

  return {
    score: total,
    band,
    breakdown: {
      skills: { score: skillsScore, max: W_SKILLS, matched, missing },
      field: { score: fieldScore, max: W_FIELD, matches: fieldOk },
      location: { score: locationScoreValue, max: W_LOCATION, distanceKm: distance, level: locationLevel },
      experience: { score: expScore, max: W_EXPERIENCE, ok: expOk },
      specialization: { score: specScore, max: W_SPECIALIZATION, matches: specMatches },
    },
    reasons,
  };
}

function emptyBreakdown(): MatchBreakdown {
  return {
    skills: { score: 0, max: W_SKILLS, matched: [], missing: [] },
    field: { score: 0, max: W_FIELD, matches: false },
    location: { score: 0, max: W_LOCATION, distanceKm: null, level: "none" },
    experience: { score: 0, max: W_EXPERIENCE, ok: false },
    specialization: { score: 0, max: W_SPECIALIZATION, matches: false },
  };
}

/** Helper: distance from a candidate profile to a job (km). */
export function jobDistanceKm(
  job: Job,
  profile: CandidateProfile | undefined,
  anchor: "current" | "preferred" | "any" = "any"
): number | null {
  if (!profile || job.lat == null || job.lng == null) return null;
  const j = { lat: job.lat, lng: job.lng };
  const candidates: Array<{ lat: number; lng: number }> = [];
  if (anchor !== "preferred" && profile.currentLat != null && profile.currentLng != null) {
    candidates.push({ lat: profile.currentLat, lng: profile.currentLng });
  }
  if (anchor !== "current" && profile.preferredLat != null && profile.preferredLng != null) {
    candidates.push({ lat: profile.preferredLat, lng: profile.preferredLng });
  }
  if (candidates.length === 0) return null;
  const distances = candidates.map((c) => distanceKm(c, j)).filter((d): d is number => d != null);
  return distances.length === 0 ? null : Math.min(...distances);
}

export const BAND_COLORS: Record<MatchResult["band"], { bg: string; text: string; ring: string }> = {
  high: {
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
  },
  medium: {
    bg: "bg-amber-100 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30",
  },
  low: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    ring: "ring-zinc-500/20",
  },
};
