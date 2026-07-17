import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/profile_provider.dart';
import '../store/theme_provider.dart';
import '../utils/distance.dart';
import '../utils/matcher.dart';
import '../widgets/brand_logo.dart';
import '../widgets/moderation_pill.dart';
import '../widgets/notification_bell.dart';
import '../widgets/theme_toggle.dart';

const _minMatchScore = 30;
const _maxMatches = 5;

const _templateLabels = {
  'classic': 'Classic Executive',
  'modern': 'Modern Minimal',
  'creative': 'Creative Bold',
  'corporate': 'Corporate Sidebar',
  'tech_mono': 'Tech / Dark Mono',
};

int _profileCompletion(CandidateProfile p) {
  var done = 0;
  if (p.photoDataUrl != null) done++;
  if (p.shortTermAmbition != null && p.longTermAmbition != null) done++;
  if (p.education.any((e) => e.enabled)) done++;
  if (p.type == CandidateType.fresher || p.type == CandidateType.experienced) done++;
  if (p.selectedTemplateId != null) done++;
  return ((done / 5) * 100).round();
}

class CandidateDashboardPage extends ConsumerWidget {
  const CandidateDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    if (user == null || user.role != Role.candidate) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.go('/candidate/login'),
      );
      return const SizedBox.shrink();
    }

    final firstName = user.name.split(' ').first;
    final profile = ref.watch(profileProvider.notifier).of(user.id);
    final hasResume = profile.selectedTemplateId != null;

    // Top matches — same scoring engine as JobBrowse, ranked desc by score
    // with distance as a tiebreaker. Hidden below _minMatchScore to keep this
    // section a personalized shortlist rather than the full job list.
    final allJobs = ref.watch(jobsProvider);
    final topMatches = hasResume
        ? (allJobs
            .map((job) => (job: job, result: matchScore(job, profile)))
            .where((x) => x.result.score >= _minMatchScore)
            .toList()
          ..sort((a, b) {
            if (b.result.score != a.result.score) {
              return b.result.score.compareTo(a.result.score);
            }
            final ad = a.result.distanceKm ?? double.infinity;
            final bd = b.result.distanceKm ?? double.infinity;
            return ad.compareTo(bd);
          })).take(_maxMatches).toList()
        : <({Job job, MatchResult result})>[];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: InkWell(
          onTap: () => context.go('/'),
          child: const BrandLogo(size: BrandLogoSize.small),
        ),
        actions: [
          const Padding(padding: EdgeInsets.only(right: 4), child: NotificationBell()),
          const ThemeToggle(),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: AvatarChip(user: user),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _AnimEnter(
              delay: 0,
              child: _HeroCard(
                user: user,
                firstName: firstName,
                isDark: isDark,
                hasResume: hasResume,
                profile: profile,
              ),
            ),
            if (hasResume) ...[
              const SizedBox(height: 16),
              _AnimEnter(
                delay: 60,
                child: _ResumeCard(
                  user: user,
                  profile: profile,
                  isDark: isDark,
                  onView: () => context.go('/candidate/profile/preview'),
                  onEdit: () => context.go('/candidate/profile/build'),
                ),
              ),
              const SizedBox(height: 16),
              _AnimEnter(
                delay: 90,
                child: _TopMatchesSection(
                  isDark: isDark,
                  matches: topMatches,
                  onViewAll: () => context.go('/candidate/jobs'),
                  onOpen: (id) => context.go('/candidate/jobs/$id'),
                ),
              ),
            ],
            const SizedBox(height: 20),
            _AnimEnter(
              delay: 80,
              child: Text(
                'QUICK ACTIONS',
                style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 2,
                  fontWeight: FontWeight.w800,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A),
                ),
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.05,
              children: [
                _AnimEnter(
                  delay: 120,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.description_rounded,
                    colors: const [Color(0xFFF97316), Color(0xFFD97706)],
                    title: 'Build profile',
                    desc: 'Add education, skills, ambitions.',
                    onTap: () => context.go('/candidate/profile/build'),
                  ),
                ),
                _AnimEnter(
                  delay: 160,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.dashboard_customize_rounded,
                    colors: const [Color(0xFF8B5CF6), Color(0xFFD946EF)],
                    title: 'Pick template',
                    desc: '5 stunning single-page designs.',
                  ),
                ),
                _AnimEnter(
                  delay: 200,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.work_rounded,
                    colors: const [Color(0xFF0EA5E9), Color(0xFF06B6D4)],
                    title: 'Browse jobs',
                    desc: 'Openings across Tamil Nadu.',
                    onTap: () => context.go('/candidate/jobs'),
                  ),
                ),
                _AnimEnter(
                  delay: 240,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.favorite_rounded,
                    colors: const [Color(0xFFE11D48), Color(0xFFEC4899)],
                    title: 'Saved jobs',
                    desc: 'Bookmark roles to revisit.',
                    onTap: () => context.go('/candidate/saved'),
                  ),
                ),
                _AnimEnter(
                  delay: 280,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.credit_card_rounded,
                    colors: const [Color(0xFF10B981), Color(0xFF14B8A6)],
                    title: 'Subscription',
                    desc: '₹333 / 45-day apply plan.',
                    onTap: () => context.go('/candidate/subscribe'),
                  ),
                ),
                _AnimEnter(
                  delay: 300,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.assignment_turned_in_rounded,
                    colors: const [Color(0xFFF59E0B), Color(0xFFEA580C)],
                    title: 'My applications',
                    desc: "See all the roles you've applied for.",
                    onTap: () => context.go('/candidate/applications'),
                  ),
                ),
                _AnimEnter(
                  delay: 320,
                  child: _ActionCard(
                    isDark: isDark,
                    icon: Icons.auto_awesome_rounded,
                    colors: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                    title: 'Get matched',
                    desc: 'Our team reaches out with roles.',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _AnimEnter(
              delay: 360,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : const Color(0xFFE4E4E7),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF97316).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.rocket_launch_rounded,
                        color: Color(0xFFEA580C),
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Subscribe to apply to any of these jobs · Job browsing is always free.',
                        style: TextStyle(
                          fontSize: 11.5,
                          height: 1.4,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.6)
                              : const Color(0xFF52525B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AvatarChip extends ConsumerWidget {
  const AvatarChip({super.key, required this.user});
  final User user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Material(
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
            color: isDark
                ? Colors.white.withValues(alpha: 0.08)
                : const Color(0xFFF4F4F5),
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
                  color: isDark ? Colors.white : const Color(0xFF18181B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.user,
    required this.firstName,
    required this.isDark,
    required this.hasResume,
    required this.profile,
  });
  final User user;
  final String firstName;
  final bool isDark;
  final bool hasResume;
  final CandidateProfile profile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
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
                  const Color(0xFFF97316).withValues(alpha: isDark ? 0.18 : 0.12),
                  const Color(0xFFF97316).withValues(alpha: 0),
                ]),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.auto_awesome_rounded, size: 12, color: Color(0xFFEA580C)),
                    SizedBox(width: 6),
                    Text(
                      'WELCOME ABOARD',
                      style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFEA580C),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Hi $firstName',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.6,
                        color: isDark ? Colors.white : const Color(0xFF09090B),
                      ),
                    ),
                  ),
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: -0.3, end: 0),
                    duration: const Duration(milliseconds: 1200),
                    curve: Curves.elasticOut,
                    builder: (_, t, child) => Transform.rotate(angle: t, child: child),
                    child: const Text('👋', style: TextStyle(fontSize: 28)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Your account is verified. Next up: build your profile, pick a template, and start browsing jobs.',
                style: TextStyle(
                  fontSize: 13.5,
                  height: 1.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.65)
                      : const Color(0xFF52525B),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _Stat(
                      icon: user.emailVerified ? Icons.verified_rounded : Icons.schedule_rounded,
                      label: 'Account',
                      value: user.emailVerified ? 'Verified' : 'Pending',
                      ok: user.emailVerified,
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _Stat(
                      icon: hasResume ? Icons.task_alt_rounded : Icons.description_rounded,
                      label: 'Profile',
                      value: hasResume ? '${_profileCompletion(profile)}%' : 'Not started',
                      ok: hasResume,
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _Stat(
                      icon: Icons.credit_card_rounded,
                      label: 'Plan',
                      value: 'Free',
                      ok: false,
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
              // Moderation status pill — tells the candidate whether their
              // profile is visible to employers, still under review, or
              // needs updating. Only shown once they've submitted a
              // profile (selectedTemplateId set); pre-submission the
              // "start your profile" nudge is enough signal.
              if (hasResume && profile.moderationStatus != null) ...[
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: ModerationPill(
                    status: profile.moderationStatus,
                    notes: profile.moderationNotes,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.icon,
    required this.label,
    required this.value,
    required this.ok,
    required this.isDark,
  });
  final IconData icon;
  final String label;
  final String value;
  final bool ok;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 13, color: ok ? const Color(0xFF10B981) : (isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
              const SizedBox(width: 4),
              Text(
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  letterSpacing: 1.1,
                  fontWeight: FontWeight.w700,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: ok
                  ? const Color(0xFF10B981)
                  : (isDark ? Colors.white : const Color(0xFF09090B)),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.isDark,
    required this.icon,
    required this.colors,
    required this.title,
    required this.desc,
    this.onTap,
  });

  final bool isDark;
  final IconData icon;
  final List<Color> colors;
  final String title;
  final String desc;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.all(14),
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
                  gradient: LinearGradient(
                    colors: colors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: colors.first.withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              if (onTap == null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.08)
                        : const Color(0xFFF4F4F5),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'SOON',
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.55)
                          : const Color(0xFF71717A),
                    ),
                  ),
                )
              else
                const Icon(Icons.arrow_forward_rounded, size: 16, color: Color(0xFFEA580C)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                  color: isDark ? Colors.white : const Color(0xFF09090B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                desc,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  height: 1.35,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (onTap == null) {
      return Opacity(opacity: 0.85, child: card);
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: card,
      ),
    );
  }
}

