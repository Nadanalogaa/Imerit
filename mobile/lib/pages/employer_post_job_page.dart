import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/location_picker.dart';
import '../widgets/post_job/benefit_picker.dart';
import '../widgets/post_job/job_type_grid.dart';
import '../widgets/post_job/salary_range_sheet.dart';
import '../widgets/post_job/skill_chip_input.dart';
import '../widgets/profile/segmented_toggle.dart';
import '../widgets/profile/step_indicator.dart';
import '../widgets/theme_toggle.dart';

/// Five-step post-job wizard mirroring the web `EmployerPostJob` flow.
/// Split across a PageView so each step animates in as a full sheet — the
/// mobile equivalent of the web's card-per-step layout, but with the finger-
/// swipe affordance native to touch users. Every selection surface uses a
/// unique interaction pattern (segmented, grid tiles, sheet picker, chip
/// input, checkbox grid) so the wizard reads as varied instead of monotone.
const _wizardSteps = [
  StepLabel('basics', 'Basics'),
  StepLabel('role', 'Role'),
  StepLabel('skills', 'Skills'),
  StepLabel('location', 'Location'),
  StepLabel('preview', 'Preview'),
];

class EmployerPostJobPage extends ConsumerStatefulWidget {
  const EmployerPostJobPage({super.key});
  @override
  ConsumerState<EmployerPostJobPage> createState() => _EmployerPostJobPageState();
}

class _EmployerPostJobPageState extends ConsumerState<EmployerPostJobPage> {
  int _step = 0;
  final _pager = PageController();

  // Step 1 — Basics
  final _title = TextEditingController();
  final _description = TextEditingController();
  JobField? _field;

  // Step 2 — Role
  JobType? _type;
  JobExperience? _experience;
  int? _yearsMin;
  int? _yearsMax;
  SalaryRange? _salary;

  // Step 3 — Skills & benefits
  List<String> _skills = [];
  List<JobBenefit> _benefits = [];

  // Step 4 — Location + contact
  PlaceRef _place = const PlaceRef();
  final _contactEmail = TextEditingController();

