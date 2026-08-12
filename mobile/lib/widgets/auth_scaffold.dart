import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/theme_provider.dart';
import 'brand_logo.dart';
import 'theme_toggle.dart';

class AuthScaffold extends ConsumerWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.bgImage = 'assets/images/background-04.jpg',
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final String bgImage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.asset(bgImage, fit: BoxFit.cover),
                Container(
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF09090B).withValues(alpha: 0.78)
                        : Colors.white.withValues(alpha: 0.82),
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    children: [
                      InkWell(
                        onTap: () => context.go('/'),
                        borderRadius: BorderRadius.circular(10),
                        child: BrandLogo(
                          size: BrandLogoSize.small,
                          // Auth surfaces flip to a solid dark tint when the
                          // app is in dark mode — force the white-ink logo
                          // there so the wordmark stays legible. Light mode
                          // uses the default dark-ink art.
                          forceTheme: isDark ? Brightness.dark : null,
                        ),
                      ),
                      const Spacer(),
                      // Home button — mirrors the web AuthLayout header
                      // affordance so signed-out visitors can bounce back
                      // to the landing page without hunting for a back
                      // arrow.
                      IconButton(
                        tooltip: 'Home',
                        onPressed: () => context.go('/'),
                        icon: Icon(
                          Icons.home_outlined,
                          size: 20,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.85)
                              : const Color(0xFF3F3F46),
                        ),
                      ),
                      const ThemeToggle(),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                    child: Column(
                      children: [
                        Text(
                          title,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.6,
                            color: isDark ? Colors.white : const Color(0xFF09090B),
                          ),
                        ),
                        if (subtitle != null) ...[
                          const SizedBox(height: 10),
                          Text(
                            subtitle!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.65)
                                  : const Color(0xFF52525B),
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF18181B)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.08)
                                  : const Color(0xFFE4E4E7),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.06),
                                blurRadius: 20,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: child,
                        ),
                      ],
                    ),
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
