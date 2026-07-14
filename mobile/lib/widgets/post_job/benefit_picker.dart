import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../store/jobs_provider.dart';

/// Colored benefit tiles laid out as a Wrap so each row packs efficiently.
/// Selecting a benefit fills the tile with its tone color and swaps the icon
/// to a check — feels tactile compared to a plain checkbox list. Tap-and-
/// hold surfaces a short description so employers know what they're offering
/// (some benefits like ESI are less familiar than others).
class BenefitPicker extends StatelessWidget {
  const BenefitPicker({
    super.key,
    required this.value,
    required this.onChange,
  });
  final List<JobBenefit> value;
  final ValueChanged<List<JobBenefit>> onChange;

  static const _descriptions = {
    JobBenefit.pf: 'Employees\' Provident Fund — mandatory 12% retirement contribution',
    JobBenefit.esi: 'Employees\' State Insurance — medical + wage benefits',
    JobBenefit.healthInsurance: 'Group health cover for the employee (and often family)',
    JobBenefit.wfh: 'Full remote / work-from-home',
    JobBenefit.hybrid: 'Split between office and remote days',
    JobBenefit.paidLeave: 'Casual, sick, and earned leave',
    JobBenefit.flexibleHours: 'Choose your own start / end times',
    JobBenefit.freeMeals: 'Meals or snacks provided at the office',
    JobBenefit.transport: 'Company cab, shuttle, or transport allowance',
    JobBenefit.annualBonus: 'Performance-linked yearly bonus',
    JobBenefit.stockOptions: 'ESOPs — ownership in the company',
    JobBenefit.learningStipend: 'Reimbursement for courses, books, conferences',
  };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: JobBenefit.values.map((b) {
        final selected = value.contains(b);
        return _BenefitTile(
          benefit: b,
          selected: selected,
          description: _descriptions[b] ?? '',
          onTap: () {
            HapticFeedback.selectionClick();
            if (selected) {
              onChange(value.where((v) => v != b).toList());
            } else {
              onChange([...value, b]);
            }
          },
        );
      }).toList(),
    );
  }
}

class _BenefitTile extends StatelessWidget {
  const _BenefitTile({
    required this.benefit,
    required this.selected,
    required this.description,
    required this.onTap,
  });
  final JobBenefit benefit;
  final bool selected;
  final String description;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final tone = benefitTone[benefit]!;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: () {
          HapticFeedback.mediumImpact();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(children: [
                Icon(benefitIcon[benefit]!, size: 16, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text(description, style: const TextStyle(fontSize: 12))),
              ]),
              backgroundColor: tone,
              duration: const Duration(seconds: 3),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              margin: const EdgeInsets.all(16),
            ),
          );
        },
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: selected
                ? LinearGradient(colors: [tone, tone.withValues(alpha: 0.85)])
                : null,
            color: selected ? null : tone.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? tone : tone.withValues(alpha: 0.25),
              width: selected ? 0 : 1,
            ),
            boxShadow: selected
                ? [BoxShadow(color: tone.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                selected ? Icons.check_rounded : benefitIcon[benefit]!,
                size: 14,
                color: selected ? Colors.white : tone,
              ),
              const SizedBox(width: 6),
              Text(
                benefitLabel[benefit]!,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : tone,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
