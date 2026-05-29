import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class MyApplicationsPage extends ConsumerWidget {
  const MyApplicationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider)!;
    final apps = ref.watch(applicationsProvider.notifier).appsFor(user.id);
    final jobs = ref.watch(jobsProvider);

    final enriched = apps
        .map((a) {
          final job = jobs.where((j) => j.id == a.jobId).firstOrNull;
          return job == null ? null : (a, job);
        })
        .whereType<(Application, Job)>()
        .toList();

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
        title: const Text('My applications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'MY APPLICATIONS',
              style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFFEA580C)),
            ),
            const SizedBox(height: 6),
            Text(
              '${enriched.length} ${enriched.length == 1 ? "application" : "applications"}',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.4,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
            const SizedBox(height: 16),
            if (enriched.isEmpty)
              _EmptyState(isDark: isDark)
            else
              ...List.generate(enriched.length, (i) {
                final (app, job) = enriched[i];
                return Padding(
                  padding: EdgeInsets.only(bottom: i == enriched.length - 1 ? 0 : 10),
                  child: _AppCard(
                    isDark: isDark,
                    job: job,
                    app: app,
                    onTap: () => context.go('/candidate/jobs/${job.id}'),
                  ),
                );
              }),
          ],
        ),
      ),
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
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          style: BorderStyle.solid,
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.work_outline_rounded, size: 32, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
            const SizedBox(height: 8),
            Text(
              "You haven't applied to any jobs yet",
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
            ),
            const SizedBox(height: 4),
            Text(
              'Browse openings and tap Apply on any role you like.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEA580C),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
              child: const Text('Browse jobs', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }
}

class _AppCard extends StatelessWidget {
  const _AppCard({required this.isDark, required this.job, required this.app, required this.onTap});
  final bool isDark;
  final Job job;
  final Application app;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
                  ),
                ),
                child: const Icon(Icons.work_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      job.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${job.employerName} · ${job.location}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Text(
                            'SUBMITTED',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF059669), letterSpacing: 1),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Applied ${relativeTime(app.appliedAt)}',
                          style: TextStyle(fontSize: 10, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
            ],
          ),
        ),
      ),
    );
  }
}
