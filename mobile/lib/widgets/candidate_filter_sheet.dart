import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/profile_provider.dart';
import '../store/theme_provider.dart';
import '../utils/distance.dart';

/// How the candidate list is ordered. Skill-match sort ranks candidates by
/// what fraction of the employer's required-skill set they have; falls back
/// to alphabetical when no skills are selected.
enum CandidateSort { skillMatch, recent, alphabetical }

/// Everything an employer can screen candidates by. Mirrors
/// [JobFilterState] for jobs — `null` on a scalar / empty on a list means
/// "no filter for this facet".
class CandidateFilterState {
  const CandidateFilterState({
    this.districtIds = const [],
    this.field,
    this.candidateType,
    this.yearsMin,
    this.yearsMax,
    this.educationLevels = const [],
    this.skills = const [],
    this.nearJobId,
    this.maxDistanceKm,
    this.sort = CandidateSort.skillMatch,
  });

  /// Preferred-district match. Uses the new multi-district field on
  /// `CandidateProfile`; a candidate matches if ANY of their preferred
  /// districts is in the selected set (OR semantics — same as jobs).
  final List<String> districtIds;
  final JobField? field;
  final CandidateType? candidateType;

  /// Only meaningful when [candidateType] is `experienced`. Null = no bound.
  final int? yearsMin;
  final int? yearsMax;

  /// Education screen — candidate must have AT LEAST ONE of these levels
  /// marked enabled in their profile.
  final List<EducationLevel> educationLevels;

  /// Required skills — candidate must have ALL of these somewhere in
  /// their skill sets (topSkills / itLanguages / nonItDepartments). Case-
  /// insensitive substring match to be forgiving about naming ("React" vs
  /// "React.js").
  final List<String> skills;

  /// Distance filter — employer picks one of their active job postings and
  /// a max radius; candidates must have any anchor (current or preferred
  /// district centroid) within [maxDistanceKm] of that job's coords. Both
  /// must be set together to activate.
  final String? nearJobId;
  final double? maxDistanceKm;

  final CandidateSort sort;

  bool get isDefault =>
      districtIds.isEmpty &&
      field == null &&
      candidateType == null &&
      yearsMin == null &&
      yearsMax == null &&
      educationLevels.isEmpty &&
      skills.isEmpty &&
      nearJobId == null;

  int get activeCount =>
      (districtIds.isNotEmpty ? 1 : 0) +
      (field != null ? 1 : 0) +
      (candidateType != null ? 1 : 0) +
      ((yearsMin != null || yearsMax != null) ? 1 : 0) +
      (educationLevels.isNotEmpty ? 1 : 0) +
      (skills.isNotEmpty ? 1 : 0) +
      (nearJobId != null ? 1 : 0);

  CandidateFilterState copyWith({
    List<String>? districtIds,
    JobField? Function()? field,
    CandidateType? Function()? candidateType,
    int? Function()? yearsMin,
    int? Function()? yearsMax,
    List<EducationLevel>? educationLevels,
    List<String>? skills,
    String? Function()? nearJobId,
    double? Function()? maxDistanceKm,
    CandidateSort? sort,
  }) =>
      CandidateFilterState(
        districtIds: districtIds ?? this.districtIds,
        field: field != null ? field() : this.field,
        candidateType:
            candidateType != null ? candidateType() : this.candidateType,
        yearsMin: yearsMin != null ? yearsMin() : this.yearsMin,
        yearsMax: yearsMax != null ? yearsMax() : this.yearsMax,
        educationLevels: educationLevels ?? this.educationLevels,
        skills: skills ?? this.skills,
        nearJobId: nearJobId != null ? nearJobId() : this.nearJobId,
        maxDistanceKm:
            maxDistanceKm != null ? maxDistanceKm() : this.maxDistanceKm,
        sort: sort ?? this.sort,
      );

  /// JSON round-trip — saved searches persist through SharedPreferences.
  Map<String, dynamic> toJson() => {
        'districtIds': districtIds,
        if (field != null) 'field': field == JobField.it ? 'it' : 'non_it',
        if (candidateType != null)
          'candidateType': candidateType == CandidateType.fresher ? 'fresher' : 'experienced',
        if (yearsMin != null) 'yearsMin': yearsMin,
        if (yearsMax != null) 'yearsMax': yearsMax,
        'educationLevels': educationLevels.map(educationLevelKey).toList(),
        'skills': skills,
        if (nearJobId != null) 'nearJobId': nearJobId,
        if (maxDistanceKm != null) 'maxDistanceKm': maxDistanceKm,
        'sort': sort.name,
      };

