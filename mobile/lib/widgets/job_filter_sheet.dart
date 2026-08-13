import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/theme_provider.dart';
import 'profile/industry_department_picker.dart';

/// Full-featured filter state. `null` on any list means "no filter for this
/// facet" — mirrors the web `FilterPanel` semantics.
class JobFilterState {
  const JobFilterState({
    this.districtIds = const [],
    this.field,
    this.types = const [],
    this.experience,
    this.postedWithinDays,
    this.industry,
    this.department,
    this.hideExpired = true,
  });

  final List<String> districtIds;
  final JobField? field;
  final List<JobType> types;
  final JobExperience? experience;

  /// null → "any time"; 1 / 7 / 30 → posted within N days.
  final int? postedWithinDays;

  /// Naukri-style industry / department facets — mirror the 2026-08
  /// web change. Sent to the backend as `industry` / `department`
  /// query params, and compared case-sensitively against Job values.
  final String? industry;
  final String? department;

  /// Hide jobs past their 45-day validity by default. Employers may still
  /// want to see expired jobs (e.g. to repost) but candidates should never
  /// see them.
  final bool hideExpired;

  bool get isDefault =>
      districtIds.isEmpty &&
      field == null &&
      types.isEmpty &&
      experience == null &&
      postedWithinDays == null &&
      industry == null &&
      department == null;

  int get activeCount =>
      (districtIds.isNotEmpty ? 1 : 0) +
      (field != null ? 1 : 0) +
      (types.isNotEmpty ? 1 : 0) +
      (experience != null ? 1 : 0) +
      (postedWithinDays != null ? 1 : 0) +
      (industry != null ? 1 : 0) +
      (department != null ? 1 : 0);

  JobFilterState copyWith({
    List<String>? districtIds,
    JobField? Function()? field,
    List<JobType>? types,
    JobExperience? Function()? experience,
    int? Function()? postedWithinDays,
    String? Function()? industry,
    String? Function()? department,
    bool? hideExpired,
  }) =>
      JobFilterState(
        districtIds: districtIds ?? this.districtIds,
        field: field != null ? field() : this.field,
        types: types ?? this.types,
        experience: experience != null ? experience() : this.experience,
        postedWithinDays: postedWithinDays != null ? postedWithinDays() : this.postedWithinDays,
        industry: industry != null ? industry() : this.industry,
        department: department != null ? department() : this.department,
        hideExpired: hideExpired ?? this.hideExpired,
      );

  bool matches(Job job) {
    if (hideExpired && job.isExpired) return false;
    if (districtIds.isNotEmpty) {
      // A multi-location posting hits the filter when EITHER its primary
      // district OR any extra-location district matches — mirrors the
      // backend `GET /jobs?districtId=X` union semantics.
      final jobDistricts = <String>{
        if (job.districtId != null) job.districtId!,
        for (final l in job.extraLocations)
          if (l.districtId != null) l.districtId!,
      };
      if (!districtIds.any(jobDistricts.contains)) return false;
    }
    if (field != null && job.field != field) return false;
    if (types.isNotEmpty && !types.contains(job.type)) return false;
    if (experience != null && job.experience != experience && job.experience != JobExperience.any) {
      return false;
    }
    if (postedWithinDays != null) {
      final posted = DateTime.tryParse(job.postedAt);
      if (posted == null) return false;
      if (DateTime.now().difference(posted).inDays > postedWithinDays!) return false;
    }
    if (industry != null && job.industry != industry) return false;
    if (department != null && job.department != department) return false;
    return true;
  }
}

/// Slide-up sheet that fans every filter facet into one screen. Optimised
/// for one-thumb operation: chips are big-tap, the district row scrolls
/// horizontally, and the count of matches updates live so the user knows
/// what "Apply" will do before they commit.
class JobFilterSheet extends ConsumerStatefulWidget {
  const JobFilterSheet({
    super.key,
    required this.initial,
    required this.jobs,
  });
  final JobFilterState initial;
  final List<Job> jobs;

  @override
  ConsumerState<JobFilterSheet> createState() => _JobFilterSheetState();
}

class _JobFilterSheetState extends ConsumerState<JobFilterSheet> {
  late JobFilterState _state;

  @override
  void initState() {
    super.initState();
    _state = widget.initial;
  }

