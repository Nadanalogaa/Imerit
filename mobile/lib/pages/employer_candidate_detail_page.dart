import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/employer_prefs_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/templates/render_template.dart';
import '../widgets/templates/template_data.dart';
import '../widgets/theme_toggle.dart';

class EmployerCandidateDetailPage extends ConsumerWidget {
  const EmployerCandidateDetailPage({super.key, required this.candidateId});
  final String candidateId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final employer = ref.watch(authProvider);
    if (employer == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/employer/login'));
      return const SizedBox.shrink();
    }
    final candidate = ref.watch(authProvider.notifier).allUsers().where((u) => u.id == candidateId).firstOrNull;
    final profile = ref.watch(profileProvider)[candidateId];
    final subNotifier = ref.watch(subscriptionsProvider.notifier);
    final sub = subNotifier.activeFor(employer.id, SubscriberType.employerSme) ??
        subNotifier.activeFor(employer.id, SubscriberType.employerLarge);

    if (candidate == null || candidate.role != Role.candidate || profile?.selectedTemplateId == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/employer/candidates'));
      return const SizedBox.shrink();
    }

    // Mirror the web `recentCandidates` list — push this profile to the top
    // of the employer's "recently viewed" strip on the search page. Runs
    // after the frame so the notifier state change never conflicts with
    // this frame's rebuild.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(recentCandidatesProvider.notifier).push(employer.id, candidateId);
    });

    if (sub == null) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        appBar: AppBar(
          backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/candidates')),
          title: const Text('Candidate', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          actions: const [ThemeToggle(), SizedBox(width: 12)],
        ),
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFFEF3C7), Color(0xFFFFEDD5)]),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [BoxShadow(color: const Color(0xFFF59E0B).withValues(alpha: 0.30), blurRadius: 30, offset: const Offset(0, 10))],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFFF59E0B)),
                  child: const Icon(Icons.lock_rounded, size: 30, color: Colors.white),
                ),
                const SizedBox(height: 16),
                const Text('This profile is locked', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF09090B))),
                const SizedBox(height: 6),
                const Text(
                  'Subscribe to unlock full candidate profiles, contact details, and direct outreach.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Color(0xFF3F3F46), height: 1.5),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    OutlinedButton(
                      onPressed: () => context.go('/employer/candidates'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                        side: BorderSide(color: Colors.black.withValues(alpha: 0.10)),
                        foregroundColor: const Color(0xFF09090B),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                      ),
                      child: const Text('Back to list', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => context.go('/employer/subscribe?return=${Uri.encodeQueryComponent("/employer/candidates/$candidateId")}'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0EA5E9),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        elevation: 6,
                        shadowColor: const Color(0xFF0EA5E9).withValues(alpha: 0.4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome_rounded, size: 13),
                          SizedBox(width: 4),
                          Text('See plans', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
    }

    final data = TemplateData(user: candidate, profile: profile!);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/candidates')),
        title: const Text('Candidate', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: [
          if (candidate.email.isNotEmpty)
            IconButton(icon: const Icon(Icons.mail_outline_rounded), tooltip: 'Email', onPressed: () {}),
          if (candidate.mobile != null)
            IconButton(icon: const Icon(Icons.call_rounded, color: Color(0xFF0369A1)), tooltip: 'Call', onPressed: () {}),
          const ThemeToggle(),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.10), blurRadius: 30, offset: const Offset(0, 10))],
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
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF18181B) : Colors.white,
              border: Border(top: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7))),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.touch_app_rounded, size: 12, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                  const SizedBox(width: 4),
                  Text('Pinch to zoom · drag to pan', style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA))),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
