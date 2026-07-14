import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum SalaryUnit { lpa, monthly }

/// Structured salary value with min/max + unit. Serialised into the free-form
/// `Job.salaryRange` string via [display].
class SalaryRange {
  const SalaryRange({required this.min, required this.max, required this.unit});
  final double min;
  final double max;
  final SalaryUnit unit;

  String display() {
    String fmt(double v) {
      if (unit == SalaryUnit.lpa) return v.toStringAsFixed(v.truncateToDouble() == v ? 0 : 1);
      // Monthly: show in K when >= 1000.
      if (v >= 1000) return '${(v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1)}K';
      return v.toStringAsFixed(0);
    }

    if (unit == SalaryUnit.lpa) {
      return min == max ? '₹${fmt(min)} LPA' : '₹${fmt(min)} – ${fmt(max)} LPA';
    }
    return min == max ? '₹${fmt(min)} / month' : '₹${fmt(min)} – ${fmt(max)} / month';
  }

  SalaryRange copyWith({double? min, double? max, SalaryUnit? unit}) =>
      SalaryRange(min: min ?? this.min, max: max ?? this.max, unit: unit ?? this.unit);
}

/// Bottom-sheet salary picker. Uses a `RangeSlider` for the primary
/// interaction (drag both thumbs at once) plus preset chips for the common
/// ranges — matches the web wizard's Min/Max + preset layout but leans on
/// the touch-native slider affordance instead of number spinners.
class SalaryRangeSheet extends StatefulWidget {
  const SalaryRangeSheet({super.key, this.initial, required this.isDark});
  final SalaryRange? initial;
  final bool isDark;

  @override
  State<SalaryRangeSheet> createState() => _SalaryRangeSheetState();
}

class _SalaryRangeSheetState extends State<SalaryRangeSheet> {
  late SalaryUnit _unit;
  late RangeValues _range;

  @override
  void initState() {
    super.initState();
    _unit = widget.initial?.unit ?? SalaryUnit.lpa;
    _range = RangeValues(
      widget.initial?.min ?? (_unit == SalaryUnit.lpa ? 3 : 15000),
      widget.initial?.max ?? (_unit == SalaryUnit.lpa ? 8 : 35000),
    );
  }

  double get _sliderMin => _unit == SalaryUnit.lpa ? 1 : 5000;
  double get _sliderMax => _unit == SalaryUnit.lpa ? 60 : 150000;
  int get _divisions => _unit == SalaryUnit.lpa ? 118 : 29;

  void _swapUnit(SalaryUnit next) {
    if (next == _unit) return;
    HapticFeedback.selectionClick();
    setState(() {
      _unit = next;
      _range = RangeValues(
        next == SalaryUnit.lpa ? 3 : 15000,
        next == SalaryUnit.lpa ? 8 : 35000,
      );
    });
  }

  List<(String, RangeValues)> get _presets => _unit == SalaryUnit.lpa
      ? const [
          ('Entry', RangeValues(2, 4)),
          ('Mid', RangeValues(5, 10)),
          ('Senior', RangeValues(12, 22)),
          ('Lead', RangeValues(25, 40)),
        ]
      : const [
          ('Stipend', RangeValues(8000, 15000)),
          ('Entry', RangeValues(15000, 25000)),
          ('Mid', RangeValues(30000, 50000)),
          ('Senior', RangeValues(60000, 100000)),
        ];

  String _fmt(double v) {
    if (_unit == SalaryUnit.lpa) return v.toStringAsFixed(v.truncateToDouble() == v ? 0 : 1);
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1)}K';
    return v.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final current = SalaryRange(min: _range.start, max: _range.end, unit: _unit);

    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Salary range', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      Text(current.display(), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF059669))),
                    ],
                  ),
                ),
                _UnitToggle(
                  unit: _unit,
                  onChange: _swapUnit,
                  isDark: isDark,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: RangeSlider(
              values: _range,
              min: _sliderMin,
              max: _sliderMax,
              divisions: _divisions,
              activeColor: const Color(0xFF10B981),
              inactiveColor: const Color(0xFFD1FAE5),
              labels: RangeLabels(_fmt(_range.start), _fmt(_range.end)),
              onChanged: (v) {
                HapticFeedback.selectionClick();
                setState(() => _range = v);
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Min ₹${_fmt(_range.start)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A))),
                Text('Max ₹${_fmt(_range.end)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _presets.map((p) {
                return _PresetChip(
                  label: p.$1,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    setState(() => _range = p.$2);
                  },
                  isDark: isDark,
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.of(context).padding.bottom),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : Colors.white,
              border: Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14), foregroundColor: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B)),
                    child: const Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      Navigator.of(context).pop(current);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 6,
                      shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                    ),
                    child: Text('Save ${current.display()}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitToggle extends StatelessWidget {
  const _UnitToggle({required this.unit, required this.onChange, required this.isDark});
  final SalaryUnit unit;
  final ValueChanged<SalaryUnit> onChange;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _pill('LPA', SalaryUnit.lpa),
          _pill('Monthly', SalaryUnit.monthly),
        ],
      ),
    );
  }

  Widget _pill(String label, SalaryUnit u) {
    final selected = u == unit;
    return GestureDetector(
      onTap: () => onChange(u),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF10B981) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
            color: selected ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
          ),
        ),
      ),
    );
  }
}

class _PresetChip extends StatelessWidget {
  const _PresetChip({required this.label, required this.onTap, required this.isDark});
  final String label;
  final VoidCallback onTap;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.25)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.auto_awesome_rounded, size: 12, color: Color(0xFF059669)),
            const SizedBox(width: 5),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF047857))),
          ]),
        ),
      ),
    );
  }
}
