import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';
import 'segmented_toggle.dart';
import 'chip_input.dart';
import 'experience_list.dart';

const _itSpecs = [
  'Artificial Intelligence',
  'Cyber Security',
  'Networking',
  'Telecom',
  'Web Development',
  'Embedded Systems',
  'Semiconductor',
  'Mobile Development',
  'Cloud / DevOps',
  'Data Science',
];

const _depts = [
  'HR',
  'Finance',
  'Sales',
  'Marketing',
  'Purchase',
  'Supply Chain Management',
  'BPO',
  'Voice Process',
  'Non-Voice Process',
  'Operations',
  'Customer Service',
  'Administration',
];


class AboutYouStepWidget extends ConsumerWidget {
  const AboutYouStepWidget({
    super.key,
    required this.type,
    required this.onType,
    required this.internOrJob,
    required this.onInternOrJob,
    required this.field,
    required this.onField,
    required this.itSpec,
    required this.onItSpec,
    required this.itLanguages,
    required this.onItLanguages,
    required this.nonItDepartments,
    required this.onNonItDepartments,
    required this.years,
    required this.onYears,
    required this.topSkills,
    required this.onTopSkills,
    required this.experiences,
    required this.onExperiences,
    required this.errors,
  });

  final CandidateType? type;
  final ValueChanged<CandidateType> onType;
  final String? internOrJob;
  final ValueChanged<String> onInternOrJob;
  final FieldKind? field;
  final ValueChanged<FieldKind> onField;
  final String? itSpec;
  final ValueChanged<String?> onItSpec;
  final List<String> itLanguages;
  final ValueChanged<List<String>> onItLanguages;
  final List<String> nonItDepartments;
  final ValueChanged<List<String>> onNonItDepartments;
  final int? years;
  final ValueChanged<int?> onYears;
  final List<String> topSkills;
  final ValueChanged<List<String>> onTopSkills;
  final List<WorkExperience> experiences;
  final ValueChanged<List<WorkExperience>> onExperiences;
  final Map<String, String?> errors;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedToggle<CandidateType>(
          large: true,
          value: type,
          onChange: onType,
          options: const [
            SegOption(id: CandidateType.fresher, label: "I'm a Fresher", icon: Icons.school_rounded),
            SegOption(id: CandidateType.experienced, label: "I'm Experienced", icon: Icons.work_rounded),
          ],
        ),
        const SizedBox(height: 18),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          switchInCurve: Curves.easeOut,
          transitionBuilder: (c, anim) => FadeTransition(
            opacity: anim,
            child: SlideTransition(
              position: Tween(begin: const Offset(0, 0.05), end: Offset.zero).animate(anim),
              child: c,
            ),
          ),
          child: type == null
              ? Container(
                  key: const ValueKey('empty'),
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF18181B) : const Color(0xFFFAFAFA),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.08)
                          : const Color(0xFFE4E4E7),
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'Pick Fresher or Experienced above to continue.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.55)
                            : const Color(0xFF71717A),
                      ),
                    ),
                  ),
                )
              : type == CandidateType.fresher
                  ? _FresherBranch(
                      key: const ValueKey('fresher'),
                      isDark: isDark,
                      internOrJob: internOrJob,
                      onInternOrJob: onInternOrJob,
                      field: field,
                      onField: onField,
                      itSpec: itSpec,
                      onItSpec: onItSpec,
                      itLanguages: itLanguages,
                      onItLanguages: onItLanguages,
                      nonItDepartments: nonItDepartments,
                      onNonItDepartments: onNonItDepartments,
                      errors: errors,
                    )
                  : _ExperiencedBranch(
                      key: const ValueKey('exp'),
                      isDark: isDark,
                      years: years,
                      onYears: onYears,
                      topSkills: topSkills,
                      onTopSkills: onTopSkills,
                      experiences: experiences,
                      onExperiences: onExperiences,
                      errors: errors,
                    ),
        ),
        if (errors['type'] != null && errors['type']!.isNotEmpty) ...[
          const SizedBox(height: 10),
          _ErrorBanner(errors['type']!),
        ],
      ],
    );
  }
}

