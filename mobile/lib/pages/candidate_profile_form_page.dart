import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/locations_provider.dart';
import '../store/profile_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/location_picker.dart';
import '../widgets/profile/step_indicator.dart';
import '../widgets/profile/step_shell.dart';
import '../widgets/profile/photo_upload.dart';
import '../widgets/profile/education_step.dart';
import '../widgets/profile/ambition_step.dart';
import '../widgets/profile/about_you_step.dart';
import '../widgets/profile/district_multi_select.dart';
import '../widgets/profile/links_editor.dart';
import '../widgets/profile/template_picker.dart';
import '../widgets/templates/template_data.dart';
import '../widgets/theme_toggle.dart';

const _steps = [
  StepLabel('personal', 'Personal'),
  StepLabel('education', 'Education'),
  StepLabel('ambition', 'Ambition'),
  StepLabel('you', 'About You'),
  StepLabel('preview', 'Preview'),
];

class CandidateProfileFormPage extends ConsumerStatefulWidget {
  const CandidateProfileFormPage({super.key});

  @override
  ConsumerState<CandidateProfileFormPage> createState() =>
      _CandidateProfileFormPageState();
}

class _CandidateProfileFormPageState
    extends ConsumerState<CandidateProfileFormPage> {
  int _step = 0;
  late final TextEditingController _name;
  late final TextEditingController _mobile;
  late final TextEditingController _altMobile;
  late final TextEditingController _shortAmb;
  late final TextEditingController _longAmb;
  String? _photo;
  List<Education> _education = [];
  Map<String, String?> _errors = {};

  // About You
  CandidateType? _type;
  String? _internOrJob;
  FieldKind? _field;
  String? _itSpec;
  List<String> _itLanguages = [];
  List<String> _nonItDepartments = [];
  int? _years;
  List<String> _topSkills = [];
  List<WorkExperience> _experiences = [];

  // Structured locations — current-location is a single PlaceRef (with
  // taluk/pincode/street granularity) while preferred is now a multi-select
  // list of district IDs. Matches the 2026-06 backend migration.
  PlaceRef _currentPlace = const PlaceRef();
  List<String> _preferredDistrictIds = const [];

  // Portfolio / social links — LinkedIn, GitHub, Behance, custom "Other".
  List<ProfileLink> _links = const [];

  // Template
  String? _templateId;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider);
    final profile = ref.read(profileProvider.notifier).of(user!.id);
    _name = TextEditingController(text: user.name);
    _mobile = TextEditingController(text: user.mobile ?? '');
    _altMobile = TextEditingController(text: profile.alternateMobile ?? '');
    _shortAmb = TextEditingController(text: profile.shortTermAmbition ?? '');
    _longAmb = TextEditingController(text: profile.longTermAmbition ?? '');
    _photo = profile.photoDataUrl;
    _education = profile.education;
    _type = profile.type;
    _internOrJob = profile.internOrJob;
    _field = profile.field;
    _itSpec = profile.itSpecialization;
    _itLanguages = profile.itLanguages ?? [];
    _nonItDepartments = profile.nonItDepartments ?? [];
    _years = profile.yearsOfExperience;
    _topSkills = profile.topSkills ?? [];
    _experiences = profile.experiences ?? [];
    _currentPlace = PlaceRef(
      districtId: profile.currentDistrictId,
      talukId: profile.currentTalukId,
      lat: profile.currentLat,
      lng: profile.currentLng,
      pincode: profile.currentPincode,
      street: profile.currentStreet,
    );
    _preferredDistrictIds = profile.preferredDistrictIds;
    _links = profile.links;
    _templateId = profile.selectedTemplateId;
  }

  /// Auto-derived display label from the district multi-select; falls back
  /// to the current-location label, then the legacy stored label. For 2+
  /// preferred districts we render "Chennai + 2 more" so cards stay tight.
  String? _derivedPreferredLabel(LocationsData data, CandidateProfile current) {
    if (_preferredDistrictIds.isNotEmpty) {
      final names = _preferredDistrictIds
          .map((id) => data.districtById(id)?.name)
          .whereType<String>()
          .toList();
      if (names.isNotEmpty) {
        return names.length == 1 ? names.first : '${names.first} + ${names.length - 1} more';
      }
    }
    if (_currentPlace.talukId != null) return _currentPlace.publicLabel(data);
    return current.preferredLocation;
  }

  CandidateProfile _liveProfile(CandidateProfile current) {
    return current.copyWith(
      photoDataUrl: _photo,
      alternateMobile: _altMobile.text.trim().isEmpty ? null : _altMobile.text.trim(),
      shortTermAmbition: _shortAmb.text.trim().isEmpty ? current.shortTermAmbition : _shortAmb.text.trim(),
      longTermAmbition: _longAmb.text.trim().isEmpty ? current.longTermAmbition : _longAmb.text.trim(),
      education: _education.isNotEmpty ? _education : current.education,
      type: _type ?? current.type,
      internOrJob: _internOrJob ?? current.internOrJob,
      field: _field ?? current.field,
      itSpecialization: _itSpec ?? current.itSpecialization,
      itLanguages: _itLanguages.isNotEmpty ? _itLanguages : current.itLanguages,
      nonItDepartments: _nonItDepartments.isNotEmpty ? _nonItDepartments : current.nonItDepartments,
      yearsOfExperience: _years ?? current.yearsOfExperience,
      topSkills: _topSkills.isNotEmpty ? _topSkills : current.topSkills,
      experiences: _experiences.isNotEmpty ? _experiences : current.experiences,
      currentDistrictId: _currentPlace.districtId ?? current.currentDistrictId,
      currentTalukId: _currentPlace.talukId ?? current.currentTalukId,
      currentLat: _currentPlace.lat ?? current.currentLat,
      currentLng: _currentPlace.lng ?? current.currentLng,
      currentPincode: _currentPlace.pincode ?? current.currentPincode,
      currentStreet: _currentPlace.street ?? current.currentStreet,
      preferredDistrictIds:
          _preferredDistrictIds.isNotEmpty ? _preferredDistrictIds : current.preferredDistrictIds,
      links: _links.isNotEmpty ? _links : current.links,
      preferredLocation:
          _derivedPreferredLabel(ref.read(locationsProvider), current) ?? current.preferredLocation,
    );
  }

  User _liveUser(User u) {
    return User(
      id: u.id,
      role: u.role,
      name: _name.text.trim().isEmpty ? u.name : _name.text.trim(),
      email: u.email,
      mobile: _mobile.text.trim().isEmpty ? u.mobile : _mobile.text.trim(),
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    );
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _altMobile.dispose();
    _shortAmb.dispose();
    _longAmb.dispose();
    super.dispose();
  }

  void _onNext() {
    final user = ref.read(authProvider)!;
    final notifier = ref.read(profileProvider.notifier);
    final current = notifier.of(user.id);

    if (_step == 0) {
      final errs = <String, String?>{};
      if (_name.text.trim().isEmpty) errs['name'] = 'Required';
      if (!RegExp(r'^[6-9]\d{9}$').hasMatch(_mobile.text.trim())) {
        errs['mobile'] = 'Enter a valid 10-digit Indian mobile number';
      }
      if (_altMobile.text.trim().isNotEmpty &&
          !RegExp(r'^[6-9]\d{9}$').hasMatch(_altMobile.text.trim())) {
        errs['altMobile'] = 'Enter a valid 10-digit number or leave blank';
      }
      setState(() => _errors = errs);
      if (errs.isNotEmpty) return;
      final locData = ref.read(locationsProvider);
      notifier.update(
        user.id,
        current.copyWith(
          photoDataUrl: _photo,
          alternateMobile: _altMobile.text.trim().isEmpty ? null : _altMobile.text.trim(),
          currentDistrictId: _currentPlace.districtId,
          currentTalukId: _currentPlace.talukId,
          currentLat: _currentPlace.lat,
          currentLng: _currentPlace.lng,
          currentPincode: _currentPlace.pincode,
          currentStreet: _currentPlace.street,
          preferredDistrictIds: _preferredDistrictIds,
          links: _links,
          // Keep the legacy display label in sync with the district picker so
          // cards/lists that read `preferredLocation` keep working.
          preferredLocation: _derivedPreferredLabel(locData, current),
        ),
      );
    }

    if (_step == 1) {
      final enabled = _education.where((e) => e.enabled).toList();
      if (enabled.isEmpty) {
        setState(() => _errors = {'education': 'Add at least one education level'});
        return;
      }
      final incomplete = enabled.any(
        (e) => e.percentage == null || e.passedOutYear == null,
      );
      if (incomplete) {
        setState(() => _errors = {'education': 'Each added level needs percentage and year'});
        return;
      }
      setState(() => _errors = {});
      notifier.update(user.id, current.copyWith(education: _education));
    }

    if (_step == 2) {
      final errs = <String, String?>{};
      if (_shortAmb.text.trim().isEmpty) errs['shortTerm'] = 'Required';
      if (_longAmb.text.trim().isEmpty) errs['longTerm'] = 'Required';
      setState(() => _errors = errs);
      if (errs.isNotEmpty) return;
      notifier.update(
        user.id,
        current.copyWith(
          shortTermAmbition: _shortAmb.text.trim(),
          longTermAmbition: _longAmb.text.trim(),
        ),
      );
    }

    if (_step == 3) {
      final errs = <String, String?>{};
      if (_type == null) errs['type'] = 'Pick Fresher or Experienced';
      if (_type == CandidateType.fresher) {
        if (_internOrJob == null) errs['internOrJob'] = 'Pick one';
        if (_field == null) errs['field'] = 'Pick IT or Non-IT';
        if (_field == FieldKind.it) {
          if (_itSpec == null || _itSpec!.isEmpty) errs['itSpecialization'] = 'Pick a specialization';
          if (_itLanguages.isEmpty) errs['itLanguages'] = 'Add at least one';
        }
        if (_field == FieldKind.nonIt && _nonItDepartments.isEmpty) {
          errs['nonItDepartments'] = 'Add at least one department';
        }
      }
      if (_type == CandidateType.experienced) {
        if (_years == null || _years! <= 0) errs['years'] = 'Enter years of experience';
        if (_topSkills.isEmpty) errs['topSkills'] = 'Add at least one skill';
        if (_experiences.isEmpty) {
          errs['experiences'] = 'Add at least one company';
        } else if (_experiences.any(
            (e) => e.company.trim().isEmpty || e.role.trim().isEmpty || e.fromDate.trim().isEmpty)) {
          errs['experiences'] = 'Each experience needs company, role, and start date';
        }
      }
      setState(() => _errors = errs);
      if (errs.isNotEmpty) return;
      notifier.update(
        user.id,
        current.copyWith(
          type: _type,
          internOrJob: _type == CandidateType.fresher ? _internOrJob : null,
          field: _type == CandidateType.fresher ? _field : null,
          itSpecialization:
              _type == CandidateType.fresher && _field == FieldKind.it ? _itSpec : null,
          itLanguages:
              _type == CandidateType.fresher && _field == FieldKind.it ? _itLanguages : null,
          nonItDepartments: _type == CandidateType.fresher && _field == FieldKind.nonIt
              ? _nonItDepartments
              : null,
          yearsOfExperience: _type == CandidateType.experienced ? _years : null,
          topSkills: _type == CandidateType.experienced ? _topSkills : null,
          experiences: _type == CandidateType.experienced ? _experiences : null,
        ),
      );
    }

    if (_step == _steps.length - 1) {
      if (_templateId == null) {
        setState(() => _errors = {'template': 'Pick a template to continue'});
        return;
      }
      notifier.update(user.id, current.copyWith(selectedTemplateId: _templateId));
      context.go('/candidate/profile/preview');
      return;
    }
    setState(() => _step += 1);
  }

  void _onBack() {
    if (_step == 0) return;
    setState(() {
      _errors = {};
      _step -= 1;
    });
  }

  Widget _stepBody(int step) {
    switch (step) {
      case 0:
        return _PersonalStep(
          name: _name,
          mobile: _mobile,
          altMobile: _altMobile,
          email: ref.watch(authProvider)!.email,
          photo: _photo,
          onPhoto: (v) => setState(() => _photo = v),
          currentPlace: _currentPlace,
          onCurrentPlace: (p) => setState(() => _currentPlace = p),
          preferredDistrictIds: _preferredDistrictIds,
          onPreferredDistrictIds: (v) => setState(() => _preferredDistrictIds = v),
          links: _links,
          onLinks: (v) => setState(() => _links = v),
          errors: _errors,
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            EducationStepWidget(
              value: _education,
              onChange: (next) => setState(() => _education = next),
            ),
            if (_errors['education'] != null && _errors['education']!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _errors['education']!,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        );
      case 2:
        return AmbitionStepWidget(
          shortCtrl: _shortAmb,
          longCtrl: _longAmb,
          shortError: _errors['shortTerm'],
          longError: _errors['longTerm'],
          onChange: () => setState(() {}),
        );
      case 3:
        return AboutYouStepWidget(
          type: _type,
          onType: (v) => setState(() => _type = v),
          internOrJob: _internOrJob,
          onInternOrJob: (v) => setState(() => _internOrJob = v),
          field: _field,
          onField: (v) => setState(() => _field = v),
          itSpec: _itSpec,
          onItSpec: (v) => setState(() => _itSpec = v),
          itLanguages: _itLanguages,
          onItLanguages: (v) => setState(() => _itLanguages = v),
          nonItDepartments: _nonItDepartments,
          onNonItDepartments: (v) => setState(() => _nonItDepartments = v),
          years: _years,
          onYears: (v) => setState(() => _years = v),
          topSkills: _topSkills,
          onTopSkills: (v) => setState(() => _topSkills = v),
          experiences: _experiences,
          onExperiences: (v) => setState(() => _experiences = v),
          errors: _errors,
        );
      case 4:
        final user = ref.watch(authProvider)!;
        final current = ref.read(profileProvider.notifier).of(user.id);
        final data = TemplateData(user: _liveUser(user), profile: _liveProfile(current));
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TemplatePicker(
              data: data,
              selected: _templateId,
              onSelect: (id) => setState(() {
                _templateId = id;
                _errors = {};
              }),
            ),
            if (_errors['template'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _errors['template']!,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFFB91C1C),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        );
      default:
        return const SizedBox.shrink();
    }
  }

  String _stepTitle(int s) => switch (s) {
        0 => 'Personal details',
        1 => 'Education',
        2 => 'Your ambition',
        3 => 'About you',
        _ => 'Preview & template',
      };

  String _stepSubtitle(int s) => switch (s) {
        0 => "A clear photo and your contact details. We've pre-filled what you gave us at sign-up.",
        1 => 'Tick every level you have and fill in the details.',
        2 => "Tell us where you're heading — short and long term.",
        3 => 'Are you a fresher or experienced?',
        _ => 'Pick a profile design and review your details.',
      };

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
          onPressed: () => context.go('/candidate/dashboard'),
        ),
        title: const Text(
          'Build profile',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
        ),
        actions: const [
          ThemeToggle(),
          SizedBox(width: 12),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'BUILD YOUR PROFILE',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Color(0xFFEA580C),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Let's build something employers will love",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.4,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Five short steps. We auto-save as you go — leave any time and come back.',
              style: TextStyle(
                fontSize: 12.5,
                height: 1.5,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : const Color(0xFF52525B),
              ),
            ),
            const SizedBox(height: 22),
            StepIndicator(steps: _steps, current: _step),
            StepShell(
              key: ValueKey(_step),
              title: _stepTitle(_step),
              subtitle: _stepSubtitle(_step),
              onBack: _step > 0 ? _onBack : null,
              onNext: _onNext,
              nextLabel: _step == _steps.length - 1 ? 'Save & finish' : 'Continue',
              isLast: _step == _steps.length - 1,
              child: _stepBody(_step),
            ),
          ],
        ),
      ),
    );
  }
}

