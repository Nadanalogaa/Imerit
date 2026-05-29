import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';

class _LevelMeta {
  const _LevelMeta(this.level, this.label);
  final EducationLevel level;
  final String label;
}

const _levels = <_LevelMeta>[
  _LevelMeta(EducationLevel.tenth, '10th Standard'),
  _LevelMeta(EducationLevel.twelfth, '12th Standard'),
  _LevelMeta(EducationLevel.diploma, 'Diploma'),
  _LevelMeta(EducationLevel.ug, 'Undergraduate (UG)'),
  _LevelMeta(EducationLevel.pg, 'Postgraduate (PG)'),
  _LevelMeta(EducationLevel.mphil, 'M.Phil'),
  _LevelMeta(EducationLevel.phd, 'Ph.D'),
  _LevelMeta(EducationLevel.other, 'Other Courses'),
];

class EducationStepWidget extends ConsumerWidget {
  const EducationStepWidget({
    super.key,
    required this.value,
    required this.onChange,
  });

  final List<Education> value;
  final ValueChanged<List<Education>> onChange;

  Education _findOrEmpty(EducationLevel level) {
    for (final e in value) {
      if (e.level == level) return e;
    }
    return Education(level: level);
  }

  void _set(EducationLevel level, Education next) {
    final others = value.where((e) => e.level != level).toList();
    others.add(next);
    others.sort(
      (a, b) => _levels.indexWhere((m) => m.level == a.level) -
          _levels.indexWhere((m) => m.level == b.level),
    );
    onChange(others);
  }

  void _toggle(EducationLevel level) {
    final cur = _findOrEmpty(level);
    _set(level, Education(
      level: level,
      enabled: !cur.enabled,
      percentage: cur.percentage,
      passedOutYear: cur.passedOutYear,
      thesis: cur.thesis,
      courseName: cur.courseName,
      institution: cur.institution,
    ));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final addedCount = value.where((e) => e.enabled).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: isDark
                ? LinearGradient(colors: [
                    const Color(0xFFF97316).withValues(alpha: 0.10),
                    const Color(0xFFFCD34D).withValues(alpha: 0.05),
                  ])
                : const LinearGradient(colors: [Color(0xFFFFF7ED), Color(0xFFFEFCE8)]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.06)
                  : const Color(0xFFE4E4E7),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.school_rounded, size: 18, color: Color(0xFFEA580C)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Tick every level you have, then add the details.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF52525B),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.10) : Colors.white,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$addedCount added',
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFC2410C),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ..._levels.map((meta) {
          final edu = _findOrEmpty(meta.level);
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _LevelCard(
              meta: meta,
              edu: edu,
              isDark: isDark,
              onToggle: () => _toggle(meta.level),
              onChange: (next) => _set(meta.level, next),
            ),
          );
        }),
      ],
    );
  }
}

class _LevelCard extends StatelessWidget {
  const _LevelCard({
    required this.meta,
    required this.edu,
    required this.isDark,
    required this.onToggle,
    required this.onChange,
  });

  final _LevelMeta meta;
  final Education edu;
  final bool isDark;
  final VoidCallback onToggle;
  final ValueChanged<Education> onChange;