  static CandidateFilterState fromJson(Map<String, dynamic> j) {
    return CandidateFilterState(
      districtIds: ((j['districtIds'] as List<dynamic>?) ?? const []).cast<String>(),
      field: j['field'] == 'it'
          ? JobField.it
          : j['field'] == 'non_it'
              ? JobField.nonIt
              : null,
      candidateType: j['candidateType'] == 'fresher'
          ? CandidateType.fresher
          : j['candidateType'] == 'experienced'
              ? CandidateType.experienced
              : null,
      yearsMin: j['yearsMin'] as int?,
      yearsMax: j['yearsMax'] as int?,
      educationLevels: ((j['educationLevels'] as List<dynamic>?) ?? const [])
          .map((k) => educationLevelFromKey(k as String))
          .toList(),
      skills: ((j['skills'] as List<dynamic>?) ?? const []).cast<String>(),
      nearJobId: j['nearJobId'] as String?,
      maxDistanceKm: (j['maxDistanceKm'] as num?)?.toDouble(),
      sort: CandidateSort.values.firstWhere(
        (s) => s.name == j['sort'],
        orElse: () => CandidateSort.skillMatch,
      ),
    );
  }

  bool matches(
    CandidateProfile p, {
    LocationsData? locations,
    Job? nearJob,
  }) {
    if (districtIds.isNotEmpty) {
      final anyMatch = p.preferredDistrictIds.any(districtIds.contains) ||
          (p.currentDistrictId != null && districtIds.contains(p.currentDistrictId));
      if (!anyMatch) return false;
    }
    if (field != null) {
      if (field == JobField.it && p.field != FieldKind.it) return false;
      if (field == JobField.nonIt && p.field != FieldKind.nonIt) return false;
    }
    if (candidateType != null && p.type != candidateType) return false;
    if ((yearsMin != null || yearsMax != null)) {
      final y = p.yearsOfExperience ?? -1;
      if (yearsMin != null && y < yearsMin!) return false;
      if (yearsMax != null && y > yearsMax!) return false;
    }
    if (educationLevels.isNotEmpty) {
      final has = p.education.any((e) => e.enabled && educationLevels.contains(e.level));
      if (!has) return false;
    }
    if (skills.isNotEmpty) {
      for (final needed in skills) {
        if (!_hasSkill(p, needed)) return false;
      }
    }
    // Distance filter (only when the caller supplied the required data).
    // Skipping silently when data is absent is the right call — the filter
    // hasn't been "wrong", just unenforceable in this context, so we treat
    // it as inert instead of failing every candidate.
    if (nearJobId != null &&
        maxDistanceKm != null &&
        locations != null &&
        nearJob != null &&
        nearJob.lat != null &&
        nearJob.lng != null) {
      final closest = _closestAnchorKm(p, locations, nearJob.lat!, nearJob.lng!);
      if (closest == null || closest > maxDistanceKm!) return false;
    }
    return true;
  }

  /// 0.0 – 1.0 — fraction of required skills the candidate demonstrably has.
  /// Returns 1.0 when no skills are required so the sort stays stable
  /// (everyone's a "full match" against an empty requirement).
  double skillMatchScore(CandidateProfile p) {
    if (skills.isEmpty) return 1;
    int matched = 0;
    for (final needed in skills) {
      if (_hasSkill(p, needed)) matched++;
    }
    return matched / skills.length;
  }

  static bool _hasSkill(CandidateProfile p, String needed) {
    final n = needed.toLowerCase();
    for (final have in <String>[
      ...(p.topSkills ?? const []),
      ...(p.itLanguages ?? const []),
      ...(p.nonItDepartments ?? const []),
      if (p.itSpecialization != null) p.itSpecialization!,
    ]) {
      final h = have.toLowerCase();
      if (h.contains(n) || n.contains(h)) return true;
    }
    return false;
  }

