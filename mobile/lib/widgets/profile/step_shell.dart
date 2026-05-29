import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

class StepShell extends ConsumerWidget {
  const StepShell({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.onBack,
    required this.onNext,
    this.nextLabel = 'Continue',
    this.isLast = false,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final VoidCallback? onBack;
  final VoidCallback onNext;
  final String nextLabel;
  final bool isLast;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Container(
        margin: const EdgeInsets.only(top: 22),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : const Color(0xFFE4E4E7),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.4,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 6),
              Text(
                subtitle!,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.6)
                      : const Color(0xFF52525B),
                ),
              ),
            ],
            const SizedBox(height: 18),
            child,
            const SizedBox(height: 22),
            Row(
              children: [
                if (onBack != null)
                  OutlinedButton.icon(
                    onPressed: onBack,
                    icon: const Icon(Icons.arrow_back_rounded, size: 16),
                    label: const Text('Back', style: TextStyle(fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      side: BorderSide(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.15)
                            : const Color(0xFFE4E4E7),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                      foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                    ),
                  ),
                const Spacer(),
                ElevatedButton(
                  onPressed: onNext,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 13),
                    backgroundColor: const Color(0xFFF97316),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    elevation: 6,
                    shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(nextLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      if (!isLast) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_forward_rounded, size: 16),
                      ],
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