  @override
  Widget build(BuildContext context) {
    final enabled = edu.enabled;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: enabled
              ? const Color(0xFFF97316)
              : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
          width: enabled ? 1.5 : 1,
        ),
        boxShadow: enabled
            ? [
                BoxShadow(
                  color: const Color(0xFFF97316).withValues(alpha: 0.12),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: enabled ? const Color(0xFFF97316) : Colors.transparent,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: enabled
                            ? const Color(0xFFF97316)
                            : (isDark ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFD4D4D8)),
                        width: 1.5,
                      ),
                    ),
                    child: enabled
                        ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      meta.label,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                  ),
                  if (!enabled)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.add_rounded,
                          size: 14,
                          color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA),
                        ),
                        const SizedBox(width: 2),
                        Text(
                          'Add',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.5)
                                : const Color(0xFFA1A1AA),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            child: enabled
                ? Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                    child: Column(
                      children: [
                        Container(height: 1, color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _MiniField(
                                label: 'Percentage',
                                hint: 'e.g. 85',
                                isDark: isDark,
                                value: edu.percentage?.toString() ?? '',
                                onChanged: (v) {
                                  final n = double.tryParse(v);
                                  if (v.isNotEmpty && n != null && n > 100) return;
                                  onChange(Education(
                                    level: edu.level,
                                    enabled: edu.enabled,
                                    percentage: v.isEmpty ? null : n,
                                    passedOutYear: edu.passedOutYear,
                                    thesis: edu.thesis,
                                    courseName: edu.courseName,
                                    institution: edu.institution,
                                  ));
                                },
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                formatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _MiniField(
                                label: 'Year',
                                hint: 'YYYY',
                                isDark: isDark,
                                value: edu.passedOutYear?.toString() ?? '',
                                onChanged: (v) {
                                  onChange(Education(
                                    level: edu.level,
                                    enabled: edu.enabled,
                                    percentage: edu.percentage,
                                    passedOutYear: v.isEmpty ? null : int.tryParse(v),
                                    thesis: edu.thesis,
                                    courseName: edu.courseName,
                                    institution: edu.institution,
                                  ));
                                },
                                keyboardType: TextInputType.number,
                                formatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  LengthLimitingTextInputFormatter(4),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        _MiniField(
                          label: 'Institution / Board',
                          hint: 'School / college name',
                          isDark: isDark,
                          value: edu.institution ?? '',
                          onChanged: (v) {
                            onChange(Education(
                              level: edu.level,
                              enabled: edu.enabled,
                              percentage: edu.percentage,
                              passedOutYear: edu.passedOutYear,
                              thesis: edu.thesis,
                              courseName: edu.courseName,
                              institution: v.isEmpty ? null : v,
                            ));
                          },
                        ),
                        if (edu.level == EducationLevel.phd) ...[
                          const SizedBox(height: 10),
                          _MiniField(
                            label: 'Thesis title',
                            hint: 'e.g. Multi-modal AI for low-resource languages',
                            isDark: isDark,
                            value: edu.thesis ?? '',
                            onChanged: (v) {
                              onChange(Education(
                                level: edu.level,
                                enabled: edu.enabled,
                                percentage: edu.percentage,
                                passedOutYear: edu.passedOutYear,
                                thesis: v.isEmpty ? null : v,
                                courseName: edu.courseName,
                                institution: edu.institution,
                              ));
                            },
                          ),
                        ],
                        if (edu.level == EducationLevel.other) ...[
                          const SizedBox(height: 10),
                          _MiniField(
                            label: 'Course name',
                            hint: 'e.g. PG Diploma in Data Science',
                            isDark: isDark,
                            value: edu.courseName ?? '',
                            onChanged: (v) {
                              onChange(Education(
                                level: edu.level,
                                enabled: edu.enabled,
                                percentage: edu.percentage,
                                passedOutYear: edu.passedOutYear,
                                thesis: edu.thesis,
                                courseName: v.isEmpty ? null : v,
                                institution: edu.institution,
                              ));
                            },
                          ),
                        ],
                      ],
                    ),
                  )
                : const SizedBox(width: double.infinity),
          ),
        ],
      ),
    );
  }
}

class _MiniField extends StatefulWidget {
  const _MiniField({
    required this.label,
    required this.hint,
    required this.value,
    required this.onChanged,
    required this.isDark,
    this.keyboardType,
    this.formatters,
  });

  final String label;
  final String hint;
  final String value;
  final ValueChanged<String> onChanged;
  final bool isDark;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? formatters;

  @override
  State<_MiniField> createState() => _MiniFieldState();
}

class _MiniFieldState extends State<_MiniField> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.value);
  }

  @override
  void didUpdateWidget(covariant _MiniField old) {
    super.didUpdateWidget(old);
    if (widget.value != _ctrl.text) {
      _ctrl.text = widget.value;
      _ctrl.selection = TextSelection.collapsed(offset: _ctrl.text.length);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: widget.isDark
                ? Colors.white.withValues(alpha: 0.7)
                : const Color(0xFF52525B),
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: _ctrl,
          onChanged: widget.onChanged,
          keyboardType: widget.keyboardType,
          inputFormatters: widget.formatters,
          style: TextStyle(
            fontSize: 13,
            color: widget.isDark ? Colors.white : const Color(0xFF09090B),
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: TextStyle(
              color: widget.isDark
                  ? Colors.white.withValues(alpha: 0.3)
                  : const Color(0xFFA1A1AA),
              fontSize: 12.5,
            ),
            filled: true,
            fillColor: widget.isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: widget.isDark
                    ? Colors.white.withValues(alpha: 0.10)
                    : const Color(0xFFE4E4E7),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: widget.isDark
                    ? Colors.white.withValues(alpha: 0.10)
                    : const Color(0xFFE4E4E7),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.4),
            ),
          ),
        ),
      ],
    );
  }
}