  /// Distance in km from the given point to the candidate's nearest known
  /// anchor (current location, or the centroid of any preferred district).
  static double? _closestAnchorKm(
    CandidateProfile p,
    LocationsData locations,
    double lat,
    double lng,
  ) {
    final ds = <double>[];
    final cur = distanceKm(p.currentLat, p.currentLng, lat, lng);
    if (cur != null) ds.add(cur);
    for (final id in p.preferredDistrictIds) {
      final d = locations.districtById(id);
      if (d == null) continue;
      final dist = distanceKm(d.lat, d.lng, lat, lng);
      if (dist != null) ds.add(dist);
    }
    if (ds.isEmpty) return null;
    return ds.reduce((a, b) => a < b ? a : b);
  }
}

const _educationOrder = <(EducationLevel, String)>[
  (EducationLevel.tenth, '10th'),
  (EducationLevel.twelfth, '12th'),
  (EducationLevel.diploma, 'Diploma'),
  (EducationLevel.ug, 'UG'),
  (EducationLevel.pg, 'PG'),
  (EducationLevel.mphil, 'M.Phil'),
  (EducationLevel.phd, 'PhD'),
  (EducationLevel.other, 'Other'),
];

/// Employer-facing filter sheet. Same shape and interaction language as
/// [JobFilterSheet] so the two experiences feel like one system:
/// draggable bottom sheet, big-tap chips, live match count in the CTA, and
/// haptics on each selection.
class CandidateFilterSheet extends ConsumerStatefulWidget {
  const CandidateFilterSheet({
    super.key,
    required this.initial,
    required this.candidates,
    this.activeJobs = const [],
    this.onSave,
  });

  final CandidateFilterState initial;

  /// The candidate pool the sheet counts against — used so the "Show N
  /// candidates" button reflects reality before the employer commits.
  final List<(User, CandidateProfile)> candidates;

  /// The employer's currently-live job postings (non-expired), used to
  /// power the "Near my job" distance facet. Empty ⇒ the facet is hidden.
  final List<Job> activeJobs;

  /// When provided, a "Save this search" button appears in the footer.
  /// The callback is expected to open its own naming/confirm UX and persist
  /// the state — the sheet stays open until the employer taps Apply or
  /// Cancel.
  final Future<void> Function(CandidateFilterState state)? onSave;

  @override
  ConsumerState<CandidateFilterSheet> createState() =>
      _CandidateFilterSheetState();
}

class _CandidateFilterSheetState extends ConsumerState<CandidateFilterSheet> {
  late CandidateFilterState _state;
  late final TextEditingController _skillCtrl;

  @override
  void initState() {
    super.initState();
    _state = widget.initial;
    _skillCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _skillCtrl.dispose();
    super.dispose();
  }

  int get _matchCount {
    final locations = ref.read(locationsProvider);
    final nearJob = _state.nearJobId != null
        ? widget.activeJobs.where((j) => j.id == _state.nearJobId).firstOrNull
        : null;
    return widget.candidates
        .where((c) => _state.matches(c.$2, locations: locations, nearJob: nearJob))
        .length;
  }

  /// Union of districts that at least one of the visible candidates lives
  /// in or would work in — no point offering districts nobody's from.
  List<String> _availableDistrictIds() {
    final s = <String>{};
    for (final c in widget.candidates) {
      final p = c.$2;
      s.addAll(p.preferredDistrictIds);
      if (p.currentDistrictId != null) s.add(p.currentDistrictId!);
    }
    return s.toList()..sort();
  }

  void _addSkill(String raw) {
    final v = raw.trim();
    if (v.isEmpty) return;
    if (_state.skills.any((s) => s.toLowerCase() == v.toLowerCase())) return;
    HapticFeedback.selectionClick();
    setState(() => _state = _state.copyWith(skills: [..._state.skills, v]));
    _skillCtrl.clear();
  }

