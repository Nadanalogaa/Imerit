import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/jobs_api.dart';
import '../api/staff_api.dart';
import '../storage/storage.dart';

enum JobField { it, nonIt }

/// Mirrors the backend `JobType` enum (8 values). Kept in the same order as
/// the web wizard's `JOB_TYPE_OPTIONS` so the UX matches across surfaces.
enum JobType {
  internshipTraining,
  apprentice,
  fullTime,
  partTime,
  gigDelivery,
  contract,
  consultant,
  freelancer,
}

enum JobExperience { fresher, experienced, any }

String _fieldKey(JobField f) => f == JobField.it ? 'it' : 'non_it';
JobField _fieldFrom(String? s) => s == 'it' ? JobField.it : JobField.nonIt;

String _typeKey(JobType t) => switch (t) {
      JobType.internshipTraining => 'internship_training',
      JobType.apprentice => 'apprentice',
      JobType.fullTime => 'full_time',
      JobType.partTime => 'part_time',
      JobType.gigDelivery => 'gig_delivery',
      JobType.contract => 'contract',
      JobType.consultant => 'consultant',
      JobType.freelancer => 'freelancer',
    };

JobType _typeFrom(String? s) => switch (s) {
      // Current keys.
      'internship_training' => JobType.internshipTraining,
      'apprentice' => JobType.apprentice,
      'part_time' => JobType.partTime,
      'gig_delivery' => JobType.gigDelivery,
      'contract' => JobType.contract,
      'consultant' => JobType.consultant,
      'freelancer' => JobType.freelancer,
      'full_time' => JobType.fullTime,
      // Legacy fallback (pre-8-type migration seed data).
      'internship' => JobType.internshipTraining,
      _ => JobType.fullTime,
    };

String _expKey(JobExperience e) => switch (e) {
      JobExperience.fresher => 'fresher',
      JobExperience.experienced => 'experienced',
      JobExperience.any => 'any',
    };
JobExperience _expFrom(String? s) => switch (s) {
      'fresher' => JobExperience.fresher,
      'experienced' => JobExperience.experienced,
      _ => JobExperience.any,
    };

const fieldLabel = {
  JobField.it: 'IT',
  JobField.nonIt: 'Non-IT',
};

const typeLabel = {
  JobType.internshipTraining: 'Internship / Training',
  JobType.apprentice: 'Apprentice',
  JobType.fullTime: 'Full-time',
  JobType.partTime: 'Part-time',
  JobType.gigDelivery: 'Gig / Delivery',
  JobType.contract: 'Contract',
  JobType.consultant: 'Consultant',
  JobType.freelancer: 'Freelancer',
};

/// Short label used on tight job cards where "Internship / Training" would
/// clip. Two-word max.
const typeLabelShort = {
  JobType.internshipTraining: 'Intern',
  JobType.apprentice: 'Apprentice',
  JobType.fullTime: 'Full-time',
  JobType.partTime: 'Part-time',
  JobType.gigDelivery: 'Gig',
  JobType.contract: 'Contract',
  JobType.consultant: 'Consultant',
  JobType.freelancer: 'Freelancer',
};

/// Per-type icon + tone. Kept aligned with the web wizard's
/// `JOB_TYPE_OPTIONS` colours so employers see the same visual language
/// on both platforms.
const typeIcon = {
  JobType.internshipTraining: Icons.school_rounded,
  JobType.apprentice: Icons.handyman_rounded,
  JobType.fullTime: Icons.badge_rounded,
  JobType.partTime: Icons.schedule_rounded,
  JobType.gigDelivery: Icons.delivery_dining_rounded,
  JobType.contract: Icons.assignment_rounded,
  JobType.consultant: Icons.psychology_rounded,
  JobType.freelancer: Icons.rocket_launch_rounded,
};

const typeTone = {
  JobType.internshipTraining: Color(0xFF0EA5E9), // sky
  JobType.apprentice: Color(0xFFF59E0B), // amber
  JobType.fullTime: Color(0xFF8B5CF6), // violet
  JobType.partTime: Color(0xFF10B981), // emerald
  JobType.gigDelivery: Color(0xFFE11D48), // rose
  JobType.contract: Color(0xFFF97316), // brand
  JobType.consultant: Color(0xFF6366F1), // indigo
  JobType.freelancer: Color(0xFF14B8A6), // teal
};

