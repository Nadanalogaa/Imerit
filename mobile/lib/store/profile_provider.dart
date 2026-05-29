import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  });

  final EducationLevel level;
  final bool enabled;
  final double? percentage;
  final int? passedOutYear;
  final String? thesis;
  final String? courseName;
  final String? institution;

  Map<String, dynamic> toJson() => {
        'level': educationLevelKey(level),
        'enabled': enabled,
        if (percentage != null) 'percentage': percentage,
        if (passedOutYear != null) 'passedOutYear': passedOutYear,
        if (thesis != null) 'thesis': thesis,
        if (courseName != null) 'courseName': courseName,
        if (institution != null) 'institution': institution,
      };

  static Education fromJson(Map<String, dynamic> j) => Education(
        level: educationLevelFromKey(j['level'] as String),
        enabled: (j['enabled'] as bool?) ?? false,
        percentage: (j['percentage'] as num?)?.toDouble(),
        passedOutYear: j['passedOutYear'] as int?,
        thesis: j['thesis'] as String?,
        courseName: j['courseName'] as String?,
        institution: j['institution'] as String?,
      );
}

@immutable
class WorkExperience {
  const WorkExperience({
    required this.company,
    required this.role,
    required this.fromDate,
    this.toDate,
  });

  final String company;
  final String role;
  final String fromDate;
  final String? toDate;

  Map<String, dynamic> toJson() => {
        'company': company,
        'role': role,
        'fromDate': fromDate,
        'toDate': toDate,
      };

  static WorkExperience fromJson(Map<String, dynamic> j) => WorkExperience(
        company: j['company'] as String,
        role: j['role'] as String,
        fromDate: j['fromDate'] as String,
        toDate: j['toDate'] as String?,
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
    this.preferredDistrictId,
    this.preferredTalukId,
    this.preferredLat,
    this.preferredLng,
    this.preferredPincode,
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
    this.selectedTemplateId,
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
  final String? preferredDistrictId;
  final String? preferredTalukId;
  final double? preferredLat;
  final double? preferredLng;
  final String? preferredPincode;
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
  final String? selectedTemplateId;
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
    String? preferredDistrictId,
    String? preferredTalukId,
    double? preferredLat,
    double? preferredLng,
    String? preferredPincode,
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
    String? selectedTemplateId,
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
        preferredDistrictId: preferredDistrictId ?? this.preferredDistrictId,
        preferredTalukId: preferredTalukId ?? this.preferredTalukId,
        preferredLat: preferredLat ?? this.preferredLat,
        preferredLng: preferredLng ?? this.preferredLng,
        preferredPincode: preferredPincode ?? this.preferredPincode,
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
        if (preferredDistrictId != null) 'preferredDistrictId': preferredDistrictId,
        if (preferredTalukId != null) 'preferredTalukId': preferredTalukId,
        if (preferredLat != null) 'preferredLat': preferredLat,
        if (preferredLng != null) 'preferredLng': preferredLng,
        if (preferredPincode != null) 'preferredPincode': preferredPincode,
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
        'selectedTemplateId': selectedTemplateId,
        'updatedAt': updatedAt,
      };

  static CandidateProfile fromJson(Map<String, dynamic> j) => CandidateProfile(
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
        preferredDistrictId: j['preferredDistrictId'] as String?,
        preferredTalukId: j['preferredTalukId'] as String?,
        preferredLat: (j['preferredLat'] as num?)?.toDouble(),
        preferredLng: (j['preferredLng'] as num?)?.toDouble(),
        preferredPincode: j['preferredPincode'] as String?,
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
        selectedTemplateId: j['selectedTemplateId'] as String?,
        updatedAt: j['updatedAt'] as String? ?? DateTime.now().toIso8601String(),
      );
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
}

final profileProvider =
    NotifierProvider<ProfileNotifier, Map<String, CandidateProfile>>(
        ProfileNotifier.new);