  void _removeSkill(String s) {
    HapticFeedback.lightImpact();
    setState(() => _state = _state.copyWith(skills: _state.skills.where((x) => x != s).toList()));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final locations = ref.watch(locationsProvider);
    final availableDistrictIds = _availableDistrictIds();

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.55,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE4E4E7),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.tune_rounded, size: 18, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Filter candidates', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
                        Text('$_matchCount matches so far', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFF0369A1))),
                      ],
                    ),
                  ),
                  if (!_state.isDefault)
                    TextButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        setState(() => _state = const CandidateFilterState());
                      },
                      child: const Text('Reset', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFE11D48))),
                    ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                children: [
                  _FacetLabel('Sort by'),
                  const SizedBox(height: 8),
                  _SortSegment(
                    value: _state.sort,
                    onChange: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _state = _state.copyWith(sort: v));
                    },
                    isDark: isDark,
                  ),
                  const SizedBox(height: 22),
                  if (widget.activeJobs.isNotEmpty) ...[
                    _FacetLabel('Near my job'),
                    const SizedBox(height: 8),
                    _DistanceFacet(
                      activeJobs: widget.activeJobs,
                      nearJobId: _state.nearJobId,
                      maxDistanceKm: _state.maxDistanceKm,
                      onJob: (id) {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _state = _state.copyWith(
                            nearJobId: () => id,
                            // Sensible default radius on first pick.
                            maxDistanceKm: () => _state.maxDistanceKm ?? 25,
                          );
                        });
                      },
                      onRadius: (km) {
                        HapticFeedback.selectionClick();
                        setState(() => _state = _state.copyWith(maxDistanceKm: () => km));
                      },
                      onClear: () {
                        HapticFeedback.selectionClick();
                        setState(() => _state = _state.copyWith(nearJobId: () => null, maxDistanceKm: () => null));
                      },
                      isDark: isDark,
                    ),
                    const SizedBox(height: 22),
                  ],
                  _FacetLabel('Preferred district'),
                  const SizedBox(height: 8),
                  if (availableDistrictIds.isEmpty)
                    const Text('No candidates have set a preferred district yet.', style: TextStyle(fontSize: 11.5, color: Color(0xFF71717A)))
                  else
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: availableDistrictIds.map((id) {
                        final d = locations.districtById(id);
                        if (d == null) return const SizedBox.shrink();
                        return _Chip(
                          label: d.name,
                          selected: _state.districtIds.contains(id),
                          tone: const Color(0xFF0EA5E9),
                          onTap: () {
                            HapticFeedback.selectionClick();
                            final next = _state.districtIds.contains(id)
                                ? _state.districtIds.where((x) => x != id).toList()
                                : [..._state.districtIds, id];
                            setState(() => _state = _state.copyWith(districtIds: next));
                          },
                        );
                      }).toList(),
                    ),
                  const SizedBox(height: 22),
                  _FacetLabel('Field'),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(
                      child: _Chip(
                        label: 'IT',
                        icon: Icons.code_rounded,
                        selected: _state.field == JobField.it,
                        tone: const Color(0xFF0EA5E9),
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _state = _state.copyWith(field: () => _state.field == JobField.it ? null : JobField.it));
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _Chip(
                        label: 'Non-IT',
                        icon: Icons.business_center_rounded,
                        selected: _state.field == JobField.nonIt,
                        tone: const Color(0xFFF97316),
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _state = _state.copyWith(field: () => _state.field == JobField.nonIt ? null : JobField.nonIt));
                        },
                      ),
                    ),
                  ]),
                  const SizedBox(height: 22),
                  _FacetLabel('Candidate type'),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(
                      child: _Chip(
                        label: 'Fresher',
                        icon: Icons.auto_awesome_rounded,
                        selected: _state.candidateType == CandidateType.fresher,
                        tone: const Color(0xFF10B981),
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _state = _state.copyWith(candidateType: () => _state.candidateType == CandidateType.fresher ? null : CandidateType.fresher));
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _Chip(
                        label: 'Experienced',
                        icon: Icons.workspace_premium_rounded,
                        selected: _state.candidateType == CandidateType.experienced,
                        tone: const Color(0xFF8B5CF6),
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _state = _state.copyWith(candidateType: () => _state.candidateType == CandidateType.experienced ? null : CandidateType.experienced));
                        },
                      ),
                    ),
                  ]),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 220),
                    curve: Curves.easeOut,
                    child: _state.candidateType == CandidateType.experienced
                        ? Padding(
                            padding: const EdgeInsets.only(top: 22),
                            child: _YearsFacet(
                              min: _state.yearsMin,
                              max: _state.yearsMax,
                              onMin: (v) => setState(() => _state = _state.copyWith(yearsMin: () => v)),
                              onMax: (v) => setState(() => _state = _state.copyWith(yearsMax: () => v)),
                              isDark: isDark,
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                  const SizedBox(height: 22),
                  _FacetLabel('Education level'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _educationOrder.map((meta) {
                      return _Chip(
                        label: meta.$2,
                        selected: _state.educationLevels.contains(meta.$1),
                        tone: const Color(0xFFEA580C),
                        onTap: () {
                          HapticFeedback.selectionClick();
                          final next = _state.educationLevels.contains(meta.$1)
                              ? _state.educationLevels.where((x) => x != meta.$1).toList()
                              : [..._state.educationLevels, meta.$1];
                          setState(() => _state = _state.copyWith(educationLevels: next));
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 22),
                  _FacetLabel('Skills required'),
                  const SizedBox(height: 8),
                  _SkillsFacet(
                    skills: _state.skills,
                    controller: _skillCtrl,
                    onAdd: _addSkill,
                    onRemove: _removeSkill,
                    isDark: isDark,
                  ),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                border: Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7))),
              ),
              child: Column(children: [
                if (widget.onSave != null && !_state.isDefault)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        HapticFeedback.selectionClick();
                        await widget.onSave!(_state);
                      },
                      icon: const Icon(Icons.bookmark_add_rounded, size: 16),
                      label: const Text('Save this search', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        side: const BorderSide(color: Color(0xFFF97316), width: 1.4),
                        foregroundColor: const Color(0xFFEA580C),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        minimumSize: const Size(double.infinity, 44),
                      ),
                    ),
                  ),
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE4E4E7)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                      ),
                      child: const Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        Navigator.of(context).pop(_state);
                      },
                      icon: const Icon(Icons.check_rounded, size: 16),
                      label: Text('Show $_matchCount candidate${_matchCount == 1 ? "" : "s"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0EA5E9),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 6,
                        shadowColor: const Color(0xFF0EA5E9).withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                ]),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _YearsFacet extends StatelessWidget {
  const _YearsFacet({
    required this.min,
    required this.max,
    required this.onMin,
    required this.onMax,
    required this.isDark,
  });
  final int? min;
  final int? max;
  final ValueChanged<int?> onMin;
  final ValueChanged<int?> onMax;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final safeMin = (min ?? 0).toDouble();
    final safeMax = (max ?? 20).toDouble();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _FacetLabel('Years of experience'),
        const SizedBox(height: 8),
        RangeSlider(
          values: RangeValues(safeMin, safeMax),
          min: 0,
          max: 30,
          divisions: 30,
          activeColor: const Color(0xFF8B5CF6),
          inactiveColor: const Color(0xFF8B5CF6).withValues(alpha: 0.20),
          labels: RangeLabels('${safeMin.toInt()} yrs', '${safeMax.toInt()} yrs'),
          onChanged: (v) {
            HapticFeedback.selectionClick();
            onMin(v.start == 0 ? null : v.start.toInt());
            onMax(v.end == 30 ? null : v.end.toInt());
          },
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Min ${(min ?? 0)} yrs', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A))),
              Text(max == null ? 'Max any' : 'Max $max yrs', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A))),
            ],
          ),
        ),
      ],
    );
  }
}

