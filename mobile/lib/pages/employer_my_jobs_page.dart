import 'package:flutter/material.dart';
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
    final myJobs = ref.watch(jobsProvider.notifier).postedBy(user.id);
    final apps = ref.watch(applicationsProvider).applications;

    int countApps(String jobId) => apps.where((a) => a.jobId == jobId).length;

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
              Container(
                padding: const EdgeInsets.symmetric(vertical: 50, horizontal: 20),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(style: BorderStyle.solid, color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7))),
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
                        onPressed: () => context.go('/employer/jobs/new'),
                        icon: const Icon(Icons.add_rounded, size: 14),
                        label: const Text('Post your first job', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0EA5E9), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...List.generate(myJobs.length, (i) {
                final job = myJobs[i];
                final n = countApps(job.id);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
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
                        child: Row(
                          children: [
                            Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)])),
                              child: const Icon(Icons.work_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(job.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                                  const SizedBox(height: 2),
                                  Text('${job.location} · ${fieldLabel[job.field]} · ${typeLabel[job.type]}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                                  Text('Posted ${relativeTime(job.postedAt)}', style: TextStyle(fontSize: 10, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A))),
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
                                  Text('$n', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Icon(Icons.chevron_right_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
