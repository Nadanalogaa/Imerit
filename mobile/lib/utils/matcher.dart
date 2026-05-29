import 'package:flutter/material.dart';
import '../store/jobs_provider.dart';
import '../store/profile_provider.dart';
import 'distance.dart';

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

/// Distance to job from candidate's nearest anchor (current or preferred).
double? jobDistanceKm(Job job, CandidateProfile? profile) {
  if (profile == null || job.lat == null || job.lng == null) return null;
  final ds = <double>[];
  final c1 = distanceKm(profile.currentLat, profile.currentLng, job.lat, job.lng);
  if (c1 != null) ds.add(c1);
  final c2 = distanceKm(profile.preferredLat, profile.preferredLng, job.lat, job.lng);
  if (c2 != null) ds.add(c2);
  if (ds.isEmpty) return null;
  return ds.reduce((a, b) => a < b ? a : b);
}

MatchResult matchScore(Job job, CandidateProfile? profile) {
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

  // Skills (35)
  final matched = <String>[];
  final missing = <String>[];
  for (final js in jobSkills) {
    final found = candidateSkills.any((cs) => cs == js || cs.contains(js) || js.contains(cs));
    (found ? matched : missing).add(js);
  }
  final skillsScore = jobSkills.isEmpty ? 0 : ((matched.length / jobSkills.length) * 35).round();

  // Field (25)
  final fieldOk = profile.field != null &&
      ((profile.field == FieldKind.it && job.field == JobField.it) ||
          (profile.field == FieldKind.nonIt && job.field == JobField.nonIt));
  final fieldScore = fieldOk ? 25 : 0;

  // Location (15) — distance-based
  final dist = jobDistanceKm(job, profile);
  var locationScore = 0;
  String? locationLevel;
  if (dist != null) {
    if (dist <= 10) { locationScore = 15; locationLevel = 'very_close'; }
    else if (dist <= 25) { locationScore = 12; locationLevel = 'close'; }
    else if (dist <= 75) { locationScore = 8; locationLevel = 'workable'; }
    else if (dist <= 200) { locationScore = 3; locationLevel = 'far'; }
  }

  // Experience (15)
  var expScore = 0;
  var expOk = false;
  if (job.experience == JobExperience.any) {
    expScore = 15;
    expOk = true;
  } else if (job.experience == JobExperience.fresher && profile.type == CandidateType.fresher) {
    expScore = 15;
    expOk = true;
  } else if (job.experience == JobExperience.experienced && profile.type == CandidateType.experienced) {
    final need = job.yearsMin ?? 0;
    final have = profile.yearsOfExperience ?? 0;
    if (have >= need) {
      expScore = 15;
      expOk = true;
    } else if (have >= (need * 0.7).round()) {
      expScore = 8;
    }
  }

  // Specialization (10)
  var specScore = 0;
  var specMatches = false;
  final haystack = '${job.title} ${job.description}'.toLowerCase();
  if (profile.field == FieldKind.it && profile.itSpecialization != null) {
    if (haystack.contains(_norm(profile.itSpecialization!))) {
      specScore = 10;
      specMatches = true;
    }
  } else if (profile.field == FieldKind.nonIt && profile.nonItDepartments != null) {
    if (profile.nonItDepartments!.any((d) => haystack.contains(_norm(d)))) {
      specScore = 10;
      specMatches = true;
    }
  }

  final total = skillsScore + fieldScore + locationScore + expScore + specScore;
  final band = total >= 75
      ? MatchBand.high
      : total >= 50
          ? MatchBand.medium
          : MatchBand.low;

  final reasons = <String>[];
  if (matched.isNotEmpty) {
    reasons.add(
      'You have ${matched.length} of ${jobSkills.length} required skill${jobSkills.length == 1 ? "" : "s"}',
    );
  }
  if (fieldOk) {
    reasons.add('Same field (${job.field == JobField.it ? "IT" : "Non-IT"})');
  }
  if (dist != null) {
    if (locationLevel == 'very_close') reasons.add('Just $dist km away');
    else if (locationLevel == 'close') reasons.add('$dist km — easy commute');
    else if (locationLevel == 'workable') reasons.add('$dist km — within district / neighbouring');
  }
  if (expOk) {
    reasons.add(job.experience == JobExperience.fresher
        ? 'Open to freshers'
        : job.experience == JobExperience.any
            ? 'Open to all experience levels'
            : 'Your experience level matches');
  }
  if (specMatches) {
    reasons.add(profile.field == FieldKind.it
        ? 'Matches your ${profile.itSpecialization} focus'
        : 'Matches your preferred department');
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