class _SkillsFacet extends StatelessWidget {
  const _SkillsFacet({
    required this.skills,
    required this.controller,
    required this.onAdd,
    required this.onRemove,
    required this.isDark,
  });
  final List<String> skills;
  final TextEditingController controller;
  final ValueChanged<String> onAdd;
  final ValueChanged<String> onRemove;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          ...skills.map((s) => _SkillPill(label: s, onRemove: () => onRemove(s))),
          SizedBox(
            width: skills.isEmpty ? double.infinity : 140,
            child: TextField(
              controller: controller,
              onSubmitted: onAdd,
              textInputAction: TextInputAction.done,
              style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white : const Color(0xFF09090B)),
              decoration: const InputDecoration(
                hintText: 'Skill + enter',
                hintStyle: TextStyle(fontSize: 12, color: Color(0xFFA1A1AA)),
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                border: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SkillPill extends StatelessWidget {
  const _SkillPill({required this.label, required this.onRemove});
  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onRemove,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
          borderRadius: BorderRadius.circular(999),
          boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.35), blurRadius: 6, offset: const Offset(0, 3))],
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(width: 6),
          InkWell(onTap: onRemove, borderRadius: BorderRadius.circular(999), child: const Icon(Icons.close_rounded, size: 12, color: Colors.white)),
        ]),
      ),
    );
  }
}