  Map<String, String?> _errors = {};

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _contactEmail.dispose();
    _pager.dispose();
    super.dispose();
  }

  bool _validate(int step) {
    final errs = <String, String?>{};
    if (step == 0) {
      if (_title.text.trim().isEmpty) errs['title'] = 'Give the role a title';
      if (_description.text.trim().length < 20) {
        errs['description'] = 'A few lines about the role goes a long way';
      }
      if (_field == null) errs['field'] = 'Pick IT or Non-IT';
    }
    if (step == 1) {
      if (_type == null) errs['type'] = 'Pick a job type';
      if (_experience == null) errs['experience'] = 'Pick an experience level';
      if (_experience == JobExperience.experienced) {
        if (_yearsMin == null) errs['yearsMin'] = 'Minimum years?';
        if (_yearsMax != null && _yearsMin != null && _yearsMax! < _yearsMin!) {
          errs['yearsMax'] = 'Max must be ≥ min';
        }
      }
    }
    if (step == 2) {
      if (_skills.isEmpty) errs['skills'] = 'Add at least one required skill';
    }
    if (step == 3) {
      if (!_place.isSet) errs['location'] = 'Pick district and taluk';
      if (_contactEmail.text.trim().isNotEmpty &&
          !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(_contactEmail.text.trim())) {
        errs['contactEmail'] = 'That doesn\'t look like a valid email';
      }
    }
    setState(() => _errors = errs);
    return errs.isEmpty;
  }

  void _next() {
    if (!_validate(_step)) {
      HapticFeedback.heavyImpact();
      return;
    }
    HapticFeedback.lightImpact();
    if (_step < _wizardSteps.length - 1) {
      setState(() => _step += 1);
      _pager.animateToPage(_step, duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step == 0) return;
    HapticFeedback.selectionClick();
    setState(() => _step -= 1);
    _pager.animateToPage(_step, duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic);
  }

  Future<void> _submit() async {
    final loc = ref.read(locationsProvider);
    final taluk = _place.talukId != null ? loc.talukById(_place.talukId!) : null;
    final label = taluk != null ? '${taluk.taluk.name}, ${taluk.district.name}' : '';
    final user = ref.read(authProvider)!;
    late final Job job;
    try {
      job = await ref.read(jobsProvider.notifier).addJobAsync(
            employerId: user.id,
            employerName: user.company ?? user.name,
            title: _title.text.trim(),
            description: _description.text.trim(),
            location: label,
            districtId: _place.districtId,
            talukId: _place.talukId,
            lat: _place.lat,
            lng: _place.lng,
            pincode: _place.pincode,
            street: _place.street,
            field: _field!,
            type: _type!,
            experience: _experience!,
            yearsMin: _experience == JobExperience.experienced ? _yearsMin : null,
            yearsMax: _experience == JobExperience.experienced ? _yearsMax : null,
            salaryRange: _salary?.display(),
            skills: _skills,
            benefits: _benefits,
            contactEmail: _contactEmail.text.trim().isEmpty ? null : _contactEmail.text.trim(),
          );
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not post job: ${err is ApiError ? err.message : err}')),
        );
      }
      return;
    }
    HapticFeedback.mediumImpact();
    if (mounted) context.go('/employer/jobs/${job.id}/applicants');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => _step > 0 ? _back() : context.go('/employer/dashboard'),
        ),
        title: const Text('Post a job', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: StepIndicator(steps: _wizardSteps, current: _step),
            ),
            Expanded(
              child: PageView(
                controller: _pager,
                // Steps are gated by validation — swipe would let users skip
                // required fields, so we lock it to programmatic control.
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (i) => setState(() => _step = i),
                children: [
                  _StepScroll(child: _BasicsStep(
                    title: _title,
                    description: _description,
                    field: _field,
                    onField: (v) => setState(() => _field = v),
                    errors: _errors,
                    isDark: isDark,
                  )),
                  _StepScroll(child: _RoleStep(
                    type: _type,
                    onType: (v) {
                      HapticFeedback.selectionClick();
                      setState(() => _type = v);
                    },
                    experience: _experience,
                    onExperience: (v) => setState(() => _experience = v),
                    yearsMin: _yearsMin,
                    yearsMax: _yearsMax,
                    onYearsMin: (v) => setState(() => _yearsMin = v),
                    onYearsMax: (v) => setState(() => _yearsMax = v),
                    salary: _salary,
                    onSalary: (v) => setState(() => _salary = v),
                    errors: _errors,
                    isDark: isDark,
                  )),
                  _StepScroll(child: _SkillsStep(
                    field: _field ?? JobField.it,
                    skills: _skills,
                    onSkills: (v) => setState(() => _skills = v),
                    benefits: _benefits,
                    onBenefits: (v) => setState(() => _benefits = v),
                    errors: _errors,
                    isDark: isDark,
                  )),
                  _StepScroll(child: _LocationStep(
                    place: _place,
                    onPlace: (p) => setState(() => _place = p),
                    contactEmail: _contactEmail,
                    errors: _errors,
                    isDark: isDark,
                  )),
                  _StepScroll(child: _PreviewStep(
                    title: _title.text.trim(),
                    description: _description.text.trim(),
                    field: _field,
                    type: _type,
                    experience: _experience,
                    yearsMin: _yearsMin,
                    yearsMax: _yearsMax,
                    salary: _salary?.display(),
                    skills: _skills,
                    benefits: _benefits,
                    location: _place,
                    isDark: isDark,
                  )),
                ],
              ),
            ),
            _WizardFooter(
              step: _step,
              total: _wizardSteps.length,
              onBack: _step > 0 ? _back : null,
              onNext: _next,
              isDark: isDark,
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step scaffolding
// ---------------------------------------------------------------------------

class _StepScroll extends StatelessWidget {
  const _StepScroll({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: child,
    );
  }
}

class _WizardFooter extends StatelessWidget {
  const _WizardFooter({
    required this.step,
    required this.total,
    required this.onBack,
    required this.onNext,
    required this.isDark,
  });
  final int step;
  final int total;
  final VoidCallback? onBack;
  final VoidCallback onNext;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final isLast = step == total - 1;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom * 0),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        border: Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7))),
      ),
      child: Row(
        children: [
          if (onBack != null)
            OutlinedButton.icon(
              onPressed: onBack,
              icon: const Icon(Icons.arrow_back_rounded, size: 16),
              label: const Text('Back', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                side: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.15) : const Color(0xFFE4E4E7)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
              ),
            ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: onNext,
            icon: Icon(isLast ? Icons.send_rounded : Icons.arrow_forward_rounded, size: 16),
            label: Text(
              isLast ? 'Post job' : 'Continue',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
              backgroundColor: const Color(0xFFF97316),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              elevation: 6,
              shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Basics: title, description, field
// ---------------------------------------------------------------------------

class _BasicsStep extends StatelessWidget {
  const _BasicsStep({
    required this.title,
    required this.description,
    required this.field,
    required this.onField,
    required this.errors,
    required this.isDark,
  });
  final TextEditingController title;
  final TextEditingController description;
  final JobField? field;
  final ValueChanged<JobField> onField;
  final Map<String, String?> errors;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          eyebrow: 'STEP 1 · BASICS',
          title: 'What are you hiring for?',
          subtitle: 'A clear title and description helps candidates match the role.',
          icon: Icons.article_rounded,
          tone: Color(0xFF0EA5E9),
        ),
        const SizedBox(height: 18),
        ItrTextField(
          label: 'Job title',
          controller: title,
          placeholder: 'e.g. Senior React Developer',
          error: errors['title'],
        ),
        const SizedBox(height: 14),
        _MultilineField(
          label: 'Description',
          controller: description,
          hint: "What the role involves, who you're looking for, what a great week looks like...",
          maxLength: 1500,
          error: errors['description'],
          isDark: isDark,
        ),
        const SizedBox(height: 14),
        _LabelText('Field'),
        const SizedBox(height: 6),
        SegmentedToggle<JobField>(
          value: field,
          onChange: onField,
          options: const [
            SegOption(id: JobField.it, label: 'IT', icon: Icons.code_rounded),
            SegOption(id: JobField.nonIt, label: 'Non-IT', icon: Icons.business_center_rounded),
          ],
        ),
        if (errors['field'] != null) _ErrorText(errors['field']!),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 2 — Role: type, experience, salary
// ---------------------------------------------------------------------------

class _RoleStep extends StatelessWidget {
  const _RoleStep({
    required this.type,
    required this.onType,
    required this.experience,
    required this.onExperience,
    required this.yearsMin,
    required this.yearsMax,
    required this.onYearsMin,
    required this.onYearsMax,
    required this.salary,
    required this.onSalary,
    required this.errors,
    required this.isDark,
  });

  final JobType? type;
  final ValueChanged<JobType> onType;
  final JobExperience? experience;
  final ValueChanged<JobExperience> onExperience;
  final int? yearsMin;
  final int? yearsMax;
  final ValueChanged<int?> onYearsMin;
  final ValueChanged<int?> onYearsMax;
  final SalaryRange? salary;
  final ValueChanged<SalaryRange?> onSalary;
  final Map<String, String?> errors;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          eyebrow: 'STEP 2 · ROLE',
          title: 'What kind of role is it?',
          subtitle: 'Pick a type, tell us the experience level, and set the pay range.',
          icon: Icons.workspaces_rounded,
          tone: Color(0xFF8B5CF6),
        ),
        const SizedBox(height: 18),
        _LabelText('Job type'),
        const SizedBox(height: 8),
        JobTypeGrid(value: type, onChange: onType),
        if (errors['type'] != null) _ErrorText(errors['type']!),
        const SizedBox(height: 18),
        _LabelText('Experience'),
        const SizedBox(height: 6),
        SegmentedToggle<JobExperience>(
          value: experience,
          onChange: onExperience,
          options: const [
            SegOption(id: JobExperience.fresher, label: 'Fresher'),
            SegOption(id: JobExperience.experienced, label: 'Experienced'),
            SegOption(id: JobExperience.any, label: 'Any'),
          ],
        ),
        if (errors['experience'] != null) _ErrorText(errors['experience']!),
        AnimatedSize(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          child: experience == JobExperience.experienced
              ? Padding(
                  padding: const EdgeInsets.only(top: 14),
                  child: _YearsRange(
                    min: yearsMin,
                    max: yearsMax,
                    onMin: onYearsMin,
                    onMax: onYearsMax,
                    errors: errors,
                    isDark: isDark,
                  ),
                )
              : const SizedBox.shrink(),
        ),
        const SizedBox(height: 18),
        _LabelText('Salary range (optional)'),
        const SizedBox(height: 6),
        _SalaryButton(
          value: salary,
          onChange: onSalary,
          isDark: isDark,
        ),
      ],
    );
  }
}

