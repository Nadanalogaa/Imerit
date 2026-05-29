import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/location_picker.dart';
import '../widgets/profile/chip_input.dart';
import '../widgets/profile/segmented_toggle.dart';
import '../widgets/theme_toggle.dart';

class EmployerPostJobPage extends ConsumerStatefulWidget {
  const EmployerPostJobPage({super.key});
  @override
  ConsumerState<EmployerPostJobPage> createState() => _EmployerPostJobPageState();
}

class _EmployerPostJobPageState extends ConsumerState<EmployerPostJobPage> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _yearsMin = TextEditingController();
  final _salary = TextEditingController();
  JobField? _field;
  JobType? _type;
  JobExperience? _experience;
  PlaceRef _place = const PlaceRef();
  List<String> _skills = [];
  Map<String, String?> _errors = {};

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _yearsMin.dispose();
    _salary.dispose();
    super.dispose();
  }

  void _submit() {
    final errs = <String, String?>{};
    if (_title.text.trim().isEmpty) errs['title'] = 'Required';
    if (_description.text.trim().isEmpty) errs['description'] = 'Required';
    if (_field == null) errs['field'] = 'Pick IT or Non-IT';
    if (_type == null) errs['type'] = 'Pick a type';
    if (_experience == null) errs['experience'] = 'Pick experience level';
    if (!_place.isSet) errs['location'] = 'Pick district and taluk';
    if (_skills.isEmpty) errs['skills'] = 'Add at least one required skill';
    setState(() => _errors = errs);
    if (errs.isNotEmpty) return;

    final loc = ref.read(locationsProvider);
    final taluk = _place.talukId != null ? loc.talukById(_place.talukId!) : null;
    final label = taluk != null ? '${taluk.taluk.name}, ${taluk.district.name}' : '';

    final user = ref.read(authProvider)!;
    final job = ref.read(jobsProvider.notifier).addJob(
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
          yearsMin: _yearsMin.text.isEmpty ? null : int.tryParse(_yearsMin.text),
          salaryRange: _salary.text.trim().isEmpty ? null : _salary.text.trim(),
          skills: _skills,
        );
    context.go('/employer/jobs/${job.id}/applicants');
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
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/dashboard')),
        title: const Text('Post a job', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('POST A JOB', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
            const SizedBox(height: 6),
            Text('List a new opening', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: isDark ? Colors.white : const Color(0xFF09090B))),
            const SizedBox(height: 6),
            Text('Job posting is free. Candidates with matching skills will see it sorted by fit.', style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFF5F3FF), Color(0xFFFDF2F8)]),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE9D5FF)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline_rounded, size: 18, color: Color(0xFF7C3AED)),
                  SizedBox(width: 8),
                  Expanded(child: Text('Be specific. Required skills + location + experience drive the match score.', style: TextStyle(fontSize: 12, height: 1.45, color: Color(0xFF52525B)))),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ItrTextField(label: 'Job title', controller: _title, placeholder: 'e.g. Senior React Developer', error: _errors['title']),
                  const SizedBox(height: 14),
                  Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _description,
                    maxLines: 5,
                    maxLength: 1500,
                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : const Color(0xFF09090B)),
                    decoration: InputDecoration(
                      hintText: "What the role involves, who you're looking for...",
                      hintStyle: TextStyle(fontSize: 13, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
                      counterText: '',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5)),
                    ),
                  ),
                  if (_errors['description'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['description']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 14),
                  Text('Field', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
                  const SizedBox(height: 6),
                  SegmentedToggle<JobField>(
                    value: _field,
                    onChange: (v) => setState(() => _field = v),
                    options: const [
                      SegOption(id: JobField.it, label: 'IT', icon: Icons.code_rounded),
                      SegOption(id: JobField.nonIt, label: 'Non-IT', icon: Icons.business_center_rounded),
                    ],
                  ),
                  if (_errors['field'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['field']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 14),
                  Text('Job type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
                  const SizedBox(height: 6),
                  SegmentedToggle<JobType>(
                    value: _type,
                    onChange: (v) => setState(() => _type = v),
                    options: const [
                      SegOption(id: JobType.fullTime, label: 'Full-time'),
                      SegOption(id: JobType.internship, label: 'Intern'),
                      SegOption(id: JobType.contract, label: 'Contract'),
                    ],
                  ),
                  if (_errors['type'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['type']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 14),
                  Text('Experience', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
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
                  if (_experience == JobExperience.experienced) ...[
                    const SizedBox(height: 12),
                    ItrTextField(
                      label: 'Minimum years required',
                      controller: _yearsMin,
                      placeholder: 'e.g. 3',
                      keyboardType: TextInputType.number,
                      formatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(2)],
                    ),
                  ],
                  if (_errors['experience'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['experience']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 14),
                  Text('Job location', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
                  const SizedBox(height: 6),
                  LocationPickerWidget(
                    value: _place,
                    onChange: (p) => setState(() => _place = p),
                  ),
                  if (_errors['location'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['location']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 14),
                  ItrTextField(label: 'Salary range (optional)', controller: _salary, placeholder: 'e.g. ₹3 – 5 LPA'),
                  const SizedBox(height: 14),
                  Text('Required skills', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46))),
                  const SizedBox(height: 6),
                  ChipInput(
                    value: _skills,
                    onChange: (v) => setState(() => _skills = v),
                    max: 8,
                    placeholder: 'e.g. React, Node.js, AWS',
                    hint: "Add the skills you'll match candidates against.",
                  ),
                  if (_errors['skills'] != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(_errors['skills']!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
                  const SizedBox(height: 18),
                  ElevatedButton.icon(
                    onPressed: _submit,
                    icon: const Icon(Icons.send_rounded, size: 16),
                    label: const Text("Post job — it's free", style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0EA5E9),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 6,
                      shadowColor: const Color(0xFF0EA5E9).withValues(alpha: 0.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