/// Mirrors the backend `JOB_BENEFITS` enum in `backend/src/schemas/jobs.schemas.ts`.
/// Order matters — matches the wizard picker on web.
enum JobBenefit {
  pf,
  esi,
  healthInsurance,
  wfh,
  hybrid,
  paidLeave,
  flexibleHours,
  freeMeals,
  transport,
  annualBonus,
  stockOptions,
  learningStipend,
}

String benefitKey(JobBenefit b) => switch (b) {
      JobBenefit.pf => 'pf',
      JobBenefit.esi => 'esi',
      JobBenefit.healthInsurance => 'health_insurance',
      JobBenefit.wfh => 'wfh',
      JobBenefit.hybrid => 'hybrid',
      JobBenefit.paidLeave => 'paid_leave',
      JobBenefit.flexibleHours => 'flexible_hours',
      JobBenefit.freeMeals => 'free_meals',
      JobBenefit.transport => 'transport',
      JobBenefit.annualBonus => 'annual_bonus',
      JobBenefit.stockOptions => 'stock_options',
      JobBenefit.learningStipend => 'learning_stipend',
    };

JobBenefit? benefitFromKey(String? s) => switch (s) {
      'pf' => JobBenefit.pf,
      'esi' => JobBenefit.esi,
      'health_insurance' => JobBenefit.healthInsurance,
      'wfh' => JobBenefit.wfh,
      'hybrid' => JobBenefit.hybrid,
      'paid_leave' => JobBenefit.paidLeave,
      'flexible_hours' => JobBenefit.flexibleHours,
      'free_meals' => JobBenefit.freeMeals,
      'transport' => JobBenefit.transport,
      'annual_bonus' => JobBenefit.annualBonus,
      'stock_options' => JobBenefit.stockOptions,
      'learning_stipend' => JobBenefit.learningStipend,
      _ => null,
    };

const benefitLabel = {
  JobBenefit.pf: 'Provident Fund',
  JobBenefit.esi: 'ESI',
  JobBenefit.healthInsurance: 'Health insurance',
  JobBenefit.wfh: 'Work from home',
  JobBenefit.hybrid: 'Hybrid',
  JobBenefit.paidLeave: 'Paid leave',
  JobBenefit.flexibleHours: 'Flexible hours',
  JobBenefit.freeMeals: 'Free meals',
  JobBenefit.transport: 'Transport',
  JobBenefit.annualBonus: 'Annual bonus',
  JobBenefit.stockOptions: 'Stock options',
  JobBenefit.learningStipend: 'Learning stipend',
};

const benefitIcon = {
  JobBenefit.pf: Icons.savings_rounded,
  JobBenefit.esi: Icons.local_hospital_rounded,
  JobBenefit.healthInsurance: Icons.health_and_safety_rounded,
  JobBenefit.wfh: Icons.home_work_rounded,
  JobBenefit.hybrid: Icons.balance_rounded,
  JobBenefit.paidLeave: Icons.beach_access_rounded,
  JobBenefit.flexibleHours: Icons.schedule_rounded,
  JobBenefit.freeMeals: Icons.restaurant_rounded,
  JobBenefit.transport: Icons.directions_bus_rounded,
  JobBenefit.annualBonus: Icons.card_giftcard_rounded,
  JobBenefit.stockOptions: Icons.trending_up_rounded,
  JobBenefit.learningStipend: Icons.menu_book_rounded,
};

const benefitTone = {
  JobBenefit.pf: Color(0xFF10B981),
  JobBenefit.esi: Color(0xFFE11D48),
  JobBenefit.healthInsurance: Color(0xFFEF4444),
  JobBenefit.wfh: Color(0xFF8B5CF6),
  JobBenefit.hybrid: Color(0xFF6366F1),
  JobBenefit.paidLeave: Color(0xFF06B6D4),
  JobBenefit.flexibleHours: Color(0xFF0EA5E9),
  JobBenefit.freeMeals: Color(0xFFF97316),
  JobBenefit.transport: Color(0xFF14B8A6),
  JobBenefit.annualBonus: Color(0xFFF59E0B),
  JobBenefit.stockOptions: Color(0xFF7C3AED),
  JobBenefit.learningStipend: Color(0xFF0369A1),
};

/// Job postings are valid for 45 days from `postedAt`, matching the backend
/// `Job.expiresAt` default (`now() + interval '45 days'`).
const jobValidityDays = 45;

@immutable
class Job {
  const Job({
    required this.id,
    required this.employerId,
    required this.employerName,
    required this.title,
    required this.description,
    required this.location,
    this.districtId,
    this.talukId,
    this.lat,
    this.lng,
    this.pincode,
    this.street,
    required this.field,
    required this.type,
    required this.experience,
    this.yearsMin,
    this.yearsMax,
    this.salaryRange,
    this.skills = const [],
    this.benefits = const [],
    this.contactEmail,
    required this.postedAt,
    required this.expiresAt,
  });