class _SortSegment extends StatelessWidget {
  const _SortSegment({required this.value, required this.onChange, required this.isDark});
  final CandidateSort value;
  final ValueChanged<CandidateSort> onChange;
  final bool isDark;

  static const _options = [
    (CandidateSort.skillMatch, 'Match %', Icons.auto_awesome_rounded),
    (CandidateSort.recent, 'Recent', Icons.new_releases_rounded),
    (CandidateSort.alphabetical, 'A–Z', Icons.sort_by_alpha_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: _options.map((opt) {
          final selected = opt.$1 == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChange(opt.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFF0EA5E9) : Colors.transparent,
                  borderRadius: BorderRadius.circular(11),
                  boxShadow: selected ? [BoxShadow(color: const Color(0xFF0EA5E9).withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3))] : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(opt.$3, size: 13, color: selected ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                    const SizedBox(width: 5),
                    Text(
                      opt.$2,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: selected ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _DistanceFacet extends StatelessWidget {
  const _DistanceFacet({
    required this.activeJobs,
    required this.nearJobId,
    required this.maxDistanceKm,
    required this.onJob,
    required this.onRadius,
    required this.onClear,
    required this.isDark,
  });
  final List<Job> activeJobs;
  final String? nearJobId;
  final double? maxDistanceKm;
  final ValueChanged<String> onJob;
  final ValueChanged<double> onRadius;
  final VoidCallback onClear;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final selectedJob = nearJobId != null ? activeJobs.where((j) => j.id == nearJobId).firstOrNull : null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: activeJobs.length,
            separatorBuilder: (_, __) => const SizedBox(width: 6),
            itemBuilder: (context, i) {
              final job = activeJobs[i];
              final selected = nearJobId == job.id;
              return Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => onJob(job.id),
                  borderRadius: BorderRadius.circular(999),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                    decoration: BoxDecoration(
                      gradient: selected ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]) : null,
                      color: selected ? null : const Color(0xFF10B981).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: selected ? const Color(0xFF10B981) : const Color(0xFF10B981).withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.work_rounded, size: 12, color: selected ? Colors.white : const Color(0xFF047857)),
                        const SizedBox(width: 5),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 160),
                          child: Text(
                            job.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: selected ? Colors.white : const Color(0xFF047857)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          child: selectedJob != null
              ? Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.place_rounded, size: 12, color: Color(0xFF047857)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                selectedJob.location,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF047857)),
                              ),
                            ),
                            InkWell(
                              onTap: onClear,
                              borderRadius: BorderRadius.circular(999),
                              child: const Padding(
                                padding: EdgeInsets.all(2),
                                child: Icon(Icons.close_rounded, size: 12, color: Color(0xFF047857)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              'Radius ${(maxDistanceKm ?? 25).toInt()} km',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF047857)),
                            ),
                            Expanded(
                              child: SliderTheme(
                                data: SliderThemeData(
                                  activeTrackColor: const Color(0xFF10B981),
                                  inactiveTrackColor: const Color(0xFF10B981).withValues(alpha: 0.20),
                                  thumbColor: const Color(0xFF059669),
                                  overlayColor: const Color(0xFF10B981).withValues(alpha: 0.15),
                                  trackHeight: 3,
                                ),
                                child: Slider(
                                  value: (maxDistanceKm ?? 25).clamp(5, 200),
                                  min: 5,
                                  max: 200,
                                  divisions: 39,
                                  onChanged: onRadius,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }
}

class _FacetLabel extends StatelessWidget {
  const _FacetLabel(this.text);
  final String text;
  @override
  Widget build(BuildContext context) =>
      Text(text.toUpperCase(), style: const TextStyle(fontSize: 10.5, letterSpacing: 1.5, fontWeight: FontWeight.w800, color: Color(0xFF71717A)));
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.tone,
    required this.onTap,
    this.icon,
  });
  final String label;
  final IconData? icon;
  final bool selected;
  final Color tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(
            gradient: selected ? LinearGradient(colors: [tone, tone.withValues(alpha: 0.85)]) : null,
            color: selected ? null : tone.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: selected ? tone : tone.withValues(alpha: 0.20), width: selected ? 0 : 1),
            boxShadow: selected ? [BoxShadow(color: tone.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))] : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 13, color: selected ? Colors.white : tone),
                const SizedBox(width: 5),
              ],
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: selected ? Colors.white : tone)),
            ],
          ),
        ),
      ),
    );
  }
}
