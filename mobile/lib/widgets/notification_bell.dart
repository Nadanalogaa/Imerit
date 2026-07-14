import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/employer_prefs_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/profile_provider.dart';

/// Per-role notification bell. Same shape across candidate, employer, and
/// admin surfaces; the content adapts to the viewer:
///
///  - **Candidate** — application status changes + saved-job expiries
///  - **Employer** — new applicants + expiring job postings + expired jobs
///  - **Admin** — recent employer signups (kept simple; the web admin has
///    a full audit log which mobile doesn't need to mirror)
///
/// Tapping the bell opens a slide-up sheet with the feed. Unread count is
/// derived from the shared providers so no separate storage is needed.
class NotificationBell extends ConsumerWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider);
    if (user == null) return const SizedBox.shrink();
    final feed = _buildFeed(ref, user);

    return Semantics(
      button: true,
      label: '${feed.length} notifications',
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          _reconcileSavedSearches(ref, user);
          showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => _NotificationSheet(feed: feed),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.transparent,
                border: Border.all(color: const Color(0xFFE4E4E7)),
              ),
              child: const Icon(Icons.notifications_rounded, size: 18, color: Color(0xFF52525B)),
            ),
            if (feed.isNotEmpty)
              Positioned(
                top: -2,
                right: -2,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.6, end: 1),
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.elasticOut,
                  builder: (_, t, child) => Transform.scale(scale: t, child: child),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFFE11D48), Color(0xFFEC4899)]),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: Colors.white, width: 1.5),
                      boxShadow: [BoxShadow(color: const Color(0xFFE11D48).withValues(alpha: 0.4), blurRadius: 6, offset: const Offset(0, 2))],
                    ),
                    child: Text(
                      feed.length > 9 ? '9+' : '${feed.length}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Advance each notify-enabled saved search's `knownCandidateIds` to the
  /// current match set, so the same candidate never appears in the bell
  /// twice. Invoked the moment the sheet opens — from the user's point of
  /// view they've now "seen" every match that was queued up.
  void _reconcileSavedSearches(WidgetRef ref, User user) {
    if (user.role != Role.employer) return;
    final savedSearches = ref
        .read(savedSearchesProvider)
        .where((s) => s.employerId == user.id && s.notify)
        .toList();
    if (savedSearches.isEmpty) return;
    final allUsers = ref.read(authProvider.notifier).allUsers();
    final profiles = ref.read(profileProvider);
    final locations = ref.read(locationsProvider);
    final activeJobs = ref
        .read(jobsProvider.notifier)
        .postedBy(user.id)
        .where((j) => !j.isExpired)
        .toList();
    final candidatePool = allUsers
        .where((u) => u.role == Role.candidate)
        .map((u) => (u, profiles[u.id]))
        .where((t) => t.$2 != null && t.$2!.selectedTemplateId != null)
        .map((t) => (t.$1, t.$2!))
        .toList();
    for (final s in savedSearches) {
      final nearJob = s.filters.nearJobId != null
          ? activeJobs.where((j) => j.id == s.filters.nearJobId).firstOrNull
          : null;
      final currentIds = candidatePool
          .where((c) => s.filters.matches(c.$2, locations: locations, nearJob: nearJob))
          .map((c) => c.$1.id)
          .toList();
      ref.read(savedSearchesProvider.notifier).reconcile(s.id, currentIds);
    }
  }

  List<_NotificationItem> _buildFeed(WidgetRef ref, User user) {
    final items = <_NotificationItem>[];
    final now = DateTime.now();

    if (user.role == Role.candidate) {
      final apps = ref.read(applicationsProvider.notifier).appsFor(user.id);
      final jobs = ref.read(jobsProvider);
      for (final app in apps.take(6)) {
        final job = jobs.where((j) => j.id == app.jobId).firstOrNull;
        if (job == null) continue;
        items.add(_NotificationItem(
          icon: Icons.mark_email_read_rounded,
          tone: const Color(0xFF10B981),
          title: 'Application submitted',
          body: '${job.title} · ${job.employerName}',
          when: app.appliedAt,
          route: '/candidate/jobs/${job.id}',
        ));
      }
      final savedIds = ref.read(applicationsProvider.notifier).savedFor(user.id);
      for (final id in savedIds.take(3)) {
        final job = jobs.where((j) => j.id == id).firstOrNull;
        if (job == null) continue;
        if (job.isExpired) {
          items.add(_NotificationItem(
            icon: Icons.schedule_rounded,
            tone: const Color(0xFFE11D48),
            title: 'Saved job expired',
            body: '${job.title} · ${job.employerName}',
            when: job.expiresAt,
            route: '/candidate/saved',
          ));
        } else if (job.daysUntilExpiry <= 3) {
          items.add(_NotificationItem(
            icon: Icons.hourglass_bottom_rounded,
            tone: const Color(0xFFF59E0B),
            title: 'Saved job closing soon',
            body: '${job.title} — ${job.daysUntilExpiry} day${job.daysUntilExpiry == 1 ? "" : "s"} left',
            when: job.expiresAt,
            route: '/candidate/jobs/${job.id}',
          ));
        }
      }
    } else if (user.role == Role.employer) {
      final jobs = ref.read(jobsProvider.notifier).postedBy(user.id);
      final apps = ref.read(applicationsProvider).applications;
      for (final job in jobs) {
        final n = apps.where((a) => a.jobId == job.id).length;
        if (n > 0) {
          final latest = apps
              .where((a) => a.jobId == job.id)
              .fold<Application?>(null, (a, b) => a == null || b.appliedAt.compareTo(a.appliedAt) > 0 ? b : a);
          items.add(_NotificationItem(
            icon: Icons.person_add_rounded,
            tone: const Color(0xFF10B981),
            title: '$n applicant${n == 1 ? "" : "s"} · ${job.title}',
            body: 'Tap to review',
            when: latest?.appliedAt ?? job.postedAt,
            route: '/employer/jobs/${job.id}/applicants',
          ));
        }
        if (job.isExpired) {
          items.add(_NotificationItem(
            icon: Icons.schedule_rounded,
            tone: const Color(0xFFE11D48),
            title: 'Job expired · ${job.title}',
            body: 'Repost to make it live again',
            when: job.expiresAt,
            route: '/employer/my-jobs',
          ));
        } else if (job.daysUntilExpiry <= 7) {
          items.add(_NotificationItem(
            icon: Icons.hourglass_bottom_rounded,
            tone: const Color(0xFFF59E0B),
            title: 'Job closing soon · ${job.title}',
            body: '${job.daysUntilExpiry} day${job.daysUntilExpiry == 1 ? "" : "s"} left',
            when: job.expiresAt,
            route: '/employer/my-jobs',
          ));
        }
      }

      // Saved-search matches — flag any candidates who newly meet a
      // saved search since it was last reconciled. Reconciliation happens
      // as the bell is opened (see `_NotificationSheet` below) so a match
      // fires exactly once.
      final savedSearches = ref
          .read(savedSearchesProvider)
          .where((s) => s.employerId == user.id && s.notify)
          .toList();
      if (savedSearches.isNotEmpty) {
        final allUsers = ref.read(authProvider.notifier).allUsers();
        final profiles = ref.read(profileProvider);
        final locations = ref.read(locationsProvider);
        final activeJobs = ref
            .read(jobsProvider.notifier)
            .postedBy(user.id)
            .where((j) => !j.isExpired)
            .toList();
        final candidatePool = allUsers
            .where((u) => u.role == Role.candidate)
            .map((u) => (u, profiles[u.id]))
            .where((t) => t.$2 != null && t.$2!.selectedTemplateId != null)
            .map((t) => (t.$1, t.$2!))
            .toList();
        for (final s in savedSearches) {
          final nearJob = s.filters.nearJobId != null
              ? activeJobs.where((j) => j.id == s.filters.nearJobId).firstOrNull
              : null;
          final currentIds = candidatePool
              .where((c) => s.filters.matches(c.$2, locations: locations, nearJob: nearJob))
              .map((c) => c.$1.id)
              .toList();
          final fresh = currentIds.where((id) => !s.knownCandidateIds.contains(id)).toList();
          if (fresh.isEmpty) continue;
          items.add(_NotificationItem(
            icon: Icons.person_search_rounded,
            tone: const Color(0xFF7C3AED),
            title: '${fresh.length} new match${fresh.length == 1 ? "" : "es"} · ${s.name}',
            body: fresh.length == 1
                ? 'A new candidate hit your saved filters'
                : '${fresh.length} candidates hit your saved filters',
            when: DateTime.now().toIso8601String(),
            route: '/employer/candidates',
          ));
        }
      }
    }

    items.sort((a, b) {
      final da = DateTime.tryParse(a.when) ?? now;
      final db = DateTime.tryParse(b.when) ?? now;
      return db.compareTo(da);
    });
    return items;
  }
}

