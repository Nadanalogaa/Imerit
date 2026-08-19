import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/profile_api.dart';
import '../storage/storage.dart';

enum CandidateType { fresher, experienced }

enum FieldKind { it, nonIt }

enum EducationLevel {
  tenth,
  twelfth,
  diploma,
  ug,
  pg,
  mphil,
  phd,
  other,
}

String educationLevelKey(EducationLevel l) {
  switch (l) {
    case EducationLevel.tenth:
      return '10th';
    case EducationLevel.twelfth:
      return '12th';
    case EducationLevel.diploma:
      return 'diploma';
    case EducationLevel.ug:
      return 'ug';
    case EducationLevel.pg:
      return 'pg';
    case EducationLevel.mphil:
      return 'mphil';
    case EducationLevel.phd:
      return 'phd';
    case EducationLevel.other:
      return 'other';
  }
}

EducationLevel educationLevelFromKey(String key) {
  switch (key) {
    case '10th':
      return EducationLevel.tenth;
    case '12th':
      return EducationLevel.twelfth;
    case 'diploma':
      return EducationLevel.diploma;
    case 'ug':
      return EducationLevel.ug;
    case 'pg':
      return EducationLevel.pg;
    case 'mphil':
      return EducationLevel.mphil;
    case 'phd':
      return EducationLevel.phd;
    default:
      return EducationLevel.other;
  }
}

@immutable
class Education {
  const Education({
    required this.level,
    this.enabled = false,
    this.percentage,
    this.passedOutYear,
    this.thesis,
    this.courseName,
    this.institution,
    this.districtId,
    this.pincode,
    this.degreeName,
    this.specialization,
  });

  final EducationLevel level;
  final bool enabled;
  final double? percentage;
  final int? passedOutYear;
  final String? thesis;
  final String? courseName;
  final String? institution;
  // Per-education location — matches the web `Education.districtId` +
  // `pincode` columns (2026-06 migration). Candidates can now say WHERE they
  // studied each level (10th in Madurai, UG in Chennai, etc.).
  final String? districtId;
  final String? pincode;
  // Post-secondary detail — mirror of the web `Education.degreeName` +
  // `specialization` columns (2026-08 migration, backend commit 7ae828c).
  // Only surfaced by the UI for diploma/ug/pg/mphil/phd levels; 10th /
  // 12th / other keep these null.
  final String? degreeName;
  final String? specialization;

  Education copyWith({
    bool? enabled,
    double? percentage,
    int? passedOutYear,
    String? thesis,
    String? courseName,
    String? institution,
    String? districtId,
    String? pincode,
    String? degreeName,
    String? specialization,
  }) =>
      Education(
        level: level,
        enabled: enabled ?? this.enabled,
        percentage: percentage ?? this.percentage,
        passedOutYear: passedOutYear ?? this.passedOutYear,
        thesis: thesis ?? this.thesis,
        courseName: courseName ?? this.courseName,
        institution: institution ?? this.institution,
        districtId: districtId ?? this.districtId,
        pincode: pincode ?? this.pincode,
        degreeName: degreeName ?? this.degreeName,
        specialization: specialization ?? this.specialization,
      );

  Map<String, dynamic> toJson() => {
        'level': educationLevelKey(level),
        'enabled': enabled,
        if (percentage != null) 'percentage': percentage,
        if (passedOutYear != null) 'passedOutYear': passedOutYear,
        if (thesis != null) 'thesis': thesis,
        if (courseName != null) 'courseName': courseName,
        if (institution != null) 'institution': institution,
        if (districtId != null) 'districtId': districtId,
        if (pincode != null) 'pincode': pincode,
        if (degreeName != null) 'degreeName': degreeName,
        if (specialization != null) 'specialization': specialization,
      };

