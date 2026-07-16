import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/location_picker.dart';
import '../widgets/post_job/benefit_picker.dart';
import '../widgets/post_job/job_type_grid.dart';
import '../widgets/post_job/skill_chip_input.dart';
import '../widgets/profile/segmented_toggle.dart';
import '../widgets/staff/credential_share_sheet.dart';
import '../widgets/staff/staff_scaffold.dart';

/// Staff post-job. Employer picker at the top opens a full-screen picker
/// (mobile-native typeahead) with a live filter + a "Create new employer"
/// footer that inlines the create fields. On submit, both the new employer
/// AND the job are created in one action and the credential sheet pops.
class StaffPostJobPage extends ConsumerStatefulWidget {
  const StaffPostJobPage({super.key, this.initialEmployerId});

  /// Optional deep-link — when set, the picker starts locked to this
  /// employer so staff jumping in from an employer row lands with the
  /// picker pre-filled.
  final String? initialEmployerId;

  @override
  ConsumerState<StaffPostJobPage> createState() => _StaffPostJobPageState();
}

class _StaffPostJobPageState extends ConsumerState<StaffPostJobPage> {
  User? _employer;

  // Job fields
  final _title = TextEditingController();
  final _description = TextEditingController();
  JobField? _field;
  JobType? _type;
  JobExperience? _experience;
  final _yearsMin = TextEditingController();
  final _yearsMax = TextEditingController();
  final _salary = TextEditingController();
  final _contactEmail = TextEditingController();
  List<String> _skills = [];
  List<JobBenefit> _benefits = [];
  PlaceRef _place = const PlaceRef();

  Map<String, String?> _errors = {};