class _NotificationItem {
  const _NotificationItem({
    required this.icon,
    required this.tone,
    required this.title,
    required this.body,
    required this.when,
    required this.route,
  });
  final IconData icon;
  final Color tone;
  final String title;
  final String body;
  final String when;
  final String route;
}

class _NotificationSheet extends StatelessWidget {
  const _NotificationSheet({required this.feed});
  final List<_NotificationItem> feed;

  String _rel(String iso) {
    final t = DateTime.tryParse(iso);
    if (t == null) return '';
    final diff = DateTime.now().difference(t);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${diff.inDays ~/ 7}w';
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(width: 44, height: 4, decoration: BoxDecoration(color: const Color(0xFFE4E4E7), borderRadius: BorderRadius.circular(999))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
              child: Row(children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFFE11D48), Color(0xFFEC4899)]), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.notifications_active_rounded, size: 18, color: Colors.white),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Notifications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF09090B))),
                      Text('Latest activity across your account', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                    ],
                  ),
                ),
              ]),
            ),
            Expanded(
              child: feed.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFFE11D48).withValues(alpha: 0.10)),
                              child: const Icon(Icons.check_circle_rounded, size: 30, color: Color(0xFFE11D48)),
                            ),
                            const SizedBox(height: 10),
                            const Text('All caught up', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            const Text('No new notifications right now.', style: TextStyle(fontSize: 12, color: Color(0xFF71717A))),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: feed.length,
                      itemBuilder: (context, i) {
                        final item = feed[i];
                        return _NotificationRow(item: item, relative: _rel(item.when));
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  const _NotificationRow({required this.item, required this.relative});
  final _NotificationItem item;
  final String relative;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).pop();
            context.go(item.route);
          },
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFF4F4F5)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: item.tone.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                  child: Icon(item.icon, size: 18, color: item.tone),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF09090B))),
                      const SizedBox(height: 2),
                      Text(item.body, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11.5, color: Color(0xFF71717A))),
                    ],
                  ),
                ),
                Text(relative, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFFA1A1AA))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
