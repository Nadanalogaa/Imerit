import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../store/theme_provider.dart';

/// Shared shell for the three legal pages (Terms, Refund, Privacy).
/// Mirrors web/src/pages/LegalShell.tsx — same typography language,
/// so a policy update on web maps straight over.
///
/// Children are a list of `LegalSection` blocks or plain paragraph
/// widgets (`LegalP`, `LegalUl`, `LegalH2`) supplied by each page.
class LegalShell extends ConsumerWidget {
  const LegalShell({
    super.key,
    required this.title,
    required this.lastUpdated,
    required this.children,
  });

  final String title;
  final DateTime lastUpdated;
  final List<Widget> children;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bg = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final title$ = isDark ? Colors.white : const Color(0xFF09090B);
    final sub = isDark
        ? Colors.white.withValues(alpha: 0.55)
        : const Color(0xFF71717A);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: title$),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          title,
          style: TextStyle(
            color: title$,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                letterSpacing: -0.6,
                color: title$,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Last updated: ${_fmt(lastUpdated)}',
              style: TextStyle(fontSize: 12, color: sub),
            ),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  static String _fmt(DateTime d) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }
}

/// Section heading (<h2> in web).
class LegalH2 extends ConsumerWidget {
  const LegalH2(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF18181B),
        ),
      ),
    );
  }
}

/// Body paragraph.
class LegalP extends ConsumerWidget {
  const LegalP(this.text, {super.key, this.rich});
  final String text;
  final List<InlineSpan>? rich;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final color = isDark ? const Color(0xFFD4D4D8) : const Color(0xFF3F3F46);
    final base = TextStyle(fontSize: 14, height: 1.65, color: color);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: rich != null
          ? RichText(
              text: TextSpan(style: base, children: rich!),
            )
          : Text(text, style: base),
    );
  }
}

/// Unordered list of bullets.
class LegalUl extends ConsumerWidget {
  const LegalUl(this.items, {super.key});
  final List<Widget> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final dot = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A);
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final item in items)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 8, right: 8),
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: dot,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Expanded(child: item),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Helper for inline `<strong>` runs inside a paragraph or list item.
InlineSpan legalStrong(String text, {required bool isDark}) => TextSpan(
      text: text,
      style: TextStyle(
        fontWeight: FontWeight.w700,
        color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF18181B),
      ),
    );

/// Helper for inline links.
InlineSpan legalLink(String text, {required VoidCallback onTap, required bool isDark}) =>
    WidgetSpan(
      alignment: PlaceholderAlignment.baseline,
      baseline: TextBaseline.alphabetic,
      child: GestureDetector(
        onTap: onTap,
        child: Text(
          text,
          style: TextStyle(
            fontSize: 14,
            height: 1.65,
            color: isDark ? const Color(0xFFFB923C) : const Color(0xFFEA580C),
            decoration: TextDecoration.underline,
          ),
        ),
      ),
    );
