import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';
import '../../utils/industry_taxonomy.dart';

/// Two side-by-side dropdowns — Industry + Department — driven by the
/// shared taxonomy in `utils/industry_taxonomy.dart`. Kept as a single
/// widget so every surface (candidate profile form, post-job wizard,
/// browse filters, employer candidate search) renders the same look and
/// sends the same strings on the wire.
class IndustryDepartmentPicker extends ConsumerWidget {
  const IndustryDepartmentPicker({
    super.key,
    required this.industry,
    required this.department,
    required this.onIndustry,
    required this.onDepartment,
    this.field,
    this.industryLabel = 'Industry',
    this.departmentLabel = 'Department',
    this.industryHint = 'Select industry',
    this.departmentHint = 'Select department',
    this.dense = false,
  });

  final String? industry;
  final String? department;
  final ValueChanged<String?> onIndustry;
  final ValueChanged<String?> onDepartment;
  /// `'IT'` / `'NON_IT'` narrows the industry list. Null → full list.
  final String? field;
  final String industryLabel;
  final String departmentLabel;
  final String industryHint;
  final String departmentHint;
  /// Stack vertically instead of side-by-side (useful in narrow filter
  /// sheets).
  final bool dense;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final industries = industriesForField(field);
    final industryField = _dropdown(
      isDark: isDark,
      label: industryLabel,
      hint: industryHint,
      value: industries.contains(industry) ? industry : null,
      items: industries,
      onChanged: onIndustry,
    );
    final departmentField = _dropdown(
      isDark: isDark,
      label: departmentLabel,
      hint: departmentHint,
      value: kDepartments.contains(department) ? department : null,
      items: kDepartments,
      onChanged: onDepartment,
    );
    if (dense) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          industryField,
          const SizedBox(height: 12),
          departmentField,
        ],
      );
    }
    return Row(
      children: [
        Expanded(child: industryField),
        const SizedBox(width: 10),
        Expanded(child: departmentField),
      ],
    );
  }

  Widget _dropdown({
    required bool isDark,
    required String label,
    required String hint,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF3F3F46), letterSpacing: 0.2),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          icon: Icon(Icons.expand_more_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A)),
          hint: Text(
            hint,
            style: TextStyle(fontSize: 13, color: isDark ? Colors.white.withValues(alpha: 0.35) : const Color(0xFFA1A1AA)),
          ),
          style: TextStyle(fontSize: 13.5, color: isDark ? Colors.white : const Color(0xFF09090B)),
          dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
          decoration: InputDecoration(
            isDense: true,
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
          items: [
            const DropdownMenuItem<String>(value: null, child: Text('—')),
            ...items.map((i) => DropdownMenuItem<String>(value: i, child: Text(i, overflow: TextOverflow.ellipsis))),
          ],
          onChanged: onChanged,
        ),
      ],
    );
  }
}