  static Education fromJson(Map<String, dynamic> j) => Education(
        level: educationLevelFromKey(j['level'] as String),
        enabled: (j['enabled'] as bool?) ?? false,
        percentage: (j['percentage'] as num?)?.toDouble(),
        passedOutYear: j['passedOutYear'] as int?,
        thesis: j['thesis'] as String?,
        courseName: j['courseName'] as String?,
        institution: j['institution'] as String?,
        districtId: j['districtId'] as String?,
        pincode: j['pincode'] as String?,
        degreeName: j['degreeName'] as String?,
        specialization: j['specialization'] as String?,
      );
}

/// Portfolio / social link a candidate can pin on their profile. Free-form
/// label + URL — mirrors the web `CandidateProfile.links` JSON column.
@immutable
class ProfileLink {
  const ProfileLink({required this.label, required this.url});
  final String label;
  final String url;

  Map<String, dynamic> toJson() => {'label': label, 'url': url};

  static ProfileLink fromJson(Map<String, dynamic> j) =>
      ProfileLink(label: j['label'] as String, url: j['url'] as String);
}

/// Project a candidate worked on during a specific work stint. Matches the
/// web `ExperienceProject` table (2026-06 migration). Stored inline on
/// `WorkExperience.projects` so the UI can render an accordion under each
/// company.
@immutable
class ExperienceProject {
  const ExperienceProject({
    required this.name,
    this.description,
    this.skills = const [],
    this.url,
  });

  final String name;
  final String? description;
  final List<String> skills;
  final String? url;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null) 'description': description,
        'skills': skills,
        if (url != null) 'url': url,
      };

  static ExperienceProject fromJson(Map<String, dynamic> j) => ExperienceProject(
        name: j['name'] as String,
        description: j['description'] as String?,
        skills: (j['skills'] as List<dynamic>? ?? const []).cast<String>(),
        url: j['url'] as String?,
      );
}

@immutable
class WorkExperience {
  const WorkExperience({
    required this.company,
    required this.role,
    required this.fromDate,
    this.toDate,
    this.projects = const [],
  });

  final String company;
  final String role;
  final String fromDate;
  final String? toDate;
  final List<ExperienceProject> projects;

  WorkExperience copyWith({
    String? company,
    String? role,
    String? fromDate,
    String? toDate,
    bool clearToDate = false,
    List<ExperienceProject>? projects,
  }) =>
      WorkExperience(
        company: company ?? this.company,
        role: role ?? this.role,
        fromDate: fromDate ?? this.fromDate,
        toDate: clearToDate ? null : (toDate ?? this.toDate),
        projects: projects ?? this.projects,
      );

  Map<String, dynamic> toJson() => {
        'company': company,
        'role': role,
        'fromDate': fromDate,
        'toDate': toDate,
        'projects': projects.map((p) => p.toJson()).toList(),
      };

  static WorkExperience fromJson(Map<String, dynamic> j) => WorkExperience(
        company: j['company'] as String,
        role: j['role'] as String,
        fromDate: j['fromDate'] as String,
        toDate: j['toDate'] as String?,
        projects: (j['projects'] as List<dynamic>? ?? const [])
            .map((e) => ExperienceProject.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Standalone / personal project on the candidate profile — distinct from
/// [ExperienceProject] which is scoped to a specific WorkExperience row.
/// Mirrors `ApiCandidateProject` on the backend (2026-08 migration).
@immutable
class CandidateProject {
  const CandidateProject({
    required this.name,
    this.description,
    this.skills = const [],
    this.role,
    this.showcaseUrl,
    this.startedAt,
    this.endedAt,
  });

  final String name;
  final String? description;
  final List<String> skills;
  final String? role;
  final String? showcaseUrl;
  final String? startedAt;
  final String? endedAt;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null) 'description': description,
        'skills': skills,
        if (role != null) 'role': role,
        if (showcaseUrl != null) 'showcaseUrl': showcaseUrl,
        if (startedAt != null) 'startedAt': startedAt,
        if (endedAt != null) 'endedAt': endedAt,
      };

  static CandidateProject fromJson(Map<String, dynamic> j) => CandidateProject(
        name: j['name'] as String,
        description: j['description'] as String?,
        skills: (j['skills'] as List<dynamic>? ?? const []).cast<String>(),
        role: j['role'] as String?,
        showcaseUrl: j['showcaseUrl'] as String?,
        startedAt: j['startedAt'] as String?,
        endedAt: j['endedAt'] as String?,
      );
}

/// Certification / credential the candidate wants to advertise. Mirrors
/// `ApiCertification` on the backend.
@immutable
class Certification {
  const Certification({
    required this.name,
    this.issuer,
    this.issuedYear,
    this.expiryYear,
    this.credentialId,
    this.credentialUrl,
  });

