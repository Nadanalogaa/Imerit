import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class PlaceholderPage extends ConsumerWidget {
  const PlaceholderPage({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  TextButton.icon(
                    onPressed: () => context.go('/'),
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: const Text("Back to home"),
                    style: TextButton.styleFrom(
                      foregroundColor: isDark
                          ? Colors.white.withValues(alpha: 0.65)
                          : const Color(0xFF52525B),
                    ),
                  ),
                  const Spacer(),
                  const ThemeToggle(),
                ],
              ),
            ),
            Expanded(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.8,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        subtitle!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.6)
                              : const Color(0xFF52525B),
                        ),
                      ),
                    ],
                    const SizedBox(height: 32),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : const Color(0xFFE4E4E7),
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Text(
                        "Coming up in the next milestone.",
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.55)
                              : const Color(0xFF71717A),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
