import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/profile_provider.dart';
import 'distance.dart';

/// Weight table (max 100) — mirrors web/src/lib/matcher.ts.
///
/// Skills + location are the real signal; everything else nudges
/// within-band. A perfect-skill + district-match candidate hits 100.
/// Skills use sqrt weighting so 1-of-3 doesn't crash out — 1 = 29,
/// 2 = 41, 3 = 50.
const int _wSkills = 50;
const int _wLocation = 25;
const int _wField = 10;
const int _wExperience = 10;
const int _wSpecialization = 5;

class MatchResult {
  const MatchResult({
    required this.score,
    required this.band,
    required this.reasons,
    required this.matchedSkills,
    required this.missingSkills,
    this.distanceKm,
  });
  final int score;
  final MatchBand band;
  final List<String> reasons;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final double? distanceKm;
}

enum MatchBand { high, medium, low }

String _norm(String s) => s.toLowerCase().trim();

/// Distance to job from candidate's nearest anchor. Considers the candidate's
/// current-location coords plus each preferred-district centroid (from the
/// locations dataset). Pass `locations` when available so multi-district
/// candidates get scored against every district they'd work in — the closest
/// wins. If `locations` is omitted, only the current-location coords are
/// considered.
double? jobDistanceKm(Job job, CandidateProfile? profile, [LocationsData? locations]) {
  if (profile == null || job.lat == null || job.lng == null) return null;
  final ds = <double>[];
  final c1 = distanceKm(profile.currentLat, profile.currentLng, job.lat, job.lng);
  if (c1 != null) ds.add(c1);
  if (locations != null) {
    for (final id in profile.preferredDistrictIds) {
      final d = locations.districtById(id);
      if (d == null) continue;
      final dist = distanceKm(d.lat, d.lng, job.lat, job.lng);
      if (dist != null) ds.add(dist);
    }
  }
  if (ds.isEmpty) return null;
  return ds.reduce((a, b) => a < b ? a : b);
}