  final String name;
  final String? issuer;
  final int? issuedYear;
  final int? expiryYear;
  final String? credentialId;
  final String? credentialUrl;

  Map<String, dynamic> toJson() => {
        'name': name,
        if (issuer != null) 'issuer': issuer,
        if (issuedYear != null) 'issuedYear': issuedYear,
        if (expiryYear != null) 'expiryYear': expiryYear,
        if (credentialId != null) 'credentialId': credentialId,
        if (credentialUrl != null) 'credentialUrl': credentialUrl,
      };

  static Certification fromJson(Map<String, dynamic> j) => Certification(
        name: j['name'] as String,
        issuer: j['issuer'] as String?,
        issuedYear: (j['issuedYear'] as num?)?.toInt(),
        expiryYear: (j['expiryYear'] as num?)?.toInt(),
        credentialId: j['credentialId'] as String?,
        credentialUrl: j['credentialUrl'] as String?,
      );
}

@immutable
class CandidateProfile {
  const CandidateProfile({
    required this.userId,
    this.photoDataUrl,
    this.alternateMobile,
    this.preferredLocation,
    this.currentDistrictId,
    this.currentTalukId,
    this.currentLat,
    this.currentLng,
    this.currentPincode,
    this.currentStreet,
    this.preferredDistrictIds = const [],
    this.shortTermAmbition,
    this.longTermAmbition,
    this.type,
    this.internOrJob,
    this.field,
    this.itSpecialization,
    this.itLanguages,
    this.nonItDepartments,
    this.yearsOfExperience,
    this.topSkills,
    this.experiences,
    this.education = const [],
    this.links = const [],
    this.projects = const [],
    this.certifications = const [],
    this.industry,
    this.department,
    this.cvUrl,
    this.cvFileName,
    this.selectedTemplateId,
    this.moderationStatus,
    this.moderationNotes,
    required this.updatedAt,
  });

  final String userId;
  final String? photoDataUrl;
  final String? alternateMobile;
  final String? preferredLocation;
  final String? currentDistrictId;
  final String? currentTalukId;
  final double? currentLat;
  final double? currentLng;
  final String? currentPincode;
  final String? currentStreet;
  // Multi-select preferred districts. Replaces the old single
  // `preferredDistrictId` / `preferredTalukId` / `preferredPincode` fields
  // (2026-06 migration). Candidates now say "I'll work in Chennai, Salem, or
  // Madurai" without picking a specific taluk/pincode.
  final List<String> preferredDistrictIds;
  final String? shortTermAmbition;
  final String? longTermAmbition;
  final CandidateType? type;
  final String? internOrJob;
  final FieldKind? field;
  final String? itSpecialization;
  final List<String>? itLanguages;
  final List<String>? nonItDepartments;
  final int? yearsOfExperience;
  final List<String>? topSkills;
  final List<WorkExperience>? experiences;
  final List<Education> education;
  // Portfolio / social links (LinkedIn, GitHub, Behance, custom "Other").
  // Free-form list keyed on `[[profile-links]]` in web.
  final List<ProfileLink> links;
  /// Standalone personal projects (freshers + experienced) — distinct from
  /// [WorkExperience.projects] which are role-scoped.
  final List<CandidateProject> projects;
  /// Certifications the candidate wants to advertise.
  final List<Certification> certifications;
  /// Naukri-style industry tag (kIndustriesIt / kIndustriesNonIt).
  /// See `utils/industry_taxonomy.dart`. Nullable — candidates who
  /// haven't set one yet see the placeholder.
  final String? industry;
  /// Naukri-style department tag (kDepartments). Nullable.
  final String? department;
  /// Base64 data URL of the uploaded CV (PDF / DOC / DOCX, ≤5 MB).
  /// `data:application/pdf;base64,...` — same shape web writes.
  final String? cvUrl;
  /// Original filename so the download button shows something readable.
  final String? cvFileName;
  final String? selectedTemplateId;
  /// Server-set moderation state: PENDING (default when profile is
  /// first submitted), APPROVED (visible to employers), REJECTED
  /// (needs update — see moderationNotes). Nullable while the API
  /// hasn't populated it yet (fresh signup, offline cache).
  final String? moderationStatus;
  final String? moderationNotes;
  final String updatedAt;