class _ResumeCard extends StatelessWidget {
  const _ResumeCard({
    required this.user,
    required this.profile,
    required this.isDark,
    required this.onView,
    required this.onEdit,
  });

  final User user;
  final CandidateProfile profile;
  final bool isDark;
  final VoidCallback onView;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final completion = _profileCompletion(profile);
    final templateLabel = _templateLabels[profile.selectedTemplateId] ?? 'Custom';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -30,
            top: -30,
            child: Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF10B981).withValues(alpha: isDark ? 0.18 : 0.12),
                  const Color(0xFF10B981).withValues(alpha: 0),
                ]),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.task_alt_rounded, size: 12, color: Color(0xFF059669)),
                    SizedBox(width: 6),
                    Text(
                      'MY RESUME',
                      style: TextStyle(
                        fontSize: 10,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                user.name,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.4,
                  color: isDark ? Colors.white : const Color(0xFF09090B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                templateLabel,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.6)
                      : const Color(0xFF52525B),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(99),
                      child: LinearProgressIndicator(
                        value: completion / 100,
                        minHeight: 6,
                        backgroundColor: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : const Color(0xFFE4E4E7),
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$completion%',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onView,
                      icon: const Icon(Icons.visibility_rounded, size: 16),
                      label: const Text('View',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 4,
                        shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onEdit,
                      icon: const Icon(Icons.edit_rounded, size: 16),
                      label: const Text('Edit',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: BorderSide(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : const Color(0xFFE4E4E7),
                        ),
                        foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TopMatchesSection extends StatelessWidget {
  const _TopMatchesSection({
    required this.isDark,
    required this.matches,
    required this.onViewAll,
    required this.onOpen,
  });

  final bool isDark;
  final List<({Job job, MatchResult result})> matches;
  final VoidCallback onViewAll;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF97316).withValues(alpha: isDark ? 0.18 : 0.10),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.adjust_rounded, size: 12, color: Color(0xFFEA580C)),
                    SizedBox(width: 4),
                    Text(
                      'MATCHED FOR YOU',
                      style: TextStyle(
                        fontSize: 9.5,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFEA580C),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (matches.isNotEmpty)
                TextButton(
                  onPressed: onViewAll,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    minimumSize: const Size(0, 28),
                    visualDensity: VisualDensity.compact,
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View all',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_rounded, size: 13),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            matches.isEmpty
                ? 'No strong matches yet'
                : 'Your top ${matches.length} match${matches.length == 1 ? "" : "es"}',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            matches.isEmpty
                ? "Keep your profile updated — we'll surface jobs as employers post them."
                : 'Ranked by skills, field, location, and experience fit.',
            style: TextStyle(
              fontSize: 11.5,
              color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A),
            ),
          ),
          const SizedBox(height: 14),
          if (matches.isEmpty)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  style: BorderStyle.solid,
                  color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7),
                ),
              ),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.work_outline_rounded,
                      size: 22,
                      color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Browse all openings — match score will refine as more jobs are posted.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B),
                      ),
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: onViewAll,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF97316),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        elevation: 0,
                      ),
                      child: const Text('Browse all jobs',
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
              ),
            )
          else
            ...List.generate(matches.length, (i) {
              final m = matches[i];
              return Padding(
                padding: EdgeInsets.only(bottom: i == matches.length - 1 ? 0 : 10),
                child: _MatchedJobCard(
                  job: m.job,
                  result: m.result,
                  isDark: isDark,
                  onTap: () => onOpen(m.job.id),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _MatchedJobCard extends StatelessWidget {
  const _MatchedJobCard({
    required this.job,
    required this.result,
    required this.isDark,
    required this.onTap,
  });

  final Job job;
  final MatchResult result;
  final bool isDark;
  final VoidCallback onTap;

  String get _initials {
    final parts = job.employerName.split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
  }

  @override
  Widget build(BuildContext context) {
    final isIt = job.field == JobField.it;
    final colors = bandColors[result.band]!;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0A0A0A) : const Color(0xFFFAFAFA),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFE4E4E7),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      gradient: LinearGradient(
                        colors: isIt
                            ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)]
                            : const [Color(0xFFF97316), Color(0xFFC2410C)],
                      ),
                    ),
                    child: Center(
                      child: Text(
                        _initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 11.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : const Color(0xFF09090B),
                          ),
                        ),
                        Text(
                          job.employerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10.5,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.6)
                                : const Color(0xFF52525B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.bg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: colors.ring, width: 1),
                    ),
                    child: Column(
                      children: [
                        Text(
                          '${result.score}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: colors.text,
                            height: 1,
                          ),
                        ),
                        Text(
                          'MATCH',
                          style: TextStyle(
                            fontSize: 7.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                            color: colors.text,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 5,
                runSpacing: 5,
                children: [
                  _miniPill(Icons.place_rounded, job.location, const Color(0xFF71717A), isDark),
                  _miniPill(
                    isIt ? Icons.code_rounded : Icons.business_center_rounded,
                    fieldLabel[job.field]!,
                    isIt ? const Color(0xFF0284C7) : const Color(0xFFD97706),
                    isDark,
                  ),
                  if (result.distanceKm != null)
                    _miniPill(
                      Icons.near_me_rounded,
                      formatDistance(result.distanceKm),
                      const Color(0xFF059669),
                      isDark,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _miniPill(IconData icon, String text, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 9.5, color: color),
          const SizedBox(width: 3),
          Text(
            text,
            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }
}

class _AnimEnter extends StatelessWidget {
  const _AnimEnter({required this.child, required this.delay});
  final Widget child;
  final int delay;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 400 + delay),
      curve: Curves.easeOutCubic,
      builder: (_, t, c) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, (1 - t) * 16), child: c),
      ),
      child: child,
    );
  }
}