  final String id;
  final String employerId;
  final String employerName;
  final String title;
  final String description;
  final String location;
  final String? districtId;
  final String? talukId;
  final double? lat;
  final double? lng;
  final String? pincode;
  final String? street;
  final JobField field;
  final JobType type;
  final JobExperience experience;
  final int? yearsMin;
  final int? yearsMax;
  final String? salaryRange;
  final List<String> skills;
  final List<JobBenefit> benefits;
  final String? contactEmail;
  final String postedAt;
  final String expiresAt;

  bool get isExpired => DateTime.parse(expiresAt).isBefore(DateTime.now());

  int get daysUntilExpiry {
    final diff = DateTime.parse(expiresAt).difference(DateTime.now());
    return diff.inDays;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'employerId': employerId,
        'employerName': employerName,
        'title': title,
        'description': description,
        'location': location,
        if (districtId != null) 'districtId': districtId,
        if (talukId != null) 'talukId': talukId,
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (pincode != null) 'pincode': pincode,
        if (street != null) 'street': street,
        'field': _fieldKey(field),
        'type': _typeKey(type),
        'experience': _expKey(experience),
        if (yearsMin != null) 'yearsMin': yearsMin,
        if (yearsMax != null) 'yearsMax': yearsMax,
        if (salaryRange != null) 'salaryRange': salaryRange,
        'skills': skills,
        'benefits': benefits.map(benefitKey).toList(),
        if (contactEmail != null) 'contactEmail': contactEmail,
        'postedAt': postedAt,
        'expiresAt': expiresAt,
      };

  static Job fromJson(Map<String, dynamic> j) {
    final postedAt = j['postedAt'] as String;
    // Legacy rows written before the 45-day expiry migration didn't carry
    // an `expiresAt`. Derive it from postedAt so the whole app can rely on
    // the field being present.
    final expiresAt = (j['expiresAt'] as String?) ??
        DateTime.parse(postedAt)
            .add(const Duration(days: jobValidityDays))
            .toIso8601String();
    return Job(
      id: j['id'] as String,
      employerId: j['employerId'] as String,
      employerName: j['employerName'] as String,
      title: j['title'] as String,
      description: j['description'] as String,
      location: j['location'] as String,
      districtId: j['districtId'] as String?,
      talukId: j['talukId'] as String?,
      lat: (j['lat'] as num?)?.toDouble(),
      lng: (j['lng'] as num?)?.toDouble(),
      pincode: j['pincode'] as String?,
      street: j['street'] as String?,
      field: _fieldFrom(j['field'] as String?),
      type: _typeFrom(j['type'] as String?),
      experience: _expFrom(j['experience'] as String?),
      yearsMin: j['yearsMin'] as int?,
      yearsMax: j['yearsMax'] as int?,
      salaryRange: j['salaryRange'] as String?,
      skills: (j['skills'] as List<dynamic>? ?? []).cast<String>(),
      benefits: ((j['benefits'] as List<dynamic>?) ?? const [])
          .map((e) => benefitFromKey(e as String?))
          .whereType<JobBenefit>()
          .toList(),
      contactEmail: j['contactEmail'] as String?,
      postedAt: postedAt,
      expiresAt: expiresAt,
    );
  }

  Job copyWith({
    String? title,
    String? description,
    String? location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    JobField? field,
    JobType? type,
    JobExperience? experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String>? skills,
    List<JobBenefit>? benefits,
    String? contactEmail,
    String? postedAt,
    String? expiresAt,
  }) =>
      Job(
        id: id,
        employerId: employerId,
        employerName: employerName,
        title: title ?? this.title,
        description: description ?? this.description,
        location: location ?? this.location,
        districtId: districtId ?? this.districtId,
        talukId: talukId ?? this.talukId,
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        pincode: pincode ?? this.pincode,
        street: street ?? this.street,
        field: field ?? this.field,
        type: type ?? this.type,
        experience: experience ?? this.experience,
        yearsMin: yearsMin ?? this.yearsMin,
        yearsMax: yearsMax ?? this.yearsMax,
        salaryRange: salaryRange ?? this.salaryRange,
        skills: skills ?? this.skills,
        benefits: benefits ?? this.benefits,
        contactEmail: contactEmail ?? this.contactEmail,
        postedAt: postedAt ?? this.postedAt,
        expiresAt: expiresAt ?? this.expiresAt,
      );
}

