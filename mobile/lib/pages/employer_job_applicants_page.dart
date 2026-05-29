import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:convert';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../utils/matcher.dart';
import '../widgets/theme_toggle.dart';

class EmployerJobApplicantsPage extends ConsumerWidget {
  const EmployerJobApplicantsPage({super.key, required this.jobId});
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final employer = ref.watch(authProvider)!;
    final job = ref.watch(jobsProvider.notifier).byId(jobId);

    if (job == null || job.employerId != employer.id) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/employer/my-jobs'));
      return const SizedBox.shrink();
    }

    final apps = ref.watch(applicationsProvider).applications.where((a) => a.jobId == jobId).toList();
    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final profilesMap = ref.watch(profileProvider);
    final subNotifier = ref.watch(subscriptionsProvider.notifier);
    final hasSub = subNotifier.activeFor(employer.id, SubscriberType.employerSme) != null ||
        subNotifier.activeFor(employer.id, SubscriberType.employerLarge) != null;

    final enriched = apps.map((a) {
      final user = allUsers.where((u) => u.id == a.userId).firstOrNull;
      final profile = profilesMap[a.userId];
      if (user == null || profile == null) return null;
      return (user: user, profile: profile, app: a, result: matchScore(job, profile));
    }).whereType<({User user, CandidateProfile profile, Application app, MatchResult result})>().toList()
      ..sort((a, b) => b.result.score.compareTo(a.result.score));

    final strong = enriched.where((e) => e.result.band == MatchBand.high).length;
    final avg = enriched.where((e) => e.result.band == MatchBand.medium).length;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/my-jobs')),
        title: const Text('Applicants', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
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
                            Text(job.title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                            Text('${job.location} · ${fieldLabel[job.field]}', style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: [
                      _stat(Icons.people_rounded, 'Total: ${enriched.length}', const Color(0xFF71717A)),
                      _stat(Icons.auto_awesome_rounded, 'Strong: $strong', const Color(0xFF059669)),
                      _stat(Icons.auto_awesome_rounded, 'Average: $avg', const Color(0xFFB45309)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text('APPLICANTS — SORTED BY MATCH', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
            const SizedBox(height: 10),
            if (enriched.isEmpty)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(style: BorderStyle.solid, color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7))),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.people_outline_rounded, size: 28, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                      const SizedBox(height: 8),
                      Text('No applicants yet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      const SizedBox(height: 4),
                      const Text('Candidates with matching skills will see this job sorted by fit.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                    ],
                  ),
                ),
              )
            else
              ...enriched.map((a) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _ApplicantCard(user: a.user, profile: a.profile, result: a.result, isDark: isDark, hasSub: hasSub, onTap: () => hasSub ? context.go('/employer/candidates/${a.user.id}') : context.go('/employer/subscribe?return=${Uri.encodeQueryComponent("/employer/jobs/$jobId/applicants")}')),
              )),
          ],
        ),
      ),
    );
  }

  Widget _stat(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
        ],
      ),
    );
  }
}

class _ApplicantCard extends StatelessWidget {
  const _ApplicantCard({required this.user, required this.profile, required this.result, required this.isDark, required this.hasSub, required this.onTap});
  final User user;
  final CandidateProfile profile;
  final MatchResult result;
  final bool isDark;
  final bool hasSub;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final initials = user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
    final colors = bandColors[result.band]!;
    final skills = profile.itLanguages ?? profile.topSkills ?? [];

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: hasSub ? (isDark ? const Color(0xFF18181B) : Colors.white) : const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: hasSub ? (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)) : const Color(0xFFFCD34D)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (profile.photoDataUrl != null && profile.photoDataUrl!.isNotEmpty)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.memory(
                        base64Decode(profile.photoDataUrl!.split(',').last),
                        width: 48, height: 48, fit: BoxFit.cover,
                      ),
                    )
                  else
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)])),
                      child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14))),
                    ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(hasSub ? user.name : '•••••• ••••••', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                        const SizedBox(height: 2),
                        Text(
                          '${profile.preferredLocation ?? "—"} · ${skills.take(3).join(" · ")}',
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(color: colors.bg, borderRadius: BorderRadius.circular(12), border: Border.all(color: colors.ring)),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('${result.score}%', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: colors.text)),
                        Text('MATCH', style: TextStyle(fontSize: 8, letterSpacing: 1, fontWeight: FontWeight.w800, color: colors.text)),
                      ],
                    ),
                  ),
                ],
              ),
              if (result.reasons.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 5, runSpacing: 5,
                  children: result.reasons.take(3).map((r) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF4F4F5), borderRadius: BorderRadius.circular(999)),
                    child: Text('✓ $r', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isDark ? Colors.white.withValues(alpha: 0.75) : const Color(0xFF52525B))),
                  )).toList(),
                ),
              ],
              if (!hasSub) ...[
                const SizedBox(height: 8),
                const Row(
                  children: [
                    Icon(Icons.lock_rounded, size: 11, color: Color(0xFFB45309)),
                    SizedBox(width: 4),
                    Text('Subscribe to view full profile + contact', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFFB45309))),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
