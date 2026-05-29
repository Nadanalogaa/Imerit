import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/profile_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/templates/template_data.dart';
import '../widgets/templates/render_template.dart';
import '../widgets/theme_toggle.dart';

const _templateLabels = {
  'classic': 'Classic Executive',
  'modern': 'Modern Minimal',
  'creative': 'Creative Bold',
  'corporate': 'Corporate Sidebar',
  'tech_mono': 'Tech / Dark Mono',
};

class CandidateProfilePreviewPage extends ConsumerWidget {
  const CandidateProfilePreviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/candidate/login'));
      return const SizedBox.shrink();
    }

    final profile = ref.watch(profileProvider.notifier).of(user.id);

    if (profile.selectedTemplateId == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/candidate/profile/build'));
      return const SizedBox.shrink();
    }

    final templateLabel = _templateLabels[profile.selectedTemplateId] ?? 'Profile';
    final data = TemplateData(user: user, profile: profile);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/candidate/dashboard'),
        ),
        title: Row(
          children: [
            const Text(
              'Your profile',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFFFEDD5), Color(0xFFFEF3C7)]),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                templateLabel,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFC2410C),
                ),
              ),
            ),
          ],
        ),
        actions: [
          const ThemeToggle(),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => context.go('/candidate/profile/build'),
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF97316), Color(0xFFC2410C)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF97316).withValues(alpha: 0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.edit_rounded, size: 13, color: Colors.white),
                      SizedBox(width: 4),
                      Text(
                        'Edit',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Live preview area
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.10),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: InteractiveViewer(
                    constrained: false,
                    minScale: 0.3,
                    maxScale: 2.5,
                    boundaryMargin: const EdgeInsets.all(80),
                    child: SizedBox(
                      width: 800,
                      height: 1100,
                      child: RenderTemplate(id: profile.selectedTemplateId!, data: data),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Action footer
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : Colors.white,
              border: Border(
                top: BorderSide(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : const Color(0xFFE4E4E7),
                ),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.touch_app_rounded,
                        size: 12,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.4)
                            : const Color(0xFFA1A1AA),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Pinch to zoom · drag to pan',
                        style: TextStyle(
                          fontSize: 11,
                          fontStyle: FontStyle.italic,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.4)
                              : const Color(0xFFA1A1AA),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => context.go('/candidate/dashboard'),
                          icon: const Icon(Icons.dashboard_rounded, size: 16),
                          label: const Text(
                            'Dashboard',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            side: BorderSide(
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.15)
                                  : const Color(0xFFE4E4E7),
                            ),
                            foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => context.go('/candidate/profile/build'),
                          icon: const Icon(Icons.edit_rounded, size: 16),
                          label: const Text(
                            'Edit profile',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            backgroundColor: const Color(0xFFF97316),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 6,
                            shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