  int get _matchCount => widget.jobs.where(_state.matches).length;

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final locations = ref.watch(locationsProvider);
    // Include every district a job touches — primary AND extras — so a
    // multi-location posting shows up under each of its district chips.
    final availableDistrictIds = <String>{
      for (final j in widget.jobs) ...[
        if (j.districtId != null) j.districtId!,
        for (final l in j.extraLocations)
          if (l.districtId != null) l.districtId!,
      ],
    }.toList()
      ..sort();

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
                      gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEA580C)]),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.tune_rounded, size: 18, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Filter jobs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
                        Text('$_matchCount matches so far', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Color(0xFFEA580C))),
                      ],
                    ),
                  ),
                  if (!_state.isDefault)
                    TextButton(
                      onPressed: () {
                        HapticFeedback.selectionClick();
                        setState(() => _state = const JobFilterState());
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
                  _FacetLabel('District'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: availableDistrictIds.map((id) {
                      final d = locations.districtById(id);
                      if (d == null) return const SizedBox.shrink();
                      return _Chip(
                        label: d.name,
                        selected: _state.districtIds.contains(id),
                        tone: const Color(0xFFF97316),
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
                  _FacetLabel('Job type'),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: JobType.values.map((t) {
                      return _Chip(
                        label: typeLabelShort[t]!,
                        icon: typeIcon[t]!,
                        selected: _state.types.contains(t),
                        tone: typeTone[t]!,
                        onTap: () {
                          HapticFeedback.selectionClick();
                          final next = _state.types.contains(t)
                              ? _state.types.where((x) => x != t).toList()
                              : [..._state.types, t];
                          setState(() => _state = _state.copyWith(types: next));
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 22),
                  _FacetLabel('Experience'),
                  const SizedBox(height: 8),
                  Row(children: [
                    for (final e in [
                      (JobExperience.fresher, 'Fresher', Icons.auto_awesome_rounded),
                      (JobExperience.experienced, 'Experienced', Icons.workspace_premium_rounded),
                      (JobExperience.any, 'Any', Icons.all_inclusive_rounded),
                    ]) ...[
                      Expanded(
                        child: _Chip(
                          label: e.$2,
                          icon: e.$3,
                          selected: _state.experience == e.$1,
                          tone: const Color(0xFF8B5CF6),
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _state = _state.copyWith(experience: () => _state.experience == e.$1 ? null : e.$1));
                          },
                        ),
                      ),
                      if (e.$1 != JobExperience.any) const SizedBox(width: 6),
                    ],
                  ]),
                  const SizedBox(height: 22),
                  _FacetLabel('Industry & department'),
                  const SizedBox(height: 8),
                  IndustryDepartmentPicker(
                    industry: _state.industry,
                    department: _state.department,
                    onIndustry: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _state = _state.copyWith(industry: () => v));
                    },
                    onDepartment: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _state = _state.copyWith(department: () => v));
                    },
                    field: _state.field == JobField.it
                        ? 'IT'
                        : _state.field == JobField.nonIt
                            ? 'NON_IT'
                            : null,
                    industryLabel: 'Industry',
                    departmentLabel: 'Department',
                    industryHint: 'Any industry',
                    departmentHint: 'Any department',
                    dense: true,
                  ),
                  const SizedBox(height: 22),
                  _FacetLabel('Posted within'),
                  const SizedBox(height: 8),
                  Row(children: [
                    for (final p in [
                      (1, '24h'),
                      (7, 'Week'),
                      (30, 'Month'),
                      (null, 'Any time'),
                    ]) ...[
                      Expanded(
                        child: _Chip(
                          label: p.$2,
                          selected: _state.postedWithinDays == p.$1,
                          tone: const Color(0xFF10B981),
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _state = _state.copyWith(postedWithinDays: () => p.$1));
                          },
                        ),
                      ),
                      if (p.$2 != 'Any time') const SizedBox(width: 6),
                    ],
                  ]),
                ],
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                border: Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7))),
              ),
              child: Row(children: [
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
                    label: Text('Show $_matchCount jobs', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 6,
                      shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                    ),
                  ),
                ),
              ]),
            ),
          ],
        ),
      ),
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
              Text(
                label,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: selected ? Colors.white : tone),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