MatchResult matchScore(Job job, CandidateProfile? profile, [LocationsData? locations]) {
  if (profile == null) {
    return const MatchResult(
      score: 0, band: MatchBand.low, reasons: [], matchedSkills: [], missingSkills: [],
    );
  }

  final candidateSkills = <String>[
    ...(profile.itLanguages ?? const <String>[]),
    ...(profile.nonItDepartments ?? const <String>[]),
    ...(profile.topSkills ?? const <String>[]),
  ].map(_norm).toList();

  final jobSkills = job.skills.map(_norm).toList();

  // Skills (W_SKILLS) — sqrt-weighted so partial matches don't crash
  // out. Empty required list means "no gate" → full points.
  final matched = <String>[];
  final missing = <String>[];
  for (final js in jobSkills) {
    final found = candidateSkills.any((cs) => cs == js || cs.contains(js) || js.contains(cs));
    (found ? matched : missing).add(js);
  }
  final skillsScore = jobSkills.isEmpty
      ? _wSkills
      : (math.sqrt(matched.length / jobSkills.length) * _wSkills).round();

  // Field (W_FIELD)
  final fieldOk = profile.field != null &&
      ((profile.field == FieldKind.it && job.field == JobField.it) ||
          (profile.field == FieldKind.nonIt && job.field == JobField.nonIt));
  final fieldScore = fieldOk ? _wField : 0;

  // Location (W_LOCATION) — district-first, distance-fallback so a
  // candidate whose preferredDistricts contains the job's district
  // gets full credit regardless of straight-line km.
  final preferredDistricts = <String>{
    ...profile.preferredDistrictIds,
    if (profile.currentDistrictId != null) profile.currentDistrictId!,
  };
  final jobDistricts = <String>{
    if (job.districtId != null) job.districtId!,
    for (final l in job.extraLocations)
      if (l.districtId != null) l.districtId!,
  };
  final districtMatch = jobDistricts.any(preferredDistricts.contains);
  final dist = jobDistanceKm(job, profile, locations);
  var locationScore = 0;
  String? locationLevel;
  if (districtMatch) {
    locationScore = _wLocation;
    locationLevel = 'district_match';
  } else if (dist != null) {
    if (dist <= 25) { locationScore = 20; locationLevel = 'close'; }
    else if (dist <= 75) { locationScore = 12; locationLevel = 'workable'; }
    else if (dist <= 200) { locationScore = 5; locationLevel = 'far'; }
  }

  // Experience (W_EXPERIENCE)
  var expScore = 0;
  var expOk = false;
  if (job.experience == JobExperience.any) {
    expScore = _wExperience;
    expOk = true;
  } else if (job.experience == JobExperience.fresher && profile.type == CandidateType.fresher) {
    expScore = _wExperience;
    expOk = true;
  } else if (job.experience == JobExperience.experienced && profile.type == CandidateType.experienced) {
    final need = job.yearsMin ?? 0;
    final have = profile.yearsOfExperience ?? 0;
    if (have >= need) {
      expScore = _wExperience;
      expOk = true;
    } else if (have >= (need * 0.7).round()) {
      expScore = (_wExperience * 0.55).round();
    }
  }

  // Specialization (W_SPECIALIZATION) — prefer industry/department
  // structured match, fall back to substring in title/description.
  var specScore = 0;
  var specMatches = false;
  if (profile.industry != null && job.industry != null &&
      _norm(profile.industry!) == _norm(job.industry!)) {
    specScore = _wSpecialization;
    specMatches = true;
  } else if (profile.department != null && job.department != null &&
      _norm(profile.department!) == _norm(job.department!)) {
    specScore = _wSpecialization;
    specMatches = true;
  } else {
    final haystack = '${job.title} ${job.description}'.toLowerCase();
    if (profile.field == FieldKind.it && profile.itSpecialization != null) {
      if (haystack.contains(_norm(profile.itSpecialization!))) {
        specScore = _wSpecialization;
        specMatches = true;
      }
    } else if (profile.field == FieldKind.nonIt && profile.nonItDepartments != null) {
      if (profile.nonItDepartments!.any((d) => haystack.contains(_norm(d)))) {
        specScore = _wSpecialization;
        specMatches = true;
      }
    }
  }

  final total = skillsScore + fieldScore + locationScore + expScore + specScore;
  final band = total >= 75
      ? MatchBand.high
      : total >= 50
          ? MatchBand.medium
          : MatchBand.low;

  final reasons = <String>[];
  if (jobSkills.isEmpty) {
    reasons.add("Employer didn't list required skills");
  } else if (matched.length == jobSkills.length) {
    reasons.add('All ${jobSkills.length} required skill${jobSkills.length == 1 ? "" : "s"} match');
  } else if (matched.isNotEmpty) {
    reasons.add(
      'You have ${matched.length} of ${jobSkills.length} required skill${jobSkills.length == 1 ? "" : "s"}',
    );
  }
  if (fieldOk) {
    reasons.add('Same field (${job.field == JobField.it ? "IT" : "Non-IT"})');
  }
  if (locationLevel == 'district_match') {
    reasons.add("Job is in a district you're open to");
  } else if (dist != null) {
    if (locationLevel == 'close') {
      reasons.add('$dist km — easy commute');
    } else if (locationLevel == 'workable') {
      reasons.add('$dist km — within district / neighbouring');
    }
  }
  if (expOk) {
    reasons.add(job.experience == JobExperience.fresher
        ? 'Open to freshers'
        : job.experience == JobExperience.any
            ? 'Open to all experience levels'
            : 'Your experience level matches');
  }
  if (specMatches) {
    reasons.add(
      profile.industry != null && job.industry != null &&
              _norm(profile.industry!) == _norm(job.industry!)
          ? 'Same industry (${job.industry})'
          : profile.department != null && job.department != null &&
                  _norm(profile.department!) == _norm(job.department!)
              ? 'Same department (${job.department})'
              : profile.field == FieldKind.it
                  ? 'Matches your ${profile.itSpecialization} focus'
                  : 'Matches your preferred department',
    );
  }

  return MatchResult(
    score: total,
    band: band,
    reasons: reasons,
    matchedSkills: matched,
    missingSkills: missing,
    distanceKm: dist,
  );
}

class BandColors {
  const BandColors(this.bg, this.text, this.ring);
  final Color bg;
  final Color text;
  final Color ring;
}

const bandColors = {
  MatchBand.high: BandColors(Color(0xFFD1FAE5), Color(0xFF047857), Color(0x4D10B981)),
  MatchBand.medium: BandColors(Color(0xFFFEF3C7), Color(0xFFB45309), Color(0x4DF59E0B)),
  MatchBand.low: BandColors(Color(0xFFF4F4F5), Color(0xFF52525B), Color(0x4D71717A)),
};