String _daysAgo(int n) =>
    DateTime.now().subtract(Duration(days: n)).toIso8601String();

/// Seed jobs default to a 45-day expiry counted from now, so seeded jobs
/// never appear stale on first launch.
String _seedExpiry() =>
    DateTime.now().add(const Duration(days: jobValidityDays)).toIso8601String();

List<Job> _seedJobs() => [
      Job(
        id: 'job_001',
        employerId: 'emp_zoho',
        employerName: 'Zoho Corporation',
        title: 'Junior React Developer',
        description:
            "Join our product engineering team in Chennai. You'll work on the next-gen Zoho CRM frontend, contribute to our component library, and learn from senior engineers.",
        location: 'Sholinganallur, Chennai',
        districtId: 'chennai', talukId: 'chennai_sholinganallur', lat: 12.9010, lng: 80.2279,
        field: JobField.it, type: JobType.fullTime, experience: JobExperience.fresher,
        salaryRange: '₹3.5 – 5 LPA',
        skills: const ['React', 'TypeScript', 'HTML/CSS', 'Git'],
        benefits: const [JobBenefit.pf, JobBenefit.healthInsurance, JobBenefit.hybrid, JobBenefit.learningStipend],
        postedAt: _daysAgo(2),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_002',
        employerId: 'emp_freshworks',
        employerName: 'Freshworks',
        title: 'Senior Backend Engineer (Node.js)',
        description:
            "Help architect the next generation of Freshdesk's customer engagement platform. 5+ years of Node.js + microservices experience. Strong in MySQL, Redis, AWS.",
        location: 'Coimbatore North',
        districtId: 'coimbatore', talukId: 'coimbatore_north', lat: 11.0510, lng: 76.9558,
        field: JobField.it, type: JobType.fullTime, experience: JobExperience.experienced, yearsMin: 5, yearsMax: 9,
        salaryRange: '₹18 – 32 LPA',
        skills: const ['Node.js', 'MySQL', 'AWS', 'Microservices', 'Redis'],
        benefits: const [JobBenefit.pf, JobBenefit.healthInsurance, JobBenefit.stockOptions, JobBenefit.wfh, JobBenefit.annualBonus],
        postedAt: _daysAgo(4),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_003',
        employerId: 'emp_cognizant',
        employerName: 'Cognizant Madurai',
        title: 'HR Executive — Recruitment',
        description:
            'Manage end-to-end recruitment for SME clients across Tamil Nadu. Excellent English + Tamil communication required.',
        location: 'Madurai South',
        districtId: 'madurai', talukId: 'madurai_madurai_south', lat: 9.9000, lng: 78.1167,
        field: JobField.nonIt, type: JobType.fullTime, experience: JobExperience.any,
        salaryRange: '₹3 – 5 LPA',
        skills: const ['Recruitment', 'Communication', 'English', 'Tamil'],
        benefits: const [JobBenefit.pf, JobBenefit.paidLeave, JobBenefit.transport],
        postedAt: _daysAgo(5),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_004',
        employerId: 'emp_techmahindra',
        employerName: 'Tech Mahindra BPS',
        title: 'Customer Support — Voice Process',
        description:
            'Excellent English communication with neutral accent required. Night shift (US clients). Fresh graduates welcome. Free transport, performance incentives.',
        location: 'Perambur, Chennai',
        districtId: 'chennai', talukId: 'chennai_perambur', lat: 13.1149, lng: 80.2329,
        field: JobField.nonIt, type: JobType.fullTime, experience: JobExperience.fresher,
        salaryRange: '₹2.5 – 3.8 LPA',
        skills: const ['Voice Process', 'English', 'Customer Service'],
        benefits: const [JobBenefit.transport, JobBenefit.freeMeals, JobBenefit.annualBonus],
        postedAt: _daysAgo(1),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_005',
        employerId: 'emp_zoho_trichy',
        employerName: 'Zoho Trichy',
        title: 'AI/ML Internship — 6 months',
        description:
            '6-month research internship working on multilingual NLP for Indian languages. Stipend ₹35K/month. Final-year B.Tech / M.Tech students preferred.',
        location: 'Srirangam, Tiruchirappalli',
        districtId: 'tiruchirappalli', talukId: 'tiruchirappalli_srirangam', lat: 10.8589, lng: 78.6890,
        field: JobField.it, type: JobType.internshipTraining, experience: JobExperience.fresher,
        salaryRange: '₹35K / month',
        skills: const ['Python', 'PyTorch', 'NLP', 'Research'],
        benefits: const [JobBenefit.learningStipend, JobBenefit.freeMeals, JobBenefit.wfh],
        postedAt: _daysAgo(7),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_006',
        employerId: 'emp_kpmg',
        employerName: 'KPMG India',
        title: 'Junior Finance Analyst',
        description:
            'Join our finance advisory team. CA Inter/CS or B.Com graduates. Strong Excel + financial modeling. Exposure to top-tier clients.',
        location: 'T. Nagar, Chennai',
        districtId: 'chennai', talukId: 'chennai_t_nagar', lat: 13.0418, lng: 80.2341,
        field: JobField.nonIt, type: JobType.fullTime, experience: JobExperience.fresher,
        salaryRange: '₹4 – 6 LPA',
        skills: const ['Excel', 'Financial Modeling', 'Accounting'],
        benefits: const [JobBenefit.pf, JobBenefit.healthInsurance, JobBenefit.learningStipend],
        postedAt: _daysAgo(3),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_007',
        employerId: 'emp_aviva',
        employerName: 'Aviva BPO Tirunelveli',
        title: 'Sales Executive — Insurance',
        description:
            'Drive insurance sales across Tirunelveli + nearby districts. Target-driven role with attractive incentives. Local language expertise required (Tamil mandatory). Bike + license a plus.',
        location: 'Palayamkottai, Tirunelveli',
        districtId: 'tirunelveli', talukId: 'tirunelveli_palayamkottai', lat: 8.7269, lng: 77.7311,
        field: JobField.nonIt, type: JobType.fullTime, experience: JobExperience.any,
        salaryRange: '₹2.5 LPA + incentives',
        skills: const ['Sales', 'Tamil', 'Insurance', 'Field Work'],
        benefits: const [JobBenefit.annualBonus, JobBenefit.transport],
        postedAt: _daysAgo(6),
        expiresAt: _seedExpiry(),
      ),
      Job(
        id: 'job_008',
        employerId: 'emp_lt',
        employerName: 'L&T Construction',
        title: 'Site Supervisor — Civil',
        description:
            'Supervise construction site activities for a metro rail project. Diploma/B.E. Civil + 2 yrs site experience. Two-wheeler license required.',
        location: 'Mettupalayam, Coimbatore',
        districtId: 'coimbatore', talukId: 'coimbatore_mettupalayam', lat: 11.2989, lng: 76.9358,
        field: JobField.nonIt, type: JobType.contract, experience: JobExperience.experienced,
        yearsMin: 2, yearsMax: 6,
        salaryRange: '₹4.5 – 6.5 LPA',
        skills: const ['Civil Engineering', 'AutoCAD', 'Site Management'],
        benefits: const [JobBenefit.pf, JobBenefit.transport],
        postedAt: _daysAgo(8),
        expiresAt: _seedExpiry(),
      ),
    ];

