import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

class StepLabel {
  const StepLabel(this.id, this.label);
  final String id;
  final String label;
}

class StepIndicator extends ConsumerWidget {
  const StepIndicator({super.key, required this.steps, required this.current});
  final List<StepLabel> steps;
  final int current;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final pct = (current + 1) / steps.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Step ${current + 1} of ${steps.length}',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
                color: Color(0xFFEA580C),
              ),
            ),
            Text(
              steps[current].label,
              style: TextStyle(
                fontSize: 11.5,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : const Color(0xFF52525B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: Stack(
            children: [
              Container(
                height: 6,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.08)
                    : const Color(0xFFE4E4E7),
              ),
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: pct),
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeOutCubic,
                builder: (_, t, _) => FractionallySizedBox(
                  widthFactor: t,
                  child: Container(
                    height: 6,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFF97316), Color(0xFFEA580C)],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(steps.length, (i) {
            final active = i <= current;
            return Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: active ? const Color(0xFFF97316) : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
                    boxShadow: active
                        ? [
                            BoxShadow(
                              color: const Color(0xFFF97316).withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Center(
                    child: i < current
                        ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                        : Text(
                            '${i + 1}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: active
                                  ? Colors.white
                                  : (isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A)),
                            ),
                          ),
                  ),
                ),
              ],
            );
          }),
        ),
      ],
    );
  }
}