class _YearsRange extends StatelessWidget {
  const _YearsRange({
    required this.min,
    required this.max,
    required this.onMin,
    required this.onMax,
    required this.errors,
    required this.isDark,
  });
  final int? min;
  final int? max;
  final ValueChanged<int?> onMin;
  final ValueChanged<int?> onMax;
  final Map<String, String?> errors;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _NumField(
            label: 'Min years',
            hint: '2',
            value: min,
            onChanged: onMin,
            isDark: isDark,
            error: errors['yearsMin'],
          ),
        ),
        const SizedBox(width: 8),
        const Padding(
          padding: EdgeInsets.only(top: 24),
          child: Icon(Icons.remove_rounded, size: 14, color: Color(0xFF71717A)),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _NumField(
            label: 'Max years',
            hint: '5',
            value: max,
            onChanged: onMax,
            isDark: isDark,
            error: errors['yearsMax'],
          ),
        ),
      ],
    );
  }
}

class _NumField extends StatefulWidget {
  const _NumField({
    required this.label,
    required this.hint,
    required this.value,
    required this.onChanged,
    required this.isDark,
    this.error,
  });
  final String label;
  final String hint;
  final int? value;
  final ValueChanged<int?> onChanged;
  final bool isDark;
  final String? error;

  @override
  State<_NumField> createState() => _NumFieldState();
}

