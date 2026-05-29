import type { Job } from "../store/jobs";
import type { CandidateProfile } from "../store/profile";
import { distanceKm } from "./distance";

export interface MatchBreakdown {
  skills: { score: number; max: number; matched: string[]; missing: string[] };
  field: { score: number; max: number; matches: boolean };
  location: { score: number; max: number; distanceKm: number | null; level: "very_close" | "close" | "workable" | "far" | "none" };
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
 * Distance-based location score (15 pts total).
 * Pick the nearest of the candidate's current location or preferred location.
 */
function locationScoreFromDistance(
  job: Job,
  profile: CandidateProfile
): { score: number; distanceKm: number | null; level: MatchBreakdown["location"]["level"] } {
  const jobLoc = job.lat != null && job.lng != null ? { lat: job.lat, lng: job.lng } : null;
  if (!jobLoc) return { score: 0, distanceKm: null, level: "none" };

  const candidates: Array<{ lat: number; lng: number }> = [];
  if (profile.currentLat != null && profile.currentLng != null) {
    candidates.push({ lat: profile.currentLat, lng: profile.currentLng });
  }
  if (profile.preferredLat != null && profile.preferredLng != null) {
    candidates.push({ lat: profile.preferredLat, lng: profile.preferredLng });
  }
  if (candidates.length === 0) return { score: 0, distanceKm: null, level: "none" };

  const distances = candidates
    .map((c) => distanceKm(c, jobLoc))
    .filter((d): d is number => d != null);
  if (distances.length === 0) return { score: 0, distanceKm: null, level: "none" };

  const d = Math.min(...distances);
  let score = 0;
  let level: MatchBreakdown["location"]["level"] = "far";
  if (d <= 10) { score = 15; level = "very_close"; }
  else if (d <= 25) { score = 12; level = "close"; }
  else if (d <= 75) { score = 8; level = "workable"; }
  else if (d <= 200) { score = 3; level = "far"; }
  else { score = 0; level = "far"; }
  return { score, distanceKm: d, level };
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
  ].map(norm);

  const jobSkills = job.skills.map(norm);

  // Skills overlap (35 pts)
  const matched: string[] = [];
  const missing: string[] = [];
  for (const js of jobSkills) {
    const found = candidateSkills.some(
      (cs) => cs === js || cs.includes(js) || js.includes(cs)
    );
    (found ? matched : missing).push(js);
  }
  const skillsScore = jobSkills.length === 0
    ? 0
    : Math.round((matched.length / jobSkills.length) * 35);

  // Field match (25 pts)
  const fieldOk = !!profile.field && profile.field === job.field;
  const fieldScore = fieldOk ? 25 : 0;

  // Location match (15 pts) — distance-based
  const locRes = locationScoreFromDistance(job, profile);
  const locationScore = locRes.score;
  const locationLevel = locRes.level;
  const distance = locRes.distanceKm;

  // Experience fit (15 pts)
  let expScore = 0;
  let expOk = false;
  if (job.experience === "any") {
    expScore = 15;
    expOk = true;
  } else if (job.experience === "fresher" && profile.type === "fresher") {
    expScore = 15;
    expOk = true;
  } else if (job.experience === "experienced" && profile.type === "experienced") {
    const need = job.yearsMin ?? 0;
    const have = profile.yearsOfExperience ?? 0;
    if (have >= need) {
      expScore = 15;
      expOk = true;
    } else if (have >= Math.max(0, need * 0.7)) {
      expScore = 8;
    }
  }

  // Specialization match (10 pts)
  let specScore = 0;
  let specMatches = false;
  const haystack = `${job.title} ${job.description}`.toLowerCase();
  if (profile.field === "it" && profile.itSpecialization) {
    if (haystack.includes(norm(profile.itSpecialization))) {
      specScore = 10;
      specMatches = true;
    }
  } else if (profile.field === "non_it" && profile.nonItDepartments) {
    if (profile.nonItDepartments.some((d) => haystack.includes(norm(d)))) {
      specScore = 10;
      specMatches = true;
    }
  }

  const total = skillsScore + fieldScore + locationScore + expScore + specScore;
  const band: MatchResult["band"] = total >= 75 ? "high" : total >= 50 ? "medium" : "low";

  const reasons: string[] = [];
  if (matched.length > 0) {
    reasons.push(
      `You have ${matched.length} of ${jobSkills.length} required skill${jobSkills.length === 1 ? "" : "s"}`
    );
  }
  if (fieldOk) {
    reasons.push(`Same field (${job.field === "it" ? "IT" : "Non-IT"})`);
  }
  if (distance != null) {
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
      profile.field === "it"
        ? `Matches your ${profile.itSpecialization} focus`
        : "Matches your preferred department"
    );
  }

  return {
    score: total,
    band,
    breakdown: {
      skills: { score: skillsScore, max: 35, matched, missing },
      field: { score: fieldScore, max: 25, matches: fieldOk },
      location: { score: locationScore, max: 15, distanceKm: distance, level: locationLevel },
      experience: { score: expScore, max: 15, ok: expOk },
      specialization: { score: specScore, max: 10, matches: specMatches },
    },
    reasons,
  };
}

function emptyBreakdown(): MatchBreakdown {
  return {
    skills: { score: 0, max: 35, matched: [], missing: [] },
    field: { score: 0, max: 25, matches: false },
    location: { score: 0, max: 15, distanceKm: null, level: "none" },
    experience: { score: 0, max: 15, ok: false },
    specialization: { score: 0, max: 10, matches: false },
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