  CandidateProfile copyWith({
    String? photoDataUrl,
    String? alternateMobile,
    String? preferredLocation,
    String? currentDistrictId,
    String? currentTalukId,
    double? currentLat,
    double? currentLng,
    String? currentPincode,
    String? currentStreet,
    List<String>? preferredDistrictIds,
    String? shortTermAmbition,
    String? longTermAmbition,
    CandidateType? type,
    String? internOrJob,
    FieldKind? field,
    String? itSpecialization,
    List<String>? itLanguages,
    List<String>? nonItDepartments,
    int? yearsOfExperience,
    List<String>? topSkills,
    List<WorkExperience>? experiences,
    List<Education>? education,
    List<ProfileLink>? links,
    List<CandidateProject>? projects,
    List<Certification>? certifications,
    String? industry,
    String? department,
    String? cvUrl,
    String? cvFileName,
    String? selectedTemplateId,
    bool clearCv = false,
  }) =>
      CandidateProfile(
        userId: userId,
        photoDataUrl: photoDataUrl ?? this.photoDataUrl,
        alternateMobile: alternateMobile ?? this.alternateMobile,
        preferredLocation: preferredLocation ?? this.preferredLocation,
        currentDistrictId: currentDistrictId ?? this.currentDistrictId,
        currentTalukId: currentTalukId ?? this.currentTalukId,
        currentLat: currentLat ?? this.currentLat,
        currentLng: currentLng ?? this.currentLng,
        currentPincode: currentPincode ?? this.currentPincode,
        currentStreet: currentStreet ?? this.currentStreet,
        preferredDistrictIds: preferredDistrictIds ?? this.preferredDistrictIds,
        shortTermAmbition: shortTermAmbition ?? this.shortTermAmbition,
        longTermAmbition: longTermAmbition ?? this.longTermAmbition,
        type: type ?? this.type,
        internOrJob: internOrJob ?? this.internOrJob,
        field: field ?? this.field,
        itSpecialization: itSpecialization ?? this.itSpecialization,
        itLanguages: itLanguages ?? this.itLanguages,
        nonItDepartments: nonItDepartments ?? this.nonItDepartments,
        yearsOfExperience: yearsOfExperience ?? this.yearsOfExperience,
        topSkills: topSkills ?? this.topSkills,
        experiences: experiences ?? this.experiences,
        education: education ?? this.education,
        links: links ?? this.links,
        projects: projects ?? this.projects,
        certifications: certifications ?? this.certifications,
        industry: industry ?? this.industry,
        department: department ?? this.department,
        cvUrl: clearCv ? null : (cvUrl ?? this.cvUrl),
        cvFileName: clearCv ? null : (cvFileName ?? this.cvFileName),
        selectedTemplateId: selectedTemplateId ?? this.selectedTemplateId,
        updatedAt: DateTime.now().toIso8601String(),
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'photoDataUrl': photoDataUrl,
        'alternateMobile': alternateMobile,
        'preferredLocation': preferredLocation,
        if (currentDistrictId != null) 'currentDistrictId': currentDistrictId,
        if (currentTalukId != null) 'currentTalukId': currentTalukId,
        if (currentLat != null) 'currentLat': currentLat,
        if (currentLng != null) 'currentLng': currentLng,
        if (currentPincode != null) 'currentPincode': currentPincode,
        if (currentStreet != null) 'currentStreet': currentStreet,
        'preferredDistrictIds': preferredDistrictIds,
        'shortTermAmbition': shortTermAmbition,
        'longTermAmbition': longTermAmbition,
        if (type != null) 'type': type == CandidateType.fresher ? 'fresher' : 'experienced',
        'internOrJob': internOrJob,
        if (field != null) 'field': field == FieldKind.it ? 'it' : 'non_it',
        'itSpecialization': itSpecialization,
        'itLanguages': itLanguages,
        'nonItDepartments': nonItDepartments,
        'yearsOfExperience': yearsOfExperience,
        'topSkills': topSkills,
        'experiences': experiences?.map((e) => e.toJson()).toList(),
        'education': education.map((e) => e.toJson()).toList(),
        'links': links.map((l) => l.toJson()).toList(),
        'projects': projects.map((p) => p.toJson()).toList(),
        'certifications': certifications.map((c) => c.toJson()).toList(),
        if (industry != null) 'industry': industry,
        if (department != null) 'department': department,
        if (cvUrl != null) 'cvUrl': cvUrl,
        if (cvFileName != null) 'cvFileName': cvFileName,
        'selectedTemplateId': selectedTemplateId,
        'updatedAt': updatedAt,
      };