class JobsNotifier extends Notifier<List<Job>> {
  @override
  List<Job> build() {
    final raw = Storage.instance.getString(StorageKeys.jobs);
    if (raw == null) {
      final seed = _seedJobs();
      Storage.instance.setString(
        StorageKeys.jobs,
        jsonEncode(seed.map((j) => j.toJson()).toList()),
      );
      return seed;
    }
    final list = jsonDecode(raw) as List<dynamic>;
    if (list.isEmpty) {
      final seed = _seedJobs();
      Storage.instance.setString(
        StorageKeys.jobs,
        jsonEncode(seed.map((j) => j.toJson()).toList()),
      );
      return seed;
    }
    final parsed = list.map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
    // Migrate: if any seed-id job lacks districtId, replace seeds + keep employer-posted ones.
    // Also re-seed when seed jobs are missing benefits, so old installs pick
    // up the enriched samples that now demonstrate the new benefits + 45-day
    // expiry flow.
    final hasOldSeeds = parsed.any((j) =>
        j.id.startsWith('job_00') &&
        (j.districtId == null || j.benefits.isEmpty));
    if (hasOldSeeds) {
      final employerJobs = parsed.where((j) => !j.id.startsWith('job_00')).toList();
      final next = [..._seedJobs(), ...employerJobs];
      Storage.instance.setString(
        StorageKeys.jobs,
        jsonEncode(next.map((j) => j.toJson()).toList()),
      );
      return next;
    }
    return parsed;
  }

  Job? byId(String id) {
    for (final j in state) {
      if (j.id == id) return j;
    }
    return null;
  }

