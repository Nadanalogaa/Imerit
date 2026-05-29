import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/profile_provider.dart';
import '../../store/theme_provider.dart';

class ExperienceList extends ConsumerWidget {
  const ExperienceList({
    super.key,
    required this.value,
    required this.onChange,
  });

  final List<WorkExperience> value;
  final ValueChanged<List<WorkExperience>> onChange;

  void _add() {
    onChange([
      ...value,
      const WorkExperience(company: '', role: '', fromDate: '', toDate: null),
    ]);
  }

  void _remove(int i) {
    final next = [...value]..removeAt(i);
    onChange(next);
  }

  void _update(int i, WorkExperience next) {
    final list = [...value];
    list[i] = next;
    onChange(list);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ...List.generate(value.length, (i) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _ExpCard(
              index: i,
              exp: value[i],
              isDark: isDark,
              onUpdate: (next) => _update(i, next),
              onRemove: () => _remove(i),
            ),
          );
        }),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _add,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.15)
                      : const Color(0xFFD4D4D8),
                  style: BorderStyle.solid,
                  width: 1.5,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_rounded,
                    size: 16,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.7)
                        : const Color(0xFF52525B),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Add a company',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.8)
                          : const Color(0xFF52525B),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ExpCard extends StatefulWidget {
  const _ExpCard({
    required this.index,
    required this.exp,
    required this.isDark,
    required this.onUpdate,
    required this.onRemove,
  });

  final int index;
  final WorkExperience exp;
  final bool isDark;
  final ValueChanged<WorkExperience> onUpdate;
  final VoidCallback onRemove;

  @override
  State<_ExpCard> createState() => _ExpCardState();
}

class _ExpCardState extends State<_ExpCard> {
  late final TextEditingController _company;
  late final TextEditingController _role;
  late final TextEditingController _from;
  late final TextEditingController _to;
  bool _present = false;

  @override
  void initState() {
    super.initState();
    _company = TextEditingController(text: widget.exp.company);
    _role = TextEditingController(text: widget.exp.role);
    _from = TextEditingController(text: widget.exp.fromDate);
    _to = TextEditingController(text: widget.exp.toDate ?? '');
    _present = widget.exp.toDate == null && widget.exp.fromDate.isNotEmpty;
  }

  @override
  void dispose() {
    _company.dispose();
    _role.dispose();
    _from.dispose();
    _to.dispose();
    super.dispose();
  }

  void _push() {
    widget.onUpdate(WorkExperience(
      company: _company.text.trim(),
      role: _role.text.trim(),
      fromDate: _from.text.trim(),
      toDate: _present ? null : (_to.text.trim().isEmpty ? null : _to.text.trim()),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                'EXPERIENCE ${widget.index + 1}',
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                  color: Color(0xFFEA580C),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: widget.onRemove,
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.15)
                          : const Color(0xFFE4E4E7),
                    ),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.delete_outline_rounded, size: 12, color: Color(0xFFE11D48)),
                      SizedBox(width: 4),
                      Text(
                        'Remove',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFE11D48),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _MiniField(
            label: 'Company',
            hint: 'e.g. Zoho',
            ctrl: _company,
            isDark: isDark,
            onChanged: (_) => _push(),
          ),
          const SizedBox(height: 10),
          _MiniField(
            label: 'Role',
            hint: 'e.g. Software Engineer',
            ctrl: _role,
            isDark: isDark,
            onChanged: (_) => _push(),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _MiniField(
                  label: 'From (YYYY-MM)',
                  hint: '2022-08',
                  ctrl: _from,
                  isDark: isDark,
                  onChanged: (_) => _push(),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'To',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.7)
                            : const Color(0xFF52525B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _to,
                            enabled: !_present,
                            onChanged: (_) => _push(),
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? Colors.white : const Color(0xFF09090B),
                            ),
                            decoration: InputDecoration(
                              hintText: '2024-03',
                              hintStyle: TextStyle(
                                fontSize: 12.5,
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.3)
                                    : const Color(0xFFA1A1AA),
                              ),
                              filled: true,
                              fillColor: isDark
                                  ? const Color(0xFF09090B)
                                  : const Color(0xFFFAFAFA),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.10)
                                      : const Color(0xFFE4E4E7),
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: BorderSide(
                                  color: isDark
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
                        ),
                        const SizedBox(width: 6),
                        InkWell(
                          onTap: () {
                            setState(() => _present = !_present);
                            _push();
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: _present
                                    ? const Color(0xFFF97316)
                                    : (isDark
                                        ? Colors.white.withValues(alpha: 0.15)
                                        : const Color(0xFFE4E4E7)),
                              ),
                              color: _present
                                  ? const Color(0xFFF97316).withValues(alpha: 0.10)
                                  : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _present ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                                  size: 14,
                                  color: _present ? const Color(0xFFF97316) : (isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A)),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Present',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                    color: _present
                                        ? const Color(0xFFF97316)
                                        : (isDark
                                            ? Colors.white.withValues(alpha: 0.7)
                                            : const Color(0xFF52525B)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MiniField extends StatelessWidget {
  const _MiniField({
    required this.label,
    required this.hint,
    required this.ctrl,
    required this.isDark,
    required this.onChanged,
  });

  final String label;
  final String hint;
  final TextEditingController ctrl;
  final bool isDark;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w600,
            color: isDark
                ? Colors.white.withValues(alpha: 0.7)
                : const Color(0xFF52525B),
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: ctrl,
          onChanged: onChanged,
          style: TextStyle(
            fontSize: 13,
            color: isDark ? Colors.white : const Color(0xFF09090B),
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              fontSize: 12.5,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.3)
                  : const Color(0xFFA1A1AA),
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.10)
                    : const Color(0xFFE4E4E7),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: isDark
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
