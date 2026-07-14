import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../store/jobs_provider.dart';

/// 2-column, 4-row grid of the 8 job types. Each tile renders the type's
/// colored icon badge, label, and a short one-liner explaining who the type
/// is for. Selection animates a ring + shadow lift and fires a haptic. This
/// is deliberately more discoverable than the web's single-row dropdown —
/// mobile users see all 8 options at once without having to unfurl a menu.
class JobTypeGrid extends StatelessWidget {
  const JobTypeGrid({super.key, required this.value, required this.onChange});
  final JobType? value;
  final ValueChanged<JobType> onChange;

  static const _blurbs = {
    JobType.internshipTraining: '6-month learn-and-earn',
    JobType.apprentice: 'Structured skill program',
    JobType.fullTime: 'Long-term, on payroll',
    JobType.partTime: 'Flexible daily hours',
    JobType.gigDelivery: 'Task or trip based',
    JobType.contract: 'Fixed-term engagement',
    JobType.consultant: 'Specialist retainer',
    JobType.freelancer: 'Project by project',
  };

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.55,
      ),
      itemCount: JobType.values.length,
      itemBuilder: (context, i) {
        final t = JobType.values[i];
        final selected = value == t;
        final tone = typeTone[t]!;
        return _TypeTile(
          type: t,
          tone: tone,
          selected: selected,
          blurb: _blurbs[t] ?? '',
          onTap: () {
            HapticFeedback.selectionClick();
            onChange(t);
          },
        );
      },
    );
  }
}

class _TypeTile extends StatelessWidget {
  const _TypeTile({
    required this.type,
    required this.tone,
    required this.selected,
    required this.blurb,
    required this.onTap,
  });

  final JobType type;
  final Color tone;
  final bool selected;
  final String blurb;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: selected
                ? LinearGradient(
                    colors: [tone.withValues(alpha: 0.20), tone.withValues(alpha: 0.06)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            color: selected ? null : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selected ? tone : const Color(0xFFE4E4E7),
              width: selected ? 2 : 1,
            ),
            boxShadow: selected
                ? [BoxShadow(color: tone.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 8))]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [tone, tone.withValues(alpha: 0.7)]),
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: [
                        BoxShadow(color: tone.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3)),
                      ],
                    ),
                    child: Icon(typeIcon[type]!, size: 16, color: Colors.white),
                  ),
                  const Spacer(),
                  AnimatedScale(
                    scale: selected ? 1 : 0,
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOutBack,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(color: tone, shape: BoxShape.circle),
                      child: const Icon(Icons.check_rounded, size: 12, color: Colors.white),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                typeLabel[type]!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: selected ? tone : const Color(0xFF18181B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                blurb,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10.5, color: Color(0xFF71717A)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