  Job addJob({
    required String employerId,
    required String employerName,
    required String title,
    required String description,
    required String location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    required JobField field,
    required JobType type,
    required JobExperience experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String> skills = const [],
    List<JobBenefit> benefits = const [],
    String? contactEmail,
  }) {
    final now = DateTime.now();
    final job = Job(
      id: 'job_${now.microsecondsSinceEpoch.toRadixString(36)}',
      employerId: employerId,
      employerName: employerName,
      title: title,
      description: description,
      location: location,
      districtId: districtId,
      talukId: talukId,
      lat: lat,
      lng: lng,
      pincode: pincode,
      street: street,
      field: field,
      type: type,
      experience: experience,
      yearsMin: yearsMin,
      yearsMax: yearsMax,
      salaryRange: salaryRange,
      skills: skills,
      benefits: benefits,
      contactEmail: contactEmail,
      postedAt: now.toIso8601String(),
      expiresAt: now.add(const Duration(days: jobValidityDays)).toIso8601String(),
    );
    final next = [job, ...state];
    _persist(next);
    return job;
  }

  List<Job> postedBy(String employerId) =>
      state.where((j) => j.employerId == employerId).toList();

  // ============================================================
  // API integration — additive to the localStorage-first methods
  // above. Pages that want live server data call these; everything
  // else keeps working offline as before.
  // ============================================================

  /// Map an API job (uppercase enums) to the local Job shape.
  Job _fromApi(Map<String, dynamic> j) {
    final field = j['field'] as String;
    final type = j['type'] as String;
    final experience = j['experience'] as String;
    return Job(
      id: j['id'] as String,
      employerId: j['employerId'] as String,
      employerName: j['employerName'] as String,
      title: j['title'] as String,
      description: j['description'] as String,
      location: j['location'] as String,
      districtId: j['districtId'] as String?,
      talukId: j['talukId'] as String?,
      lat: (j['lat'] as num?)?.toDouble(),
      lng: (j['lng'] as num?)?.toDouble(),
      pincode: j['pincode'] as String?,
      street: j['street'] as String?,
      field: field == 'IT' ? JobField.it : JobField.nonIt,
      type: _typeFrom(type.toLowerCase()),
      experience: _expFrom(experience.toLowerCase()),
      yearsMin: j['yearsMin'] as int?,
      yearsMax: j['yearsMax'] as int?,
      salaryRange: j['salaryRange'] as String?,
      skills: ((j['skills'] as List?) ?? const []).cast<String>(),
      benefits: ((j['benefits'] as List?) ?? const [])
          .map((e) => benefitFromKey(e as String?))
          .whereType<JobBenefit>()
          .toList(),
      contactEmail: j['contactEmail'] as String?,
      postedAt: j['postedAt'] as String,
      expiresAt: j['expiresAt'] as String,
    );
  }

  /// Fetch the public jobs feed from the server and REPLACE local
  /// state with the fresh set. Call this at boot (JobBrowsePage
  /// mount) so candidates see live listings instead of localStorage
  /// seeds. Silent no-op offline.
  Future<void> fetchJobs() async {
    if (!apiEnabled) return;
    try {
      final res = await JobsApi.instance.browse(pageSize: 100);
      final items = (res['items'] as List).cast<Map<String, dynamic>>();
      final jobs = items.map(_fromApi).toList();
      _persist(jobs);
    } catch (_) {
      // Silent fallback — keep the local cache visible.
    }
  }

  /// Async employer post — hits POST /employer/jobs and merges the
  /// created row into local state. Falls back to the sync addJob
  /// path in offline mode.
  Future<Job> addJobAsync({
    required String employerId,
    required String employerName,
    required String title,
    required String description,
    required String location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    required JobField field,
    required JobType type,
    required JobExperience experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String> skills = const [],
    List<JobBenefit> benefits = const [],
    String? contactEmail,
  }) async {
    if (!apiEnabled) {
      return addJob(
        employerId: employerId, employerName: employerName, title: title,
        description: description, location: location, districtId: districtId,
        talukId: talukId, lat: lat, lng: lng, pincode: pincode, street: street,
        field: field, type: type, experience: experience,
        yearsMin: yearsMin, yearsMax: yearsMax, salaryRange: salaryRange,
        skills: skills, benefits: benefits, contactEmail: contactEmail,
      );
    }
    final input = _toApiInput(
      title: title, description: description, location: location,
      districtId: districtId, talukId: talukId, lat: lat, lng: lng,
      pincode: pincode, street: street, field: field, type: type,
      experience: experience, yearsMin: yearsMin, yearsMax: yearsMax,
      salaryRange: salaryRange, skills: skills, benefits: benefits,
      contactEmail: contactEmail,
    );
    final row = await JobsApi.instance.employerCreate(input);
    final job = _fromApi(row);
    _persist([job, ...state]);
    return job;
  }