  @override
  void initState() {
    super.initState();
    if (widget.initialEmployerId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final match = ref
            .read(authProvider.notifier)
            .allUsers()
            .where((u) => u.id == widget.initialEmployerId)
            .toList();
        if (match.isNotEmpty) setState(() => _employer = match.first);
      });
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _yearsMin.dispose();
    _yearsMax.dispose();
    _salary.dispose();
    _contactEmail.dispose();
    super.dispose();
  }

  Future<void> _pickEmployer() async {
    final me = ref.read(authProvider);
    if (me == null) return;
    final result = await Navigator.of(context).push<_PickerResult>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _EmployerPickerPage(myStaffId: me.id),
      ),
    );
    if (result == null) return;
    if (result.existing != null) {
      setState(() {
        _employer = result.existing;
        if (_contactEmail.text.isEmpty) {
          _contactEmail.text = result.existing!.email;
        }
      });
    } else if (result.freshEmployer != null) {
      setState(() {
        _employer = result.freshEmployer;
        if (_contactEmail.text.isEmpty) {
          _contactEmail.text = result.freshEmployer!.email;
        }
      });
      if (result.freshPassword != null && mounted) {
        await CredentialShareSheet.show(
          context,
          title: 'Employer created',
          subtitle: '${_employer!.name} can now sign in via /employer/login',
          email: _employer!.email,
          password: result.freshPassword!,
        );
      }
    }
  }

  Future<void> _submit() async {
    final errs = <String, String?>{};
    if (_employer == null) errs['employer'] = 'Pick or create an employer';
    if (_title.text.trim().isEmpty) errs['title'] = 'Required';
    if (_description.text.trim().length < 20) errs['description'] = 'Add at least a short description';
    if (_field == null) errs['field'] = 'Pick IT or Non-IT';
    if (_type == null) errs['type'] = 'Pick a job type';
    if (_experience == null) errs['experience'] = 'Pick an experience level';
    if (_experience == JobExperience.experienced) {
      final min = int.tryParse(_yearsMin.text);
      if (min == null) errs['yearsMin'] = 'Min years?';
      final max = int.tryParse(_yearsMax.text);
      if (max != null && min != null && max < min) errs['yearsMax'] = 'Max must be ≥ min';
    }
    if (!_place.isSet) errs['location'] = 'Pick district and taluk';
    if (_skills.isEmpty) errs['skills'] = 'Add at least one required skill';
    if (_contactEmail.text.isNotEmpty &&
        !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_contactEmail.text.trim())) {
      errs['contactEmail'] = 'Invalid email';
    }
    setState(() => _errors = errs);
    if (errs.isNotEmpty) {
      HapticFeedback.heavyImpact();
      return;
    }

    final loc = ref.read(locationsProvider);
    final taluk = _place.talukId != null ? loc.talukById(_place.talukId!) : null;
    final label = taluk != null ? '${taluk.taluk.name}, ${taluk.district.name}' : '';

    final job = ref.read(jobsProvider.notifier).addJob(
          employerId: _employer!.id,
          employerName: _employer!.company ?? _employer!.name,
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
          yearsMin: _experience == JobExperience.experienced ? int.tryParse(_yearsMin.text) : null,
          yearsMax: _experience == JobExperience.experienced ? int.tryParse(_yearsMax.text) : null,
          salaryRange: _salary.text.trim().isEmpty ? null : _salary.text.trim(),
          skills: _skills,
          benefits: _benefits,
          contactEmail: _contactEmail.text.trim().isEmpty ? null : _contactEmail.text.trim(),
        );
    HapticFeedback.mediumImpact();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Job posted — live for 45 days', style: TextStyle(fontSize: 12.5)),
        backgroundColor: Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: 2),
      ),
    );
    context.go('/staff/jobs');
    // job unused in this scope after navigation but kept as the return
    // value so the linter doesn't lose it and to signal intent.
    // ignore: unused_local_variable
    final _ = job;
  }

  @override
  Widget build(BuildContext context) {
    return StaffScaffold(
      title: 'Post a job',
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'POST A JOB ON BEHALF OF…',
              style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFFEA580C)),
            ),
            const SizedBox(height: 6),
            const Text(
              'New job posting',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
            ),
            const SizedBox(height: 16),

            // Employer picker card
            _EmployerCard(
              employer: _employer,
              onTap: _pickEmployer,
              error: _errors['employer'],
              onClear: () => setState(() => _employer = null),
            ),
            const SizedBox(height: 16),

            _SectionTitle('Role basics'),
            const SizedBox(height: 8),
            ItrTextField(label: 'Job title', controller: _title, placeholder: 'e.g. Senior React Developer', error: _errors['title']),
            const SizedBox(height: 12),
            _Multiline(controller: _description, error: _errors['description']),
            const SizedBox(height: 14),
            _label('Field'),
            const SizedBox(height: 6),
            SegmentedToggle<JobField>(
              value: _field,
              onChange: (v) => setState(() => _field = v),
              options: const [
                SegOption(id: JobField.it, label: 'IT', icon: Icons.code_rounded),
                SegOption(id: JobField.nonIt, label: 'Non-IT', icon: Icons.business_center_rounded),
              ],
            ),
            if (_errors['field'] != null) _errorText(_errors['field']!),
            const SizedBox(height: 14),
            _label('Job type'),
            const SizedBox(height: 8),
            JobTypeGrid(value: _type, onChange: (v) => setState(() => _type = v)),
            if (_errors['type'] != null) _errorText(_errors['type']!),
            const SizedBox(height: 14),
            _label('Experience'),
            const SizedBox(height: 6),
            SegmentedToggle<JobExperience>(
              value: _experience,
              onChange: (v) => setState(() => _experience = v),
              options: const [
                SegOption(id: JobExperience.fresher, label: 'Fresher'),
                SegOption(id: JobExperience.experienced, label: 'Experienced'),
                SegOption(id: JobExperience.any, label: 'Any'),
              ],
            ),
            if (_errors['experience'] != null) _errorText(_errors['experience']!),
            if (_experience == JobExperience.experienced) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ItrTextField(
                      label: 'Min years',
                      controller: _yearsMin,
                      placeholder: '2',
                      keyboardType: TextInputType.number,
                      maxLength: 2,
                      formatters: [FilteringTextInputFormatter.digitsOnly],
                      error: _errors['yearsMin'],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ItrTextField(
                      label: 'Max years',
                      controller: _yearsMax,
                      placeholder: '5',
                      keyboardType: TextInputType.number,
                      maxLength: 2,
                      formatters: [FilteringTextInputFormatter.digitsOnly],
                      error: _errors['yearsMax'],
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 14),
            ItrTextField(label: 'Salary range (optional)', controller: _salary, placeholder: 'e.g. ₹8–15 LPA'),
            const SizedBox(height: 14),
            ItrTextField(
              label: 'Applications go to (optional)',
              controller: _contactEmail,
              placeholder: _employer?.email ?? 'hiring@company.com',
              keyboardType: TextInputType.emailAddress,
              error: _errors['contactEmail'],
            ),
            const SizedBox(height: 20),

            _SectionTitle('Location'),
            const SizedBox(height: 8),
            LocationPickerWidget(value: _place, onChange: (v) => setState(() => _place = v)),
            if (_errors['location'] != null) _errorText(_errors['location']!),
            const SizedBox(height: 20),

            _SectionTitle('Required skills'),
            const SizedBox(height: 8),
            SkillChipInput(
              value: _skills,
              onChange: (v) => setState(() => _skills = v),
              field: _field ?? JobField.it,
              max: 12,
            ),
            if (_errors['skills'] != null) _errorText(_errors['skills']!),
            const SizedBox(height: 20),

            _SectionTitle('Benefits'),
            const SizedBox(height: 8),
            BenefitPicker(value: _benefits, onChange: (v) => setState(() => _benefits = v)),
            const SizedBox(height: 24),

            ElevatedButton.icon(
              onPressed: _submit,
              icon: const Icon(Icons.send_rounded, size: 16),
              label: const Text('Publish job', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF97316),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 6,
                shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
              ),
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'Posts stay live for 45 days.',
                style: TextStyle(fontSize: 11, color: Color(0xFF71717A)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF3F3F46)),
      );

  Widget _errorText(String text) => Padding(
        padding: const EdgeInsets.only(top: 6),
        child: Text(text, style: const TextStyle(fontSize: 11.5, color: Color(0xFFEF4444), fontWeight: FontWeight.w600)),
      );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10.5,
          letterSpacing: 1.6,
          fontWeight: FontWeight.w800,
          color: Color(0xFF71717A),
        ),
      );
}