  static CandidateProfile fromJson(Map<String, dynamic> j) {
    // Legacy migration: rows written before the multi-district refactor
    // stored a single `preferredDistrictId`. Promote it to a one-element
    // list so the new UI sees a populated set instead of falling back to
    // empty.
    final rawList = j['preferredDistrictIds'] as List<dynamic>?;
    List<String> prefIds;
    if (rawList != null) {
      prefIds = rawList.cast<String>();
    } else {
      final legacy = j['preferredDistrictId'] as String?;
      prefIds = legacy != null ? [legacy] : const [];
    }
    return CandidateProfile(
      userId: j['userId'] as String,
      photoDataUrl: j['photoDataUrl'] as String?,
      alternateMobile: j['alternateMobile'] as String?,
      preferredLocation: j['preferredLocation'] as String?,
      currentDistrictId: j['currentDistrictId'] as String?,
      currentTalukId: j['currentTalukId'] as String?,
      currentLat: (j['currentLat'] as num?)?.toDouble(),
      currentLng: (j['currentLng'] as num?)?.toDouble(),
      currentPincode: j['currentPincode'] as String?,
      currentStreet: j['currentStreet'] as String?,
      preferredDistrictIds: prefIds,
      shortTermAmbition: j['shortTermAmbition'] as String?,
      longTermAmbition: j['longTermAmbition'] as String?,
      type: j['type'] == 'experienced'
          ? CandidateType.experienced
          : (j['type'] == 'fresher' ? CandidateType.fresher : null),
      internOrJob: j['internOrJob'] as String?,
      field: j['field'] == 'non_it'
          ? FieldKind.nonIt
          : (j['field'] == 'it' ? FieldKind.it : null),
      itSpecialization: j['itSpecialization'] as String?,
      itLanguages: (j['itLanguages'] as List<dynamic>?)?.cast<String>(),
      nonItDepartments: (j['nonItDepartments'] as List<dynamic>?)?.cast<String>(),
      yearsOfExperience: j['yearsOfExperience'] as int?,
      topSkills: (j['topSkills'] as List<dynamic>?)?.cast<String>(),
      experiences: (j['experiences'] as List<dynamic>?)
          ?.map((e) => WorkExperience.fromJson(e as Map<String, dynamic>))
          .toList(),
      education: (j['education'] as List<dynamic>? ?? const [])
          .map((e) => Education.fromJson(e as Map<String, dynamic>))
          .toList(),
      links: (j['links'] as List<dynamic>? ?? const [])
          .map((e) => ProfileLink.fromJson(e as Map<String, dynamic>))
          .toList(),
      projects: (j['projects'] as List<dynamic>? ?? const [])
          .map((e) => CandidateProject.fromJson(e as Map<String, dynamic>))
          .toList(),
      certifications: (j['certifications'] as List<dynamic>? ?? const [])
          .map((e) => Certification.fromJson(e as Map<String, dynamic>))
          .toList(),
      industry: j['industry'] as String?,
      department: j['department'] as String?,
      cvUrl: j['cvUrl'] as String?,
      cvFileName: j['cvFileName'] as String?,
      selectedTemplateId: j['selectedTemplateId'] as String?,
      updatedAt: j['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }
}

CandidateProfile _empty(String userId) => CandidateProfile(
      userId: userId,
      updatedAt: DateTime.now().toIso8601String(),
    );

class ProfileNotifier extends Notifier<Map<String, CandidateProfile>> {
  @override
  Map<String, CandidateProfile> build() {
    final raw = Storage.instance.getString(StorageKeys.candidateProfiles);
    if (raw == null) return {};
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return map.map(
      (k, v) => MapEntry(k, CandidateProfile.fromJson(v as Map<String, dynamic>)),
    );
  }

  void _persist(Map<String, CandidateProfile> map) {
    Storage.instance.setString(
      StorageKeys.candidateProfiles,
      jsonEncode(map.map((k, v) => MapEntry(k, v.toJson()))),
    );
  }

  CandidateProfile of(String userId) => state[userId] ?? _empty(userId);

  void update(String userId, CandidateProfile next) {
    final newMap = {...state, userId: next};
    state = newMap;
    _persist(newMap);
  }

  // ============================================================
  // API integration — hydrate + save the signed-in user's profile
  // ============================================================

  /// Map a backend profile row → local CandidateProfile.
  CandidateProfile _fromApi(String userId, Map<String, dynamic> api) {
    final field = api['field'] as String?;
    final type = api['type'] as String?;
    return CandidateProfile(
      userId: userId,
      photoDataUrl: api['photoUrl'] as String?,
      alternateMobile: api['alternateMobile'] as String?,
      preferredLocation: api['preferredLocation'] as String?,
      currentDistrictId: api['currentDistrictId'] as String?,
      currentTalukId: api['currentTalukId'] as String?,
      currentLat: (api['currentLat'] as num?)?.toDouble(),
      currentLng: (api['currentLng'] as num?)?.toDouble(),
      currentPincode: api['currentPincode'] as String?,
      currentStreet: api['currentStreet'] as String?,
      preferredDistrictIds: ((api['preferredDistricts'] as List?) ?? const []).cast<String>(),
      shortTermAmbition: api['shortTermAmbition'] as String?,
      longTermAmbition: api['longTermAmbition'] as String?,
      type: type == 'FRESHER' ? CandidateType.fresher : type == 'EXPERIENCED' ? CandidateType.experienced : null,
      internOrJob: (api['internOrJob'] as String?)?.toLowerCase(),
      field: field == 'IT' ? FieldKind.it : field == 'NON_IT' ? FieldKind.nonIt : null,
      itSpecialization: api['itSpecialization'] as String?,
      itLanguages: (api['itLanguages'] as List?)?.cast<String>(),
      nonItDepartments: (api['nonItDepartments'] as List?)?.cast<String>(),
      yearsOfExperience: api['yearsOfExperience'] as int?,
      topSkills: (api['topSkills'] as List?)?.cast<String>(),
      industry: api['industry'] as String?,
      department: api['department'] as String?,
      cvUrl: api['cvUrl'] as String?,
      cvFileName: api['cvFileName'] as String?,
      projects: ((api['projects'] as List?) ?? const [])
          .map((e) => CandidateProject.fromJson(e as Map<String, dynamic>))
          .toList(),
      certifications: ((api['certifications'] as List?) ?? const [])
          .map((e) => Certification.fromJson(e as Map<String, dynamic>))
          .toList(),
      selectedTemplateId: (api['selectedTemplateId'] as String?)?.toLowerCase(),
      moderationStatus: api['moderationStatus'] as String?,
      moderationNotes: api['moderationNotes'] as String?,
      updatedAt: api['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
    );
  }

  /// Pull /candidate/profile from the server + hydrate local state so
  /// the candidate dashboard shows the moderation pill + up-to-date
  /// fields. Silent no-op offline. Call this on CandidateDashboardPage
  /// mount. Backend returns `{ profile }` only — the userId is passed
  /// by the caller from the auth provider.
  Future<void> fetchMine(String userId) async {
    if (!_apiOn) return;
    try {
      final res = await _api.getMine();
      final profile = _fromApi(userId, res['profile'] as Map<String, dynamic>);
      final next = {...state, userId: profile};
      state = next;
      _persist(next);
    } catch (_) {
      // Silent fallback — keep the local cache visible.
    }
  }

  /// PATCH /profiles/me with a subset of fields. `patch` uses local
  /// field names; this helper maps to the backend's expected wire
  /// shape. Server merges + returns the full profile.
  Future<void> saveAsync(String userId, Map<String, dynamic> localPatch) async {
    if (!_apiOn) return;
    // Translate local field names → backend field names + enum casing.
    final api = <String, dynamic>{};
    localPatch.forEach((k, v) {
      switch (k) {
        case 'photoDataUrl': api['photoUrl'] = v; break;
        case 'field':
          if (v == FieldKind.it) api['field'] = 'IT';
          else if (v == FieldKind.nonIt) api['field'] = 'NON_IT';
          break;
        case 'type':
          if (v == CandidateType.fresher) api['type'] = 'FRESHER';
          else if (v == CandidateType.experienced) api['type'] = 'EXPERIENCED';
          break;
        case 'internOrJob': api['internOrJob'] = (v as String?)?.toUpperCase(); break;
        case 'preferredDistrictIds': api['preferredDistricts'] = v; break;
        case 'selectedTemplateId': api['selectedTemplateId'] = (v as String?)?.toUpperCase(); break;
        default: api[k] = v;
      }
    });
    try {
      final row = await _api.patchMine(api);
      final profile = _fromApi(userId, row);
      final next = {...state, userId: profile};
      state = next;
      _persist(next);
    } catch (_) {
      // Keep local cache; next fetchMine() reconciles.
    }
  }

  /// Replace the standalone-projects list locally + PUT the full list
  /// to the server. Mirrors web's `setProjects`. Local update wins; the
  /// server call is fire-and-forget so the UI never blocks on network.
  void setProjects(String userId, List<CandidateProject> projects) {
    final current = of(userId);
    update(userId, current.copyWith(projects: projects));
    if (_apiOn) {
      _api
          .replaceProjects(projects.map((p) => p.toJson()).toList())
          .catchError((Object _) {});
    }
  }

  /// Same shape as [setProjects] but for the certifications list.
  void setCertifications(String userId, List<Certification> certifications) {
    final current = of(userId);
    update(userId, current.copyWith(certifications: certifications));
    if (_apiOn) {
      _api
          .replaceCertifications(certifications.map((c) => c.toJson()).toList())
          .catchError((Object _) {});
    }
  }

  bool get _apiOn => apiEnabled;
  ProfileApi get _api => ProfileApi.instance;
}

final profileProvider =
    NotifierProvider<ProfileNotifier, Map<String, CandidateProfile>>(
        ProfileNotifier.new);
