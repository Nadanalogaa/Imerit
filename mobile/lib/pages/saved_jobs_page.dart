import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

class SavedJobsPage extends ConsumerWidget {
  const SavedJobsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final user = ref.watch(authProvider)!;
    final savedIds = ref.watch(applicationsProvider.notifier).savedFor(user.id);
    final jobs = ref.watch(jobsProvider);
    final items = savedIds
        .map((id) => jobs.where((j) => j.id == id).firstOrNull)
        .whereType<Job>()
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
        title: const Text('Saved jobs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SAVED JOBS',
              style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFFEA580C)),
            ),
            const SizedBox(height: 6),
            Text(
              '${items.length} ${items.length == 1 ? "job" : "jobs"} bookmarked',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.4,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
            const SizedBox(height: 16),
            if (items.isEmpty)
              Container(
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
                      Icon(Icons.bookmark_outline_rounded, size: 32, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                      const SizedBox(height: 8),
                      Text('No saved jobs yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      const SizedBox(height: 4),
                      Text('Tap the bookmark icon on any job to save it.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.go('/candidate/jobs'),
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
              )
            else
              ...List.generate(items.length, (i) {
                final j = items[i];
                return Padding(
                  padding: EdgeInsets.only(bottom: i == items.length - 1 ? 0 : 10),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => context.go('/candidate/jobs/${j.id}'),
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
                                  colors: [Color(0xFFE11D48), Color(0xFFEC4899)],
                                ),
                              ),
                              child: const Icon(Icons.bookmark_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    j.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${j.employerName} · ${j.location} · ${fieldLabel[j.field]}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                                  ),
                                ],
                              ),
                            ),
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
