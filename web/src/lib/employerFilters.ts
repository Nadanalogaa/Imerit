import type { CandidateProfile, CandidateType, Field, EducationLevel } from "../store/profile";
import type { Job } from "../store/jobs";
import type { District } from "../store/locations";
import { distanceKm } from "./distance";

/**
 * Ordering options for the employer candidate list. `skill_match` ranks by
 * how well each candidate's skills line up with the required-skills filter
 * (with a stable tie-break on freshness); falls through to alphabetical
 * when no skills are set.
 */
export type CandidateSort = "skill_match" | "recent" | "alphabetical";

/**
 * The full employer candidate-search filter. Mirrors the mobile
 * `CandidateFilterState` in `mobile/lib/widgets/candidate_filter_sheet.dart`
 * so the two platforms behave identically. `undefined` / empty list on any
 * facet means "no filter for this facet".
 */
export interface CandidateFilterState {
  districtIds: string[];
  field?: Field;
  candidateType?: CandidateType;
  /** Only meaningful when `candidateType === "experienced"`. */
  yearsMin?: number;
  yearsMax?: number;
  educationLevels: EducationLevel[];
  /** AND semantics — candidate must have ALL. */
  skills: string[];
  /**
   * Distance filter — employer picks one of their active job postings and
   * a radius (km). Candidate must have any anchor (current or preferred-
   * district centroid) within `maxDistanceKm` of that job's coords.
   */
  nearJobId?: string;
  maxDistanceKm?: number;
  sort: CandidateSort;
}

export const emptyCandidateFilter: CandidateFilterState = {
  districtIds: [],
  educationLevels: [],
  skills: [],
  sort: "skill_match",
};

export function isDefaultFilter(f: CandidateFilterState): boolean {
  return (
    f.districtIds.length === 0 &&
    !f.field &&
    !f.candidateType &&
    f.yearsMin == null &&
    f.yearsMax == null &&
    f.educationLevels.length === 0 &&
    f.skills.length === 0 &&
    !f.nearJobId
  );
}

export function activeFacetCount(f: CandidateFilterState): number {
  return (
    (f.districtIds.length > 0 ? 1 : 0) +
    (f.field ? 1 : 0) +
    (f.candidateType ? 1 : 0) +
    (f.yearsMin != null || f.yearsMax != null ? 1 : 0) +
    (f.educationLevels.length > 0 ? 1 : 0) +
    (f.skills.length > 0 ? 1 : 0) +
    (f.nearJobId ? 1 : 0)
  );
}

/**
 * True when the profile has any skill in its topSkills / itLanguages /
 * nonItDepartments / itSpecialization list that fuzzily matches `needed`.
 * Case-insensitive substring match either way so "React" and "React.js"
 * are treated as the same skill.
 */
function hasSkill(profile: CandidateProfile, needed: string): boolean {
  const n = needed.toLowerCase();
  const pool = [
    ...(profile.topSkills ?? []),
    ...(profile.itLanguages ?? []),
    ...(profile.nonItDepartments ?? []),
    profile.itSpecialization ?? "",
  ].filter(Boolean);
  return pool.some((have) => {
    const h = have.toLowerCase();
    return h.includes(n) || n.includes(h);
  });
}

/**
 * Distance in km from a fixed point to the candidate's nearest known
 * anchor (current location, or the centroid of any preferred district).
 * `null` when no anchor is available.
 */
function closestAnchorKm(
  profile: CandidateProfile,
  districts: District[],
  point: { lat: number; lng: number },
): number | null {
  const ds: number[] = [];
  if (profile.currentLat != null && profile.currentLng != null) {
    const d = distanceKm({ lat: profile.currentLat, lng: profile.currentLng }, point);
    if (d != null) ds.push(d);
  }
  for (const id of profile.preferredDistricts ?? []) {
    const dRec = districts.find((x) => x.id === id);
    if (!dRec) continue;
    const d = distanceKm({ lat: dRec.lat, lng: dRec.lng }, point);
    if (d != null) ds.push(d);
  }
  if (ds.length === 0) return null;
  return Math.min(...ds);
}

/**
 * Does `profile` pass all currently-active facets? Distance is skipped
 * silently when `districts` or `nearJob` isn't supplied — the filter is
 * inert rather than universally-rejecting when its dependencies aren't
 * around. Same semantics as the mobile version.
 */
export function matchesFilter(
  profile: CandidateProfile,
  f: CandidateFilterState,
  ctx?: { districts?: District[]; nearJob?: Job | null },
): boolean {
  if (f.districtIds.length > 0) {
    const inPreferred = (profile.preferredDistricts ?? []).some((id) => f.districtIds.includes(id));
    const inCurrent = profile.currentDistrictId != null && f.districtIds.includes(profile.currentDistrictId);
    if (!inPreferred && !inCurrent) return false;
  }
  if (f.field && profile.field !== f.field) return false;
  if (f.candidateType && profile.type !== f.candidateType) return false;
  if (f.yearsMin != null || f.yearsMax != null) {
    const y = profile.yearsOfExperience ?? -1;
    if (f.yearsMin != null && y < f.yearsMin) return false;
    if (f.yearsMax != null && y > f.yearsMax) return false;
  }
  if (f.educationLevels.length > 0) {
    const has = (profile.education ?? []).some((e) => e.enabled && f.educationLevels.includes(e.level));
    if (!has) return false;
  }
  if (f.skills.length > 0) {
    for (const needed of f.skills) {
      if (!hasSkill(profile, needed)) return false;
    }
  }
  if (f.nearJobId && f.maxDistanceKm != null && ctx?.districts && ctx?.nearJob) {
    const { lat, lng } = ctx.nearJob;
    if (lat == null || lng == null) return false;
    const closest = closestAnchorKm(profile, ctx.districts, { lat, lng });
    if (closest == null || closest > f.maxDistanceKm) return false;
  }
  return true;
}

/**
 * 0.0 – 1.0 — fraction of required skills the candidate demonstrably has.
 * Returns 1.0 when no skills are required, so callers can sort by this
 * value unconditionally (everyone's a "full match" against no requirement).
 */
export function skillMatchScore(profile: CandidateProfile, f: CandidateFilterState): number {
  if (f.skills.length === 0) return 1;
  let matched = 0;
  for (const needed of f.skills) {
    if (hasSkill(profile, needed)) matched++;
  }
  return matched / f.skills.length;
}