class _NumFieldState extends State<_NumField> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.value?.toString() ?? '');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(widget.label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B))),
        const SizedBox(height: 6),
        TextField(
          controller: _ctrl,
          onChanged: (v) => widget.onChanged(int.tryParse(v)),
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(2)],
          style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
          decoration: InputDecoration(
            hintText: widget.hint,
            isDense: true,
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
            ),
          ),
        ),
        if (widget.error != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(widget.error!, style: const TextStyle(fontSize: 10.5, color: Color(0xFFE11D48)))),
      ],
    );
  }
}

class _SalaryButton extends StatelessWidget {
  const _SalaryButton({required this.value, required this.onChange, required this.isDark});
  final SalaryRange? value;
  final ValueChanged<SalaryRange?> onChange;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () async {
          HapticFeedback.selectionClick();
          final result = await showModalBottomSheet<SalaryRange?>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => SalaryRangeSheet(initial: value, isDark: isDark),
          );
          if (result != null) onChange(result);
        },
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: value != null
                ? const LinearGradient(colors: [Color(0xFFECFDF5), Color(0xFFF0FDF4)])
                : null,
            color: value == null ? (isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA)) : null,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: value != null
                  ? const Color(0xFF10B981)
                  : (isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
              width: value != null ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.currency_rupee_rounded, size: 18, color: Color(0xFF059669)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value?.display() ?? 'Set salary range',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: value != null ? const Color(0xFF047857) : (isDark ? Colors.white : const Color(0xFF09090B)),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value != null ? 'Tap to adjust' : 'Tap to pick range and unit',
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Skills & Benefits
// ---------------------------------------------------------------------------

class _SkillsStep extends StatelessWidget {
  const _SkillsStep({
    required this.field,
    required this.skills,
    required this.onSkills,
    required this.benefits,
    required this.onBenefits,
    required this.errors,
    required this.isDark,
  });
  final JobField field;
  final List<String> skills;
  final ValueChanged<List<String>> onSkills;
  final List<JobBenefit> benefits;
  final ValueChanged<List<JobBenefit>> onBenefits;
  final Map<String, String?> errors;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          eyebrow: 'STEP 3 · SKILLS & PERKS',
          title: 'What matters most?',
          subtitle: 'Add the required skills and highlight the perks candidates will love.',
          icon: Icons.psychology_rounded,
          tone: Color(0xFF6366F1),
        ),
        const SizedBox(height: 18),
        _LabelText('Required skills'),
        const SizedBox(height: 6),
        SkillChipInput(
          value: skills,
          onChange: onSkills,
          field: field,
          max: 12,
        ),
        if (errors['skills'] != null) _ErrorText(errors['skills']!),
        const SizedBox(height: 18),
        _LabelText('Benefits & perks'),
        const SizedBox(height: 6),
        BenefitPicker(value: benefits, onChange: onBenefits),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 4 — Location + contact email
// ---------------------------------------------------------------------------

class _LocationStep extends StatelessWidget {
  const _LocationStep({
    required this.place,
    required this.onPlace,
    required this.contactEmail,
    required this.errors,
    required this.isDark,
  });
  final PlaceRef place;
  final ValueChanged<PlaceRef> onPlace;
  final TextEditingController contactEmail;
  final Map<String, String?> errors;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          eyebrow: 'STEP 4 · LOCATION',
          title: 'Where will they work?',
          subtitle: 'Pick the taluk — candidates will see distance from their preferred districts.',
          icon: Icons.place_rounded,
          tone: Color(0xFFF97316),
        ),
        const SizedBox(height: 18),
        LocationPickerWidget(value: place, onChange: onPlace),
        if (errors['location'] != null) _ErrorText(errors['location']!),
        const SizedBox(height: 18),
        _LabelText('Contact email (optional)'),
        const SizedBox(height: 6),
        TextField(
          controller: contactEmail,
          keyboardType: TextInputType.emailAddress,
          style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF09090B)),
          decoration: InputDecoration(
            hintText: 'hiring@your-company.com',
            hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
            prefixIcon: Icon(Icons.mail_rounded, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
            isDense: true,
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
            ),
          ),
        ),
        if (errors['contactEmail'] != null) _ErrorText(errors['contactEmail']!),
        const SizedBox(height: 8),
        Text(
          "Applications land in your dashboard by default. Add an email if you want a copy.",
          style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A)),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Step 5 — Preview
