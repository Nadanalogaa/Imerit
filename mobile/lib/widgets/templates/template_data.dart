import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../../store/auth_provider.dart';
import '../../store/profile_provider.dart';

/// Shared data + helpers for all CV templates.
class TemplateData {
  TemplateData({required this.user, required this.profile});
  final User user;
  final CandidateProfile profile;

  String get fullName => user.name.isEmpty ? 'Your Name' : user.name;

  String get initials {
    final parts = user.name.trim().split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
  }

  String get shortRole {
    if (profile.type == CandidateType.experienced) {
      if (profile.experiences != null && profile.experiences!.isNotEmpty) {
        final current = profile.experiences!.firstWhere(
          (e) => e.toDate == null,
          orElse: () => profile.experiences!.first,
        );
        return current.role.isEmpty ? 'Professional' : current.role;
      }
      return '${profile.yearsOfExperience ?? "—"} years experience';
    }
    if (profile.type == CandidateType.fresher) {
      if (profile.field == FieldKind.it && profile.itSpecialization != null) {
        return 'Aspiring ${profile.itSpecialization}';
      }
      if (profile.field == FieldKind.nonIt &&
          profile.nonItDepartments != null &&
          profile.nonItDepartments!.isNotEmpty) {
        return 'Aspiring ${profile.nonItDepartments!.first}';
      }
      return profile.internOrJob == 'intern' ? 'Intern / Trainee' : 'Fresher';
    }
    return 'Candidate';
  }

  List<String> get highlightedSkills {
    if (profile.type == CandidateType.experienced) return profile.topSkills ?? [];
    if (profile.type == CandidateType.fresher) {
      if (profile.field == FieldKind.it) return profile.itLanguages ?? [];
      if (profile.field == FieldKind.nonIt) return profile.nonItDepartments ?? [];
    }
    return [];
  }

  List<Education> get enabledEducation =>
      profile.education.where((e) => e.enabled).toList();

  static const Map<EducationLevel, String> eduLabels = {
    EducationLevel.tenth: '10th Standard',
    EducationLevel.twelfth: '12th Standard',
    EducationLevel.diploma: 'Diploma',
    EducationLevel.ug: 'Undergraduate',
    EducationLevel.pg: 'Postgraduate',
    EducationLevel.mphil: 'M.Phil',
    EducationLevel.phd: 'Ph.D',
    EducationLevel.other: 'Other',
  };

  static String eduLabel(Education e) =>
      e.level == EducationLevel.other && e.courseName != null
          ? e.courseName!
          : (eduLabels[e.level] ?? '—');

  static String formatPeriod(String from, String? to) {
    if (from.isEmpty) return '';
    String fmt(String s) {
      final parts = s.split('-');
      if (parts.isEmpty) return s;
      final y = int.tryParse(parts[0]) ?? 0;
      if (parts.length == 1) return parts[0];
      final m = int.tryParse(parts[1]) ?? 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[(m - 1).clamp(0, 11)]} $y';
    }
    return '${fmt(from)} – ${to == null ? "Present" : fmt(to)}';
  }
}

Uint8List? photoBytes(String? dataUrl) {
  if (dataUrl == null || dataUrl.isEmpty) return null;
  final i = dataUrl.indexOf(',');
  try {
    return base64Decode(i >= 0 ? dataUrl.substring(i + 1) : dataUrl);
  } catch (_) {
    return null;
  }
}

class TemplateMeta {
  const TemplateMeta(this.id, this.label, this.desc);
  final String id;
  final String label;
  final String desc;
}

const templateMetas = [
  TemplateMeta('classic', 'Classic Executive', 'Formal · navy & cream · serif'),
  TemplateMeta('modern', 'Modern Minimal', 'Apple-clean · two-column'),
  TemplateMeta('creative', 'Creative Bold', 'Gradient hero · color blocks'),
  TemplateMeta('corporate', 'Corporate Sidebar', 'LinkedIn-style sidebar'),
  TemplateMeta('tech_mono', 'Tech / Dark Mono', 'Terminal vibe · neon accents'),
];

Widget photoOrInitials({
  required TemplateData data,
  required double size,
  required BoxDecoration backgroundDecoration,
  required TextStyle initialsStyle,
  BorderRadiusGeometry? borderRadius,
}) {
  final bytes = photoBytes(data.profile.photoDataUrl);
  if (bytes != null) {
    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.circular(size),
      child: Image.memory(
        bytes,
        width: size,
        height: size,
        fit: BoxFit.cover,
      ),
    );
  }
  return Container(
    width: size,
    height: size,
    decoration: backgroundDecoration,
    alignment: Alignment.center,
    child: Text(data.initials.isEmpty ? '—' : data.initials, style: initialsStyle),
  );
}
