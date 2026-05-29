import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';

enum JobField { it, nonIt }
enum JobType { internship, fullTime, partTime, contract }
enum JobExperience { fresher, experienced, any }

String _fieldKey(JobField f) => f == JobField.it ? 'it' : 'non_it';
JobField _fieldFrom(String? s) => s == 'it' ? JobField.it : JobField.nonIt;

String _typeKey(JobType t) => switch (t) {
      JobType.internship => 'internship',
      JobType.fullTime => 'full_time',
      JobType.partTime => 'part_time',
      JobType.contract => 'contract',
    };
JobType _typeFrom(String? s) => switch (s) {
      'internship' => JobType.internship,
      'part_time' => JobType.partTime,
      'contract' => JobType.contract,
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
  JobType.internship: 'Internship',
  JobType.fullTime: 'Full-time',
  JobType.partTime: 'Part-time',
  JobType.contract: 'Contract',
};

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
    this.salaryRange,
    this.skills = const [],
    required this.postedAt,
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
  final String? salaryRange;
  final List<String> skills;
  final String postedAt;

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
        if (salaryRange != null) 'salaryRange': salaryRange,
        'skills': skills,
        'postedAt': postedAt,
      };

  static Job fromJson(Map<String, dynamic> j) => Job(
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
        salaryRange: j['salaryRange'] as String?,
        skills: (j['skills'] as List<dynamic>? ?? []).cast<String>(),
        postedAt: j['postedAt'] as String,
      );
}

String _daysAgo(int n) =>
    DateTime.now().subtract(Duration(days: n)).toIso8601String();

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
        postedAt: _daysAgo(2),
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
        field: JobField.it, type: JobType.fullTime, experience: JobExperience.experienced, yearsMin: 5,
        salaryRange: '₹18 – 32 LPA',
        skills: const ['Node.js', 'MySQL', 'AWS', 'Microservices', 'Redis'],
        postedAt: _daysAgo(4),
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
        postedAt: _daysAgo(5),
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
        postedAt: _daysAgo(1),
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
        field: JobField.it, type: JobType.internship, experience: JobExperience.fresher,
        salaryRange: '₹35K / month',
        skills: const ['Python', 'PyTorch', 'NLP', 'Research'],
        postedAt: _daysAgo(7),
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
        postedAt: _daysAgo(3),
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
        postedAt: _daysAgo(6),
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
        yearsMin: 2,
        salaryRange: '₹4.5 – 6.5 LPA',
        skills: const ['Civil Engineering', 'AutoCAD', 'Site Management'],
        postedAt: _daysAgo(8),
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
    // Migrate: if any seed-id job lacks districtId, replace seeds + keep employer-posted ones
    final hasOldSeeds = parsed.any((j) => j.id.startsWith('job_00') && j.districtId == null);
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
    String? salaryRange,
    List<String> skills = const [],
  }) {
    final job = Job(
      id: 'job_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
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
      salaryRange: salaryRange,
      skills: skills,
      postedAt: DateTime.now().toIso8601String(),
    );
    final next = [job, ...state];
    state = next;
    Storage.instance.setString(
      StorageKeys.jobs,
      jsonEncode(next.map((j) => j.toJson()).toList()),
    );
    return job;
  }

  List<Job> postedBy(String employerId) =>
      state.where((j) => j.employerId == employerId).toList();

  void deleteJob(String id) {
    final next = state.where((j) => j.id != id).toList();
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
