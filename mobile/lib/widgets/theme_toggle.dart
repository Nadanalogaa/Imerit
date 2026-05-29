import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/theme_provider.dart';

class ThemeToggle extends ConsumerWidget {
  const ThemeToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeProvider);
    final isDark = mode == ThemeMode.dark;
    final borderColor = isDark
        ? Colors.white.withValues(alpha: 0.15)
        : Colors.black.withValues(alpha: 0.08);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => ref.read(themeProvider.notifier).toggle(),
        borderRadius: BorderRadius.circular(999),
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isDark
                ? Colors.white.withValues(alpha: 0.06)
                : Colors.black.withValues(alpha: 0.04),
            border: Border.all(color: borderColor),
          ),
          child: Icon(
            isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
            size: 20,
            color: isDark ? Colors.white : const Color(0xFF18181B),
          ),
        ),
      ),
    );
  }
}