class _PersonalStep extends StatelessWidget {
  const _PersonalStep({
    required this.name,
    required this.mobile,
    required this.altMobile,
    required this.email,
    required this.photo,
    required this.onPhoto,
    required this.currentPlace,
    required this.onCurrentPlace,
    required this.preferredDistrictIds,
    required this.onPreferredDistrictIds,
    required this.links,
    required this.onLinks,
    required this.errors,
  });

  final TextEditingController name;
  final TextEditingController mobile;
  final TextEditingController altMobile;
  final String email;
  final String? photo;
  final ValueChanged<String?> onPhoto;
  final PlaceRef currentPlace;
  final ValueChanged<PlaceRef> onCurrentPlace;
  final List<String> preferredDistrictIds;
  final ValueChanged<List<String>> onPreferredDistrictIds;
  final List<ProfileLink> links;
  final ValueChanged<List<ProfileLink>> onLinks;
  final Map<String, String?> errors;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        PhotoUpload(value: photo, onChange: onPhoto),
        const SizedBox(height: 18),
        ItrTextField(label: 'Full name', controller: name, error: errors['name']),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF4F4F5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE4E4E7)),
          ),
          child: Row(
            children: [
              const Icon(Icons.lock_rounded, size: 14, color: Color(0xFF71717A)),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Email',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF52525B)),
                    ),
                    Text(
                      email,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: Color(0xFF18181B)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ItrTextField(
          label: 'Mobile number',
          controller: mobile,
          keyboardType: TextInputType.number,
          maxLength: 10,
          formatters: [FilteringTextInputFormatter.digitsOnly],
          error: errors['mobile'],
        ),
        const SizedBox(height: 12),
        ItrTextField(
          label: 'Alternate mobile (optional)',
          controller: altMobile,
          keyboardType: TextInputType.number,
          maxLength: 10,
          formatters: [FilteringTextInputFormatter.digitsOnly],
          hint: "We'll only use this if your primary number is unreachable.",
          error: errors['altMobile'],
        ),
        const SizedBox(height: 16),
        _LocationSection(
          title: 'Where you live',
          subtitle: 'Optional — helps us show jobs near home.',
          value: currentPlace,
          onChange: onCurrentPlace,
        ),
        const SizedBox(height: 12),
        _SectionShell(
          title: 'Preferred work districts',
          subtitle: "Pick every district you'd work in — we'll rank jobs by proximity to the closest one.",
          icon: Icons.map_rounded,
          child: DistrictMultiSelect(
            value: preferredDistrictIds,
            onChange: onPreferredDistrictIds,
          ),
        ),
        const SizedBox(height: 12),
        _SectionShell(
          title: 'Portfolio & links',
          subtitle: 'LinkedIn, GitHub, portfolio site — anything you want employers to see.',
          icon: Icons.link_rounded,
          child: LinksEditor(value: links, onChange: onLinks),
        ),
      ],
    );
  }
}

class _SectionShell extends StatelessWidget {
  const _SectionShell({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: const Color(0xFFEA580C)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF18181B))),
                    const SizedBox(height: 2),
                    Text(subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _LocationSection extends StatelessWidget {
  const _LocationSection({
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChange,
    this.allowStreet = true,
  });

  final String title;
  final String subtitle;
  final PlaceRef value;
  final ValueChanged<PlaceRef> onChange;
  final bool allowStreet;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: Color(0xFF18181B)),
              ),
              const SizedBox(width: 6),
              const Text('(optional)', style: TextStyle(fontSize: 11, color: Color(0xFFA1A1AA))),
            ],
          ),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: Color(0xFF71717A))),
          const SizedBox(height: 10),
          LocationPickerWidget(
            value: value,
            onChange: onChange,
            allowStreet: allowStreet,
          ),
        ],
      ),
    );
  }
}

