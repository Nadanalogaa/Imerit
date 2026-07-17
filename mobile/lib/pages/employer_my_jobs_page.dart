import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class EmployerMyJobsPage extends ConsumerWidget {
  const EmployerMyJobsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider)!;
    // Watch the jobs list, then filter — refreshes when repost bumps
    // postedAt or when a new job is added.
    final allJobs = ref.watch(jobsProvider);
    final myJobs = allJobs.where((j) => j.employerId == user.id).toList();
    final apps = ref.watch(applicationsProvider).applications;

    int countApps(String jobId) => apps.where((a) => a.jobId == jobId).length;

    final activeJobs = myJobs.where((j) => !j.isExpired).toList();
    final expiredJobs = myJobs.where((j) => j.isExpired).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/dashboard')),
        title: const Text('My posted jobs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('MY JOBS', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
                      const SizedBox(height: 6),
                      Text('${myJobs.length} ${myJobs.length == 1 ? "job" : "jobs"}', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      if (expiredJobs.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text('${expiredJobs.length} expired — repost to make live again', style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
                      ],
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => context.go('/employer/jobs/new'),
                  icon: const Icon(Icons.add_rounded, size: 16),
                  label: const Text('Post new', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0EA5E9),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    elevation: 4,
                    shadowColor: const Color(0xFF0EA5E9).withValues(alpha: 0.4),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (myJobs.isEmpty)
              _EmptyState(isDark: isDark)
            else ...[
              if (activeJobs.isNotEmpty) ...[
                const _SectionHeader(label: 'Active', tone: Color(0xFF10B981), icon: Icons.check_circle_rounded),
                const SizedBox(height: 8),
                ...activeJobs.map((job) => _JobRow(job: job, applicantsCount: countApps(job.id), isDark: isDark)),
              ],
              if (expiredJobs.isNotEmpty) ...[
                const SizedBox(height: 16),
                const _SectionHeader(label: 'Expired', tone: Color(0xFFE11D48), icon: Icons.schedule_rounded),
                const SizedBox(height: 8),
                ...expiredJobs.map((job) => _JobRow(job: job, applicantsCount: countApps(job.id), isDark: isDark)),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label, required this.tone, required this.icon});
  final String label;
  final Color tone;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: tone),
        const SizedBox(width: 6),
        Text(label.toUpperCase(), style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1.5, color: tone)),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 20),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7))),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.work_outline_rounded, size: 32, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
            const SizedBox(height: 8),
            Text("You haven't posted any jobs yet", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
            const SizedBox(height: 4),
            const Text('Job posting is always free.', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pushNamed('/employer/jobs/new'),
              icon: const Icon(Icons.add_rounded, size: 14),
              label: const Text('Post your first job', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
            ),
          ],
        ),
      ),
    );
  }
}

class _JobRow extends ConsumerWidget {
  const _JobRow({required this.job, required this.applicantsCount, required this.isDark});
  final Job job;
  final int applicantsCount;
  final bool isDark;

  Color _expiryTone() {
    if (job.isExpired) return const Color(0xFFE11D48);
    if (job.daysUntilExpiry <= 7) return const Color(0xFFF59E0B);
    return const Color(0xFF10B981);
  }

  String _expiryLabel() {
    if (job.isExpired) return 'Expired';
    final d = job.daysUntilExpiry;
    if (d == 0) return 'Expires today';
    if (d == 1) return '1 day left';
    if (d <= 7) return '$d days left';
    return '$d days left';
  }

  Future<void> _repost(BuildContext context, WidgetRef ref) async {
    HapticFeedback.mediumImpact();
    // Server-backed repost — hits POST /employer/jobs/:id/repost so
    // the extended expiry is authoritative and applications/saves
    // are preserved backend-side.
    final updated = await ref.read(jobsProvider.notifier).repostAsync(job.id);
    if (updated == null || !context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(children: [
          Icon(Icons.check_circle_rounded, size: 16, color: Colors.white),
          SizedBox(width: 8),
          Expanded(child: Text('Reposted — live for another 45 days', style: TextStyle(fontSize: 12.5))),
        ]),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expiryTone = _expiryTone();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Dismissible(
        key: ValueKey('job_${job.id}'),
        direction: DismissDirection.endToStart,
        background: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
              SizedBox(width: 6),
              Text('Repost', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        ),
        confirmDismiss: (_) async {
          // Never actually dismiss — repost + reset position.
          await _repost(context, ref);
          return false;
        },
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.go('/employer/jobs/${job.id}/applicants'),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          gradient: LinearGradient(colors: [typeTone[job.type]!, typeTone[job.type]!.withValues(alpha: 0.7)]),
                          boxShadow: [BoxShadow(color: typeTone[job.type]!.withValues(alpha: 0.30), blurRadius: 8, offset: const Offset(0, 4))],
                        ),
                        child: Icon(typeIcon[job.type]!, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(job.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                            const SizedBox(height: 2),
                            Text('${job.location} · ${fieldLabel[job.field]} · ${typeLabelShort[job.type]}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.people_rounded, size: 11, color: Color(0xFF059669)),
                            const SizedBox(width: 4),
                            Text('$applicantsCount', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: expiryTone.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(job.isExpired ? Icons.schedule_rounded : Icons.circle, size: job.isExpired ? 11 : 6, color: expiryTone),
                            const SizedBox(width: 4),
                            Text(_expiryLabel(), style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: expiryTone)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text('· Posted ${relativeTime(job.postedAt)}', style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A))),
                      const Spacer(),
                      if (job.isExpired || job.daysUntilExpiry <= 7)
                        InkWell(
                          onTap: () => _repost(context, ref),
                          borderRadius: BorderRadius.circular(999),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF059669)]),
                              borderRadius: BorderRadius.circular(999),
                              boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.4), blurRadius: 6, offset: const Offset(0, 3))],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.refresh_rounded, size: 11, color: Colors.white),
                                SizedBox(width: 4),
                                Text('Repost', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Colors.white)),
                              ],
                            ),
                          ),
                        )
                      else
                        Icon(Icons.chevron_right_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
