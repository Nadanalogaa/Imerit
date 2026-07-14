import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/save_job_button.dart';
import '../widgets/theme_toggle.dart';

class JobDetailPage extends ConsumerStatefulWidget {
  const JobDetailPage({super.key, required this.jobId});
  final String jobId;

  @override
  ConsumerState<JobDetailPage> createState() => _JobDetailPageState();
}

class _JobDetailPageState extends ConsumerState<JobDetailPage> {
  void _onApply(Job job) {
    final user = ref.read(authProvider)!;
    if (ref.read(applicationsProvider.notifier).hasApplied(user.id, job.id)) return;
    final active = ref
        .read(subscriptionsProvider.notifier)
        .activeFor(user.id, SubscriberType.candidate);
    if (active == null) {
      final ret = '/candidate/jobs/${job.id}';
      context.go(
        '/candidate/subscribe?return=${Uri.encodeQueryComponent(ret)}&apply=${job.id}',
      );
      return;
    }
    ref.read(applicationsProvider.notifier).apply(user.id, job.id);
    setState(() {});
    _showAppliedDialog(job);
  }

  void _showAppliedDialog(Job job) {
    final isDark = ref.read(themeProvider) == ThemeMode.dark;
    showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: const Duration(milliseconds: 400),
                curve: Curves.elasticOut,
                builder: (_, t, _) => Transform.scale(
                  scale: t,
                  child: Container(
                    width: 70,
                    height: 70,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(colors: [Color(0xFF10B981), Color(0xFF14B8A6)]),
                    ),
                    child: const Icon(Icons.check_rounded, size: 38, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Application submitted!',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF09090B),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Your application for ${job.title} at ${job.employerName} is on its way.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.5,
                  height: 1.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.65)
                      : const Color(0xFF52525B),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        side: BorderSide(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : const Color(0xFFE4E4E7),
                        ),
                        foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Stay here', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        context.go('/candidate/applications');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEA580C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 11),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: const Text('My applications', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
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

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final job = ref.watch(jobsProvider.notifier).byId(widget.jobId);
    final user = ref.watch(authProvider)!;

    if (job == null) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.go('/candidate/jobs'),
      );
      return const SizedBox.shrink();
    }

    final hasApplied = ref.watch(applicationsProvider.notifier).hasApplied(user.id, job.id);
    final activeSub = ref.watch(subscriptionsProvider.notifier).activeFor(user.id, SubscriberType.candidate);
    final isIt = job.field == JobField.it;
    final initials = job.employerName
        .split(RegExp(r'\s+'))
        .take(2)
        .map((p) => p.isEmpty ? '' : p[0].toUpperCase())
        .join();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/candidate/jobs'),
        ),
        title: const Text('Job', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: SaveJobButton(
              jobId: job.id,
              jobTitle: job.title,
              size: SaveJobButtonSize.medium,
            ),
          ),
          const ThemeToggle(),
          const SizedBox(width: 12),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF18181B) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : const Color(0xFFE4E4E7),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            gradient: LinearGradient(
                              colors: isIt
                                  ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)]
                                  : const [Color(0xFFF97316), Color(0xFFC2410C)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              initials,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                job.title,
                                style: TextStyle(
                                  fontSize: 19,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.4,
                                  color: isDark ? Colors.white : const Color(0xFF09090B),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                job.employerName,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.6)
                                      : const Color(0xFF52525B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _PillBig(text: job.location, icon: Icons.place_rounded, isDark: isDark),
                        _PillBig(
                          text: fieldLabel[job.field]!,
                          icon: isIt ? Icons.code_rounded : Icons.business_center_rounded,
                          isDark: isDark,
                        ),
                        _PillBig(text: typeLabel[job.type]!, icon: typeIcon[job.type]!, isDark: isDark),
                        if (job.experience == JobExperience.fresher)
                          _PillBig(text: 'Freshers welcome', icon: Icons.auto_awesome_rounded, isDark: isDark),
                        if (job.experience == JobExperience.experienced && job.yearsMin != null)
                          _PillBig(text: '${job.yearsMin}+ years', icon: Icons.work_rounded, isDark: isDark),
                        _PillBig(
                          text: 'Posted ${relativeTime(job.postedAt)}',
                          icon: Icons.access_time_rounded,
                          isDark: isDark,
                        ),
                      ],
                    ),
                    if (job.salaryRange != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFD1FAE5), Color(0xFFCCFBF1)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.currency_rupee_rounded, size: 14, color: Color(0xFF047857)),
                            const SizedBox(width: 6),
                            Text(
                              job.salaryRange!,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Container(height: 1, color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
                    const SizedBox(height: 18),
                    Text(
                      'ABOUT THE ROLE',
                      style: TextStyle(
                        fontSize: 10.5,
                        letterSpacing: 2,
                        fontWeight: FontWeight.w800,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.55)
                            : const Color(0xFF71717A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      job.description,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.6,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.85)
                            : const Color(0xFF3F3F46),
                      ),
                    ),
                    if (job.skills.isNotEmpty) ...[
                      const SizedBox(height: 18),
                      Container(height: 1, color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
                      const SizedBox(height: 18),
                      Text(
                        'REQUIRED SKILLS',
                        style: TextStyle(
                          fontSize: 10.5,
                          letterSpacing: 2,
                          fontWeight: FontWeight.w800,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.55)
                              : const Color(0xFF71717A),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: job.skills
                            .map((s) => Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.white.withValues(alpha: 0.06)
                                        : const Color(0xFFF4F4F5),
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.check_circle_rounded, size: 11, color: Color(0xFF10B981)),
                                      const SizedBox(width: 5),
                                      Text(
                                        s,
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? Colors.white : const Color(0xFF18181B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),

          // Sticky Apply CTA
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
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
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (hasApplied) ...[
                          const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF059669)),
                              SizedBox(width: 4),
                              Text(
                                "You've applied",
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF059669)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Track in My Applications',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.55)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                        ] else if (activeSub != null) ...[
                          Row(
                            children: [
                              const Icon(Icons.shield_rounded, size: 14, color: Color(0xFF059669)),
                              const SizedBox(width: 4),
                              Text(
                                'Subscription active',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? Colors.white : const Color(0xFF09090B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Until ${_formatDate(DateTime.parse(activeSub.expiresAt))}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.55)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                        ] else ...[
                          Text(
                            'Ready to apply?',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : const Color(0xFF09090B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Apply unlocks with ₹333 / 45-day plan',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.55)
                                  : const Color(0xFF71717A),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: hasApplied ? null : () => _onApply(job),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
                      backgroundColor: const Color(0xFFEA580C),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFF10B981).withValues(alpha: 0.85),
                      disabledForegroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 6,
                      shadowColor: const Color(0xFFEA580C).withValues(alpha: 0.4),
                    ),
                    child: Text(
                      hasApplied ? 'Applied' : (activeSub != null ? 'Apply now' : 'Subscribe & apply'),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
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

String _formatDate(DateTime d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${d.day} ${months[d.month - 1]} ${d.year}';
}

class _PillBig extends StatelessWidget {
  const _PillBig({required this.text, required this.icon, required this.isDark});
  final String text;
  final IconData icon;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.06)
            : const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 11,
            color: isDark
                ? Colors.white.withValues(alpha: 0.7)
                : const Color(0xFF52525B),
          ),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : const Color(0xFF18181B),
            ),
          ),
        ],
      ),
    );
  }
}
