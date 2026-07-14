import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../store/auth_provider.dart';
import '../../store/employer_prefs_provider.dart';
import '../../store/profile_provider.dart';

/// Horizontal strip of the employer's most recently viewed candidate
/// profiles. Rendered above the search bar so an employer flipping between
/// candidates never loses their place. Tap a chip to jump straight to the
/// candidate's detail page.
class RecentlyViewedStrip extends ConsumerWidget {
  const RecentlyViewedStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final employer = ref.watch(authProvider);
    if (employer == null) return const SizedBox.shrink();
    final ids = ref
        .watch(recentCandidatesProvider)[employer.id] ?? const <String>[];
    if (ids.isEmpty) return const SizedBox.shrink();
    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final profiles = ref.watch(profileProvider);

    // Resolve id → (user, profile). Any entries whose profile/user is
    // gone are silently dropped; we don't touch storage from a read.
    final resolved = ids
        .map((id) {
          final u = allUsers.where((x) => x.id == id).firstOrNull;
          final p = profiles[id];
          if (u == null || p == null) return null;
          return (u, p);
        })
        .whereType<(User, CandidateProfile)>()
        .toList();
    if (resolved.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.history_rounded, size: 12, color: Color(0xFF6366F1)),
              const SizedBox(width: 4),
              const Text(
                'RECENTLY VIEWED',
                style: TextStyle(fontSize: 10, letterSpacing: 1.6, fontWeight: FontWeight.w800, color: Color(0xFF6366F1)),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  ref.read(recentCandidatesProvider.notifier).clear(employer.id);
                },
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4), minimumSize: Size.zero),
                child: const Text('Clear', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Color(0xFFA1A1AA))),
              ),
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.zero,
              itemCount: resolved.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final (u, p) = resolved[i];
                return _RecentTile(user: u, profile: p);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentTile extends StatelessWidget {
  const _RecentTile({required this.user, required this.profile});
  final User user;
  final CandidateProfile profile;

  @override
  Widget build(BuildContext context) {
    final initials = user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
    final firstName = user.name.split(' ').first;
    return SizedBox(
      width: 68,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            context.go('/employer/candidates/${user.id}');
          },
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.30), blurRadius: 6, offset: const Offset(0, 3)),
                  ],
                ),
                child: Center(
                  child: Text(
                    initials.isEmpty ? '—' : initials,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                firstName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF52525B)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