  /// Async staff post — POST /staff/jobs with an explicit employerId
  /// in the body (the JWT is the staff user's, not the target
  /// employer's). Backend stamps postedByStaffId automatically.
  Future<Job> addJobAsStaffAsync({
    required String employerId,
    required String employerName,
    required String title,
    required String description,
    required String location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    required JobField field,
    required JobType type,
    required JobExperience experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String> skills = const [],
    List<JobBenefit> benefits = const [],
    String? contactEmail,
  }) async {
    if (!apiEnabled) {
      // Offline fallback — write to localStorage so demo/dev still works.
      return addJob(
        employerId: employerId, employerName: employerName, title: title,
        description: description, location: location, districtId: districtId,
        talukId: talukId, lat: lat, lng: lng, pincode: pincode, street: street,
        field: field, type: type, experience: experience,
        yearsMin: yearsMin, yearsMax: yearsMax, salaryRange: salaryRange,
        skills: skills, benefits: benefits, contactEmail: contactEmail,
      );
    }
    final input = _toApiInput(
      title: title, description: description, location: location,
      districtId: districtId, talukId: talukId, lat: lat, lng: lng,
      pincode: pincode, street: street, field: field, type: type,
      experience: experience, yearsMin: yearsMin, yearsMax: yearsMax,
      salaryRange: salaryRange, skills: skills, benefits: benefits,
      contactEmail: contactEmail,
    );
    input['employerId'] = employerId;
    final row = await StaffApi.instance.createJob(input);
    final job = _fromApi(row);
    _persist([job, ...state]);
    return job;
  }

  /// Async candidate apply — hits POST /jobs/:id/apply. Returns the
  /// created application (raw JSON, callers decode as needed).
  Future<Map<String, dynamic>> applyAsync(String jobId, {int? matchScore, String? coverNote}) async {
    if (!apiEnabled) {
      // No local-mode apply here — the applications provider handles
      // its own localStorage path. This helper exists specifically for
      // the API path.
      throw ApiError(status: 0, code: 'API_DISABLED', message: 'API not configured');
    }
    return JobsApi.instance.apply(jobId, matchScore: matchScore, coverNote: coverNote);
  }

  /// Shared helper to build the /employer/jobs + /staff/jobs POST body
  /// with backend enum casing.
  Map<String, dynamic> _toApiInput({
    required String title,
    required String description,
    required String location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    required JobField field,
    required JobType type,
    required JobExperience experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String> skills = const [],
    List<JobBenefit> benefits = const [],
    String? contactEmail,
  }) {
    final typeStr = _typeKey(type).toUpperCase();
    return {
      'title': title,
      'description': description,
      'location': location,
      if (districtId != null) 'districtId': districtId,
      if (talukId != null) 'talukId': talukId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (pincode != null) 'pincode': pincode,
      if (street != null) 'street': street,
      'field': field == JobField.it ? 'IT' : 'NON_IT',
      'type': typeStr,
      'experience': experience == JobExperience.fresher ? 'FRESHER'
          : experience == JobExperience.experienced ? 'EXPERIENCED' : 'ANY',
      if (yearsMin != null) 'yearsMin': yearsMin,
      if (yearsMax != null) 'yearsMax': yearsMax,
      if (salaryRange != null) 'salaryRange': salaryRange,
      'skills': skills,
      'benefits': benefits.map(benefitKey).toList(),
      if (contactEmail != null) 'contactEmail': contactEmail,
    };
  }

  /// Mirrors the web `repostJob(id)` action: bumps `postedAt` to now and
  /// extends `expiresAt` by the standard 45-day validity window. Returns the
  /// updated job so the caller can show a toast with the new expiry.
  Job? repost(String id) {
    Job? updated;
    final now = DateTime.now();
    final next = state.map((j) {
      if (j.id != id) return j;
      updated = j.copyWith(
        postedAt: now.toIso8601String(),
        expiresAt:
            now.add(const Duration(days: jobValidityDays)).toIso8601String(),
      );
      return updated!;
    }).toList();
    _persist(next);
    return updated;
  }

  void deleteJob(String id) {
    final next = state.where((j) => j.id != id).toList();
    _persist(next);
  }