class _Multiline extends StatelessWidget {
  const _Multiline({required this.controller, this.error});
  final TextEditingController controller;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Description',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF3F3F46)),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: 5,
          maxLength: 1500,
          style: const TextStyle(fontSize: 13.5, color: Color(0xFF09090B), height: 1.5),
          decoration: InputDecoration(
            counterText: '',
            hintText: "What the role involves, who you're looking for...",
            hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFFA1A1AA)),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.all(12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
            ),
          ),
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444))),
          ),
      ],
    );
  }
}

/* -------------------------- employer picker tile -------------------------- */

class _EmployerCard extends StatelessWidget {
  const _EmployerCard({
    required this.employer,
    required this.onTap,
    required this.onClear,
    this.error,
  });
  final User? employer;
  final VoidCallback onTap;
  final VoidCallback onClear;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final selected = employer != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: selected ? const Color(0xFF10B981).withValues(alpha: 0.05) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: selected ? const Color(0xFF10B981) : (error != null ? const Color(0xFFFCA5A5) : const Color(0xFFE4E4E7)),
          width: selected ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.business_center_rounded, size: 20, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (selected) ...[
                  const Text(
                    'POSTING FOR',
                    style: TextStyle(fontSize: 10, letterSpacing: 1.4, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
                  ),
                  Text(
                    employer!.company ?? employer!.name,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${employer!.name} · ${employer!.email}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF52525B)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ] else ...[
                  const Text(
                    'Employer',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                  ),
                  Text(
                    error ?? 'Tap to pick from the master or create a new one.',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: error != null ? const Color(0xFFB91C1C) : const Color(0xFF71717A),
                      fontWeight: error != null ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (selected)
            IconButton(
              onPressed: onClear,
              icon: const Icon(Icons.close_rounded, size: 16, color: Color(0xFFA1A1AA)),
              tooltip: 'Change employer',
            )
          else
            FilledButton.tonalIcon(
              onPressed: onTap,
              icon: const Icon(Icons.search_rounded, size: 14),
              label: const Text('Pick', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
          if (selected)
            FilledButton.tonalIcon(
              onPressed: onTap,
              icon: const Icon(Icons.swap_horiz_rounded, size: 14),
              label: const Text('Change', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF10B981),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(999),
                  side: const BorderSide(color: Color(0xFF10B981)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/* ---------------------- full-screen employer picker ---------------------- */

class _PickerResult {
  const _PickerResult({this.existing, this.freshEmployer, this.freshPassword});
  final User? existing;
  final User? freshEmployer;
  final String? freshPassword;
}

class _EmployerPickerPage extends ConsumerStatefulWidget {
  const _EmployerPickerPage({required this.myStaffId});
  final String myStaffId;

  @override
  ConsumerState<_EmployerPickerPage> createState() => _EmployerPickerPageState();
}

class _EmployerPickerPageState extends ConsumerState<_EmployerPickerPage> {
  final _query = TextEditingController();
  bool _creating = false;
  final _newName = TextEditingController();
  final _newCompany = TextEditingController();
  final _newEmail = TextEditingController();
  final _newMobile = TextEditingController();
  String? _createError;

  @override
  void dispose() {
    _query.dispose();
    _newName.dispose();
    _newCompany.dispose();
    _newEmail.dispose();
    _newMobile.dispose();
    super.dispose();
  }

  Future<void> _createAndReturn() async {
    setState(() => _createError = null);
    if (_newName.text.trim().isEmpty) {
      setState(() => _createError = 'Enter a contact name');
      return;
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_newEmail.text.trim())) {
      setState(() => _createError = 'Enter a valid email');
      return;
    }
    try {
      final result = ref.read(authProvider.notifier).createEmployerByStaff(
            staffId: widget.myStaffId,
            name: _newName.text.trim(),
            email: _newEmail.text.trim(),
            mobile: _newMobile.text.trim().isEmpty ? null : _newMobile.text.trim(),
            company: _newCompany.text.trim().isEmpty ? null : _newCompany.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).pop(_PickerResult(
        freshEmployer: result.user,
        freshPassword: result.password,
      ));
    } on StateError catch (e) {
      if (e.message == 'EMAIL_TAKEN') {
        setState(() => _createError = 'That email is already taken. Search for it above instead.');
      } else {
        setState(() => _createError = 'Could not create employer.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final users = ref.watch(authProvider.notifier).allUsers();
    final query = _query.text.trim().toLowerCase();
    final employers = users.where((u) {
      if (u.role != Role.employer) return false;
      if (query.isEmpty) return true;
      return u.name.toLowerCase().contains(query) ||
          u.email.toLowerCase().contains(query) ||
          (u.company ?? '').toLowerCase().contains(query);
    }).toList()
      ..sort((a, b) => a.name.compareTo(b.name));

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Pick employer', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _query,
              onChanged: (_) => setState(() {}),
              autofocus: true,
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search_rounded, size: 18),
                hintText: 'Type name, company, email…',
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                ),
              ),
            ),
          ),
          Expanded(
            child: _creating
                ? _buildCreateInline()
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                    children: [
                      if (employers.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(
                            child: Text(
                              'No matches. Create a new employer below.',
                              style: TextStyle(fontSize: 12.5, color: Color(0xFF71717A)),
                            ),
                          ),
                        )
                      else
                        ...employers.map((u) {
                          final yours = u.createdByStaffId == widget.myStaffId;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(14),
                                onTap: () => Navigator.of(context).pop(_PickerResult(existing: u)),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFFE4E4E7)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Center(
                                          child: Text(
                                            u.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join(),
                                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              u.company ?? u.name,
                                              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              '${u.name} · ${u.email}',
                                              style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (yours)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF14B8A6).withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(999),
                                          ),
                                          child: const Text(
                                            'YOURS',
                                            style: TextStyle(fontSize: 8.5, letterSpacing: 1.2, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: () {
                          setState(() {
                            _creating = true;
                            if (_newName.text.isEmpty) _newName.text = _query.text.trim();
                            if (_newCompany.text.isEmpty) _newCompany.text = _query.text.trim();
                          });
                        },
                        icon: const Icon(Icons.person_add_alt_1_rounded, size: 14),
                        label: Text(
                          _query.text.trim().isEmpty
                              ? 'Create new employer'
                              : 'Create "${_query.text.trim()}"',
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF10B981),
                          side: const BorderSide(color: Color(0xFF10B981), width: 1.4),
                          minimumSize: const Size(double.infinity, 44),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCreateInline() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFF92400E)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Creating a new employer generates a password — you'll see it once so you can share it.",
                    style: TextStyle(fontSize: 11.5, color: Color(0xFF92400E), height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          ItrTextField(label: 'Contact name', controller: _newName, placeholder: 'Priya Ramesh', autofocus: true),
          const SizedBox(height: 10),
          ItrTextField(label: 'Company', controller: _newCompany, placeholder: 'Zoho Corporation'),
          const SizedBox(height: 10),
          ItrTextField(
            label: 'Work email',
            controller: _newEmail,
            placeholder: 'priya@zoho.com',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 10),
          ItrTextField(
            label: 'Mobile (optional)',
            controller: _newMobile,
            placeholder: '9876543210',
            keyboardType: TextInputType.phone,
            maxLength: 10,
            formatters: [FilteringTextInputFormatter.digitsOnly],
          ),
          if (_createError != null)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Text(
                  _createError!,
                  style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                ),
              ),
            ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            onPressed: _createAndReturn,
            icon: const Icon(Icons.key_rounded, size: 16),
            label: const Text('Create + generate password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => setState(() => _creating = false),
            child: const Text('← Back to search', style: TextStyle(fontSize: 12.5)),
          ),
        ],
      ),
    );
  }
}