// ---------------------------------------------------------------------------

class _PreviewStep extends ConsumerWidget {
  const _PreviewStep({
    required this.title,
    required this.description,
    required this.field,
    required this.type,
    required this.experience,
    required this.yearsMin,
    required this.yearsMax,
    required this.salary,
    required this.skills,
    required this.benefits,
    required this.location,
    required this.isDark,
  });

  final String title;
  final String description;
  final JobField? field;
  final JobType? type;
  final JobExperience? experience;
  final int? yearsMin;
  final int? yearsMax;
  final String? salary;
  final List<String> skills;
  final List<JobBenefit> benefits;
  final PlaceRef location;
  final bool isDark;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(locationsProvider);
    final placeLabel = location.publicLabel(data);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _StepHeader(
          eyebrow: 'STEP 5 · REVIEW',
          title: 'Ready to publish?',
          subtitle: "Here's how candidates will see it. Post to make it live for 45 days.",
          icon: Icons.visibility_rounded,
          tone: Color(0xFF10B981),
        ),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title.isEmpty ? 'Untitled role' : title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (field != null) _MiniPill(icon: field == JobField.it ? Icons.code_rounded : Icons.business_center_rounded, label: fieldLabel[field]!, color: field == JobField.it ? const Color(0xFF0EA5E9) : const Color(0xFFF97316)),
                  if (type != null) _MiniPill(icon: typeIcon[type]!, label: typeLabelShort[type]!, color: typeTone[type]!),
                  if (experience != null)
                    _MiniPill(
                      icon: Icons.timeline_rounded,
                      label: experience == JobExperience.fresher
                          ? 'Fresher'
                          : experience == JobExperience.any
                              ? 'Any experience'
                              : (yearsMin != null && yearsMax != null ? '$yearsMin–$yearsMax yrs' : (yearsMin != null ? '$yearsMin+ yrs' : 'Experienced')),
                      color: const Color(0xFF8B5CF6),
                    ),
                  _MiniPill(icon: Icons.place_rounded, label: placeLabel, color: const Color(0xFF71717A)),
                ],
              ),
              if (salary != null && salary!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(salary!, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
              ],
              const SizedBox(height: 14),
              Text(description.isEmpty ? 'No description yet.' : description, style: TextStyle(fontSize: 12.5, height: 1.5, color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B))),
              if (skills.isNotEmpty) ...[
                const SizedBox(height: 14),
                const Text('SKILLS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: Color(0xFF71717A))),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: skills.map((s) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.10),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(s, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF4F46E5))),
                  )).toList(),
                ),
              ],
              if (benefits.isNotEmpty) ...[
                const SizedBox(height: 14),
                const Text('BENEFITS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: Color(0xFF71717A))),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: benefits.map((b) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: benefitTone[b]!.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(benefitIcon[b]!, size: 11, color: benefitTone[b]),
                        const SizedBox(width: 4),
                        Text(benefitLabel[b]!, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: benefitTone[b])),
                      ],
                    ),
                  )).toList(),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF97316).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.25)),
          ),
          child: const Row(
            children: [
              Icon(Icons.timer_outlined, size: 16, color: Color(0xFFC2410C)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'This job stays live for 45 days. You can repost it from "My jobs" any time.',
                  style: TextStyle(fontSize: 11.5, height: 1.4, color: Color(0xFF7C2D12), fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

class _StepHeader extends StatelessWidget {
  const _StepHeader({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tone,
  });
  final String eyebrow;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [tone.withValues(alpha: 0.15), tone.withValues(alpha: 0.05)]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: tone.withValues(alpha: 0.25)),
          ),
          child: Icon(icon, size: 20, color: tone),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(eyebrow, style: TextStyle(fontSize: 10, letterSpacing: 1.8, fontWeight: FontWeight.w800, color: tone)),
              const SizedBox(height: 4),
              Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(fontSize: 12.5, height: 1.45, color: Color(0xFF52525B))),
            ],
          ),
        ),
      ],
    );
  }
}

class _MultilineField extends StatelessWidget {
  const _MultilineField({
    required this.label,
    required this.controller,
    required this.hint,
    required this.maxLength,
    required this.isDark,
    this.error,
  });
  final String label;
  final TextEditingController controller;
  final String hint;
  final int maxLength;
  final bool isDark;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _LabelText(label),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: 6,
          maxLength: maxLength,
          style: TextStyle(fontSize: 13.5, color: isDark ? Colors.white : const Color(0xFF09090B), height: 1.5),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            counterText: '',
            contentPadding: const EdgeInsets.all(12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
            ),
          ),
        ),
        if (error != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(error!, style: const TextStyle(fontSize: 11, color: Color(0xFFE11D48)))),
      ],
    );
  }
}

class _LabelText extends StatelessWidget {
  const _LabelText(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF3F3F46), letterSpacing: 0.2));
}

class _ErrorText extends StatelessWidget {
  const _ErrorText(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(top: 6), child: Text(text, style: const TextStyle(fontSize: 11.5, color: Color(0xFFE11D48), fontWeight: FontWeight.w600)));
}

class _MiniPill extends StatelessWidget {
  const _MiniPill({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 11, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }
}