  /// Async repost — POST /employer/jobs/:id/repost. Backend rotates
  /// postedAt + extends expiresAt by 45 days, preserves applications
  /// + saves. Merges the fresh row into local state.
  Future<Job?> repostAsync(String id) async {
    if (!apiEnabled) return repost(id);
    try {
      final row = await JobsApi.instance.employerRepost(id);
      final job = _fromApi(row);
      final next = state.map((j) => j.id == id ? job : j).toList();
      _persist(next);
      return job;
    } catch (_) {
      // Fall back to local-only repost so the UI still moves.
      return repost(id);
    }
  }

  /// Async delete — DELETE /employer/jobs/:id then drop locally.
  Future<void> deleteJobAsync(String id) async {
    if (apiEnabled) {
      try { await JobsApi.instance.employerDelete(id); } catch (_) { /* still drop locally */ }
    }
    deleteJob(id);
  }

  /// Async edit — PATCH /employer/jobs/:id. `patch` uses the shared
  /// _toApiInput serialisation. Merges the fresh row into local state.
  Future<Job?> updateJobAsync(String id, {
    String? title,
    String? description,
    String? location,
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
    JobField? field,
    JobType? type,
    JobExperience? experience,
    int? yearsMin,
    int? yearsMax,
    String? salaryRange,
    List<String>? skills,
    List<JobBenefit>? benefits,
    String? contactEmail,
  }) async {
    if (!apiEnabled) {
      // Local-only edit — apply on top of the existing row.
      final existing = byId(id);
      if (existing == null) return null;
      final updated = existing.copyWith(
        title: title ?? existing.title,
        description: description ?? existing.description,
        location: location ?? existing.location,
        districtId: districtId ?? existing.districtId,
        talukId: talukId ?? existing.talukId,
        lat: lat ?? existing.lat,
        lng: lng ?? existing.lng,
        pincode: pincode ?? existing.pincode,
        street: street ?? existing.street,
        field: field ?? existing.field,
        type: type ?? existing.type,
        experience: experience ?? existing.experience,
        yearsMin: yearsMin ?? existing.yearsMin,
        yearsMax: yearsMax ?? existing.yearsMax,
        salaryRange: salaryRange ?? existing.salaryRange,
        skills: skills ?? existing.skills,
        benefits: benefits ?? existing.benefits,
        contactEmail: contactEmail ?? existing.contactEmail,
      );
      _persist(state.map((j) => j.id == id ? updated : j).toList());
      return updated;
    }
    // Partial API patch — only send fields the caller actually supplied.
    final patch = <String, dynamic>{};
    if (title != null) patch['title'] = title;
    if (description != null) patch['description'] = description;
    if (location != null) patch['location'] = location;
    if (districtId != null) patch['districtId'] = districtId;
    if (talukId != null) patch['talukId'] = talukId;
    if (lat != null) patch['lat'] = lat;
    if (lng != null) patch['lng'] = lng;
    if (pincode != null) patch['pincode'] = pincode;
    if (street != null) patch['street'] = street;
    if (field != null) patch['field'] = field == JobField.it ? 'IT' : 'NON_IT';
    if (type != null) patch['type'] = _typeKey(type).toUpperCase();
    if (experience != null) patch['experience'] =
        experience == JobExperience.fresher ? 'FRESHER'
        : experience == JobExperience.experienced ? 'EXPERIENCED' : 'ANY';
    if (yearsMin != null) patch['yearsMin'] = yearsMin;
    if (yearsMax != null) patch['yearsMax'] = yearsMax;
    if (salaryRange != null) patch['salaryRange'] = salaryRange;
    if (skills != null) patch['skills'] = skills;
    if (benefits != null) patch['benefits'] = benefits.map(benefitKey).toList();
    if (contactEmail != null) patch['contactEmail'] = contactEmail;
    try {
      final row = await JobsApi.instance.employerUpdate(id, patch);
      final job = _fromApi(row);
      _persist(state.map((j) => j.id == id ? job : j).toList());
      return job;
    } catch (_) {
      return null;
    }
  }

  void _persist(List<Job> next) {
    state = next;
    Storage.instance.setString(
      StorageKeys.jobs,
      jsonEncode(next.map((j) => j.toJson()).toList()),
    );
  }
}

final jobsProvider = NotifierProvider<JobsNotifier, List<Job>>(JobsNotifier.new);

String relativeTime(String iso) {
  final diff = DateTime.now().difference(DateTime.parse(iso));
  final days = diff.inDays;
  if (days == 0) return 'Today';
  if (days == 1) return 'Yesterday';
  if (days < 7) return '$days days ago';
  if (days < 30) return '${days ~/ 7} weeks ago';
  return '${days ~/ 30} months ago';
}