class _FresherBranch extends StatelessWidget {
  const _FresherBranch({
    super.key,
    required this.isDark,
    required this.internOrJob,
    required this.onInternOrJob,
    required this.field,
    required this.onField,
    required this.itSpec,
    required this.onItSpec,
    required this.itLanguages,
    required this.onItLanguages,
    required this.nonItDepartments,
    required this.onNonItDepartments,
    required this.errors,
  });

  final bool isDark;
  final String? internOrJob;
  final ValueChanged<String> onInternOrJob;
  final FieldKind? field;
  final ValueChanged<FieldKind> onField;
  final String? itSpec;
  final ValueChanged<String?> onItSpec;
  final List<String> itLanguages;
  final ValueChanged<List<String>> onItLanguages;
  final List<String> nonItDepartments;
  final ValueChanged<List<String>> onNonItDepartments;
  final Map<String, String?> errors;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Group(
          isDark: isDark,
          icon: Icons.handshake_rounded,
          iconColor: const Color(0xFF059669),
          label: 'What are you looking for?',
          child: SegmentedToggle<String>(
            value: internOrJob,
            onChange: onInternOrJob,
            options: const [
              SegOption(id: 'intern', label: 'Internship / Training'),
              SegOption(id: 'job', label: 'Direct Job'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _Group(
          isDark: isDark,
          icon: Icons.auto_awesome_rounded,
          iconColor: const Color(0xFF7C3AED),
          label: 'Which field interests you?',
          child: SegmentedToggle<FieldKind>(
            value: field,
            onChange: onField,
            options: const [
              SegOption(id: FieldKind.it, label: 'IT', icon: Icons.code_rounded),
              SegOption(id: FieldKind.nonIt, label: 'Non-IT', icon: Icons.business_center_rounded),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (field == FieldKind.it) ...[
          _Group(
            isDark: isDark,
            icon: Icons.code_rounded,
            iconColor: const Color(0xFF0284C7),
            label: 'Pick your IT specialization',
            child: ChipInput(
              value: itSpec != null ? [itSpec!] : const [],
              onChange: (arr) => onItSpec(arr.isEmpty ? null : arr.last),
              max: 1,
              suggestions: _itSpecs,
              placeholder: 'Pick one or type your own',
              hint: 'Choose the area you want to grow in.',
            ),
          ),
          if (errors['itSpecialization'] != null) ...[
            const SizedBox(height: 6),
            _ErrorBanner(errors['itSpecialization']!),
          ],
          const SizedBox(height: 16),
          _Group(
            isDark: isDark,
            icon: Icons.code_rounded,
            iconColor: const Color(0xFF0284C7),
            label: "Languages / tools you're skilled in",
            child: ChipInput(
              value: itLanguages,
              onChange: onItLanguages,
              max: 5,
              placeholder: 'e.g. Python, React, SQL',
              hint: 'Add up to 5 languages or tools you can use in interviews.',
            ),
          ),
          if (errors['itLanguages'] != null) ...[
            const SizedBox(height: 6),
            _ErrorBanner(errors['itLanguages']!),
          ],
          const SizedBox(height: 16),
        ],
        if (field == FieldKind.nonIt) ...[
          _Group(
            isDark: isDark,
            icon: Icons.business_center_rounded,
            iconColor: const Color(0xFFD97706),
            label: "Top 3 departments you'd like to work in",
            child: ChipInput(
              value: nonItDepartments,
              onChange: onNonItDepartments,
              max: 3,
              suggestions: _depts,
              placeholder: 'Pick from suggestions or type your own',
              hint: 'Pick the top 3 in order of priority.',
            ),
          ),
          if (errors['nonItDepartments'] != null) ...[
            const SizedBox(height: 6),
            _ErrorBanner(errors['nonItDepartments']!),
          ],
        ],
      ],
    );
  }
}

class _ExperiencedBranch extends StatefulWidget {
  const _ExperiencedBranch({
    super.key,
    required this.isDark,
    required this.years,
    required this.onYears,
    required this.topSkills,
    required this.onTopSkills,
    required this.experiences,
    required this.onExperiences,
    required this.errors,
  });

  final bool isDark;
  final int? years;
  final ValueChanged<int?> onYears;
  final List<String> topSkills;
  final ValueChanged<List<String>> onTopSkills;
  final List<WorkExperience> experiences;
  final ValueChanged<List<WorkExperience>> onExperiences;
  final Map<String, String?> errors;

  @override
  State<_ExperiencedBranch> createState() => _ExperiencedBranchState();
}

class _ExperiencedBranchState extends State<_ExperiencedBranch> {
  late final TextEditingController _years;

  @override
  void initState() {
    super.initState();
    _years = TextEditingController(text: widget.years?.toString() ?? '');
  }

  @override
  void dispose() {
    _years.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Group(
          isDark: widget.isDark,
          icon: Icons.work_rounded,
          iconColor: const Color(0xFFEA580C),
          label: 'Years of experience',
          child: Row(
            children: [
              SizedBox(
                width: 120,
                child: TextField(
                  controller: _years,
                  keyboardType: TextInputType.number,
                  onChanged: (v) =>
                      widget.onYears(v.isEmpty ? null : int.tryParse(v)),
                  style: TextStyle(
                    fontSize: 14,
                    color: widget.isDark ? Colors.white : const Color(0xFF09090B),
                  ),
                  decoration: InputDecoration(
                    hintText: 'e.g. 4',
                    hintStyle: TextStyle(
                      color: widget.isDark
                          ? Colors.white.withValues(alpha: 0.3)
                          : const Color(0xFFA1A1AA),
                    ),
                    filled: true,
                    fillColor: widget.isDark ? const Color(0xFF09090B) : Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: widget.isDark
                            ? Colors.white.withValues(alpha: 0.12)
                            : const Color(0xFFE4E4E7),
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: widget.isDark
                            ? Colors.white.withValues(alpha: 0.12)
                            : const Color(0xFFE4E4E7),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'years',
                style: TextStyle(
                  fontSize: 13,
                  color: widget.isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A),
                ),
              ),
            ],
          ),
        ),
        if (widget.errors['years'] != null) ...[
          const SizedBox(height: 6),
          _ErrorBanner(widget.errors['years']!),
        ],
        const SizedBox(height: 16),
        _Group(
          isDark: widget.isDark,
          icon: Icons.auto_awesome_rounded,
          iconColor: const Color(0xFF7C3AED),
          label: 'Your top 5 skills',
          child: ChipInput(
            value: widget.topSkills,
            onChange: widget.onTopSkills,
            max: 5,
            placeholder: 'e.g. Backend, Node.js, AWS',
            hint: 'Add the 5 skills that best describe your current expertise.',
          ),
        ),
        if (widget.errors['topSkills'] != null) ...[
          const SizedBox(height: 6),
          _ErrorBanner(widget.errors['topSkills']!),
        ],
        const SizedBox(height: 16),
        _Group(
          isDark: widget.isDark,
          icon: Icons.work_rounded,
          iconColor: const Color(0xFF0284C7),
          label: 'Companies & work periods',
          child: ExperienceList(
            value: widget.experiences,
            onChange: widget.onExperiences,
          ),
        ),
        if (widget.errors['experiences'] != null) ...[
          const SizedBox(height: 6),
          _ErrorBanner(widget.errors['experiences']!),
        ],
      ],
    );
  }
}

class _Group extends StatelessWidget {
  const _Group({
    required this.isDark,
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.child,
  });

  final bool isDark;
  final IconData icon;
  final Color iconColor;
  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: iconColor),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner(this.message);
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        border: Border.all(color: const Color(0xFFFCA5A5)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: 11.5,
          color: Color(0xFFB91C1C),
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
