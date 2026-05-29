import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class EmployerDashboardPage extends ConsumerWidget {
  const EmployerDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider);

    if (user == null || user.role != Role.employer) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/employer/login'));
      return const SizedBox.shrink();
    }

    final firstName = user.name.split(' ').first;
    final allProfiles = ref.watch(profileProvider);
    final completedCount = allProfiles.values.where((p) => p.selectedTemplateId != null).length;
    final totalCandidates = ref.watch(authProvider.notifier).allUsers().where((u) => u.role == Role.candidate).length;
    final subSme = ref.watch(subscriptionsProvider.notifier).activeFor(user.id, SubscriberType.employerSme);
    final subLg = ref.watch(subscriptionsProvider.notifier).activeFor(user.id, SubscriberType.employerLarge);
    final sub = subSme ?? subLg;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: InkWell(
          onTap: () => context.go('/'),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                ),
                child: const Center(child: Text('iT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12))),
              ),
              const SizedBox(width: 10),
              Text('i-Tamil Recruit', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF18181B))),
            ],
          ),
        ),
        actions: [
          const ThemeToggle(),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/');
                },
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF4F4F5),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.logout_rounded, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 6),
                      Text('Sign out', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF18181B))),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero card
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              child: Stack(
                children: [
                  Positioned(
                    right: -40,
                    top: -40,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(colors: [
                          const Color(0xFF0EA5E9).withValues(alpha: isDark ? 0.18 : 0.12),
                          const Color(0xFF0EA5E9).withValues(alpha: 0),
                        ]),
                      ),
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF0EA5E9).withValues(alpha: 0.10), borderRadius: BorderRadius.circular(999)),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.auto_awesome_rounded, size: 12, color: Color(0xFF0369A1)),
                            SizedBox(width: 6),
                            Text('EMPLOYER DASHBOARD', style: TextStyle(fontSize: 10, letterSpacing: 1.5, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text('Hello $firstName', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.6, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      if (user.company != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.business_rounded, size: 13, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                            const SizedBox(width: 4),
                            Text(user.company!, style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                          ],
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        'Post jobs free, then subscribe to discover the $totalCandidates candidate${totalCandidates == 1 ? "" : "s"} who match your roles.',
                        style: TextStyle(fontSize: 13, height: 1.5, color: isDark ? Colors.white.withValues(alpha: 0.65) : const Color(0xFF52525B)),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _stat(isDark, user.emailVerified ? Icons.verified_rounded : Icons.schedule_rounded, 'Account', user.emailVerified ? 'Verified' : 'Pending', user.emailVerified)),
                          const SizedBox(width: 8),
                          Expanded(child: _stat(isDark, Icons.people_rounded, 'Available', '$completedCount', completedCount > 0)),
                          const SizedBox(width: 8),
                          Expanded(child: _stat(isDark, Icons.credit_card_rounded, 'Plan', sub != null ? 'Active' : 'None', sub != null)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('QUICK ACTIONS', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
              children: [
                _action(isDark, Icons.search_rounded, const [Color(0xFF0EA5E9), Color(0xFF06B6D4)], 'Search candidates', sub != null ? 'Browse + view full CVs.' : 'Browse profiles. Subscribe to view CVs.', () => context.go('/employer/candidates')),
                _action(isDark, Icons.work_rounded, const [Color(0xFF8B5CF6), Color(0xFFD946EF)], 'Post a job', 'Free. List a new role in 2 mins.', () => context.go('/employer/jobs/new')),
                _action(isDark, Icons.shield_rounded, const [Color(0xFFF97316), Color(0xFFD97706)], 'My posted jobs', 'Track posts + ranked applicants.', () => context.go('/employer/my-jobs')),
                _action(isDark, Icons.credit_card_rounded, const [Color(0xFF10B981), Color(0xFF14B8A6)], 'Subscription', sub != null ? 'Active · expires ${_formatDate(DateTime.parse(sub.expiresAt))}' : 'Pick an SME or Enterprise plan.', () => context.go('/employer/subscribe')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(bool isDark, IconData icon, String label, String value, bool ok) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, size: 13, color: ok ? const Color(0xFF10B981) : (isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
            const SizedBox(width: 4),
            Text(label.toUpperCase(), style: TextStyle(fontSize: 9, letterSpacing: 1.1, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
          ]),
          const SizedBox(height: 6),
          Text(value, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: ok ? const Color(0xFF10B981) : (isDark ? Colors.white : const Color(0xFF09090B)))),
        ],
      ),
    );
  }

  Widget _action(bool isDark, IconData icon, List<Color> colors, String title, String desc, VoidCallback? onTap, {bool soon = false}) {
    final card = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(11),
                  gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
                  boxShadow: [BoxShadow(color: colors.first.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))],
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              if (soon)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF4F4F5), borderRadius: BorderRadius.circular(999)),
                  child: Text('SOON', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.w800, letterSpacing: 1, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
                )
              else
                const Icon(Icons.arrow_forward_rounded, size: 16, color: Color(0xFF0369A1)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
              const SizedBox(height: 4),
              Text(desc, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, height: 1.35, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
            ],
          ),
        ],
      ),
    );
    if (soon || onTap == null) return Opacity(opacity: 0.85, child: card);
    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(20), child: card),
    );
  }
}

String _formatDate(DateTime d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${d.day} ${months[d.month - 1]}';
}
