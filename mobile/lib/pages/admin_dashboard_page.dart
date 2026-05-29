import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/jobs_provider.dart';
import '../store/applications_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class AdminDashboardPage extends ConsumerWidget {
  const AdminDashboardPage({super.key, this.isSuperAdmin = false});
  final bool isSuperAdmin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider);

    if (user == null || (user.role != Role.admin && user.role != Role.superAdmin)) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/admin'));
      return const SizedBox.shrink();
    }

    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final candidates = allUsers.where((u) => u.role == Role.candidate).toList();
    final employers = allUsers.where((u) => u.role == Role.employer).toList();
    final profiles = ref.watch(profileProvider);
    final completed = candidates.where((c) => profiles[c.id]?.selectedTemplateId != null).length;
    final subs = ref.watch(subscriptionsProvider);
    final activeSubs = subs.where((s) => DateTime.parse(s.expiresAt).isAfter(DateTime.now())).length;
    final totalRevenue = subs.fold<int>(0, (sum, s) => sum + s.priceInr);
    final jobs = ref.watch(jobsProvider);
    final apps = ref.watch(applicationsProvider).applications;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isSuperAdmin
            ? const Color(0xFF09090B)
            : (isDark ? const Color(0xFF18181B) : Colors.white),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                gradient: LinearGradient(colors: isSuperAdmin
                    ? const [Color(0xFFF59E0B), Color(0xFFD97706)]
                    : const [Color(0xFF18181B), Color(0xFF52525B)]),
              ),
              child: Icon(isSuperAdmin ? Icons.workspace_premium_rounded : Icons.shield_rounded, size: 16, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Text(isSuperAdmin ? 'Super Admin' : 'Admin Panel', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isSuperAdmin ? Colors.white : (isDark ? Colors.white : const Color(0xFF18181B)))),
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
                onTap: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/');
                },
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSuperAdmin
                        ? Colors.white.withValues(alpha: 0.1)
                        : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF4F4F5)),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.logout_rounded, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 6),
                      Text(
                        'Sign out',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: isSuperAdmin ? Colors.white : (isDark ? Colors.white : const Color(0xFF18181B)),
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isSuperAdmin ? 'SYSTEM OVERVIEW' : 'OVERVIEW',
              style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: isSuperAdmin ? const Color(0xFFD97706) : const Color(0xFFEA580C)),
            ),
            const SizedBox(height: 6),
            Text(
              isSuperAdmin ? 'i-Tamil Recruit · all systems' : 'Admin dashboard',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: isDark ? Colors.white : const Color(0xFF09090B)),
            ),
            const SizedBox(height: 6),
            Text(
              'Use the web app for exports (Excel/Word/PDF). Mobile shows live stats.',
              style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A)),
            ),
            const SizedBox(height: 18),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _stat(isDark, Icons.people_rounded, 'Candidates', '${candidates.length}', '$completed with CV', const [Color(0xFFF97316), Color(0xFFD97706)]),
                _stat(isDark, Icons.business_rounded, 'Employers', '${employers.length}', 'registered', const [Color(0xFF0EA5E9), Color(0xFF06B6D4)]),
                _stat(isDark, Icons.work_rounded, 'Jobs', '${jobs.length}', '${apps.length} applications', const [Color(0xFF8B5CF6), Color(0xFFD946EF)]),
                _stat(isDark, Icons.trending_up_rounded, 'Revenue', '₹${_fmt(totalRevenue)}', '$activeSubs active subs', const [Color(0xFF10B981), Color(0xFF14B8A6)]),
              ],
            ),
            const SizedBox(height: 22),
            Text('PLATFORM USERS', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
            const SizedBox(height: 10),
            _userBreakdown(isDark, candidates.length, employers.length, completed),
            const SizedBox(height: 22),
            Text('SUBSCRIPTIONS', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
            const SizedBox(height: 10),
            _subBreakdown(isDark, subs),
            const SizedBox(height: 22),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFFEF3C7), Color(0xFFFFEDD5)]),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, size: 18, color: Color(0xFFB45309)),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Exports available on web', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFFB45309))),
                        Text('Open the web admin panel to export Excel, Word, or PDF reports.', style: TextStyle(fontSize: 11, color: Color(0xFFB45309))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(bool isDark, IconData icon, String label, String value, String sub, List<Color> colors) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(11), gradient: LinearGradient(colors: colors), boxShadow: [BoxShadow(color: colors.first.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))]),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const Spacer(),
          Text(label.toUpperCase(), style: TextStyle(fontSize: 9.5, letterSpacing: 1.2, fontWeight: FontWeight.w800, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
          Text(sub, style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
        ],
      ),
    );
  }

  Widget _userBreakdown(bool isDark, int candidates, int employers, int completed) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        children: [
          _breakdownRow(isDark, 'Candidates', candidates, const Color(0xFFEA580C)),
          const SizedBox(height: 8),
          _breakdownRow(isDark, '— with completed profile', completed, const Color(0xFF10B981)),
          const SizedBox(height: 8),
          _breakdownRow(isDark, 'Employers', employers, const Color(0xFF0EA5E9)),
        ],
      ),
    );
  }

  Widget _subBreakdown(bool isDark, List<Subscription> subs) {
    final cand = subs.where((s) => s.type == SubscriberType.candidate).length;
    final sme = subs.where((s) => s.type == SubscriberType.employerSme).length;
    final lg = subs.where((s) => s.type == SubscriberType.employerLarge).length;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
      ),
      child: Column(
        children: [
          _breakdownRow(isDark, 'Candidate plans (₹333)', cand, const Color(0xFFEA580C)),
          const SizedBox(height: 8),
          _breakdownRow(isDark, 'Employer SME plans', sme, const Color(0xFF0EA5E9)),
          const SizedBox(height: 8),
          _breakdownRow(isDark, 'Employer Large plans', lg, const Color(0xFF7C3AED)),
        ],
      ),
    );
  }

  Widget _breakdownRow(bool isDark, String label, int count, Color color) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
        const SizedBox(width: 10),
        Expanded(child: Text(label, style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46)))),
        Text('$count', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
      ],
    );
  }
}

String _fmt(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}
