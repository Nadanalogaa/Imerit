import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../store/auth_provider.dart';
import '../../store/employer_prefs_provider.dart';
import '../../store/profile_provider.dart';

/// Floating tray shown at the bottom of the employer candidates page while
/// their shortlist is non-empty. Slides up when the count goes from 0 → 1,
/// slides out when the last card is unshortlisted. Provides two actions:
///
/// * **View** — opens a bottom-sheet review of everyone shortlisted, with a
///   quick-navigate list.
/// * **Clear** — empties the shortlist after a confirmation.
///
/// Long-press a candidate card elsewhere to toggle membership. Batch-invite
/// is intentionally left as a follow-up to keep the API surface small; the
/// review sheet points employers at each candidate's detail page for now.
class ShortlistBar extends ConsumerWidget {
  const ShortlistBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final employer = ref.watch(authProvider);
    if (employer == null) return const SizedBox.shrink();
    final ids = ref.watch(shortlistProvider)[employer.id] ?? const <String>[];

    return AnimatedSlide(
      offset: ids.isEmpty ? const Offset(0, 1.4) : Offset.zero,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      child: AnimatedOpacity(
        opacity: ids.isEmpty ? 0 : 1,
        duration: const Duration(milliseconds: 200),
        child: IgnorePointer(
          ignoring: ids.isEmpty,
          child: SafeArea(
            top: false,
            minimum: const EdgeInsets.symmetric(horizontal: 16),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)]),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFF7C3AED).withValues(alpha: 0.40), blurRadius: 20, offset: const Offset(0, 8)),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(999)),
                      child: Text(
                        '${ids.length}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'shortlisted',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white),
                      ),
                    ),
                    _BarButton(
                      icon: Icons.visibility_rounded,
                      label: 'View',
                      onTap: () {
                        HapticFeedback.selectionClick();
                        showModalBottomSheet<void>(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => _ShortlistSheet(employerId: employer.id),
                        );
                      },
                    ),
                    const SizedBox(width: 8),
                    _BarButton(
                      icon: Icons.delete_outline_rounded,
                      label: 'Clear',
                      onTap: () async {
                        HapticFeedback.mediumImpact();
                        final ok = await showDialog<bool>(
                          context: context,
                          builder: (_) => AlertDialog(
                            title: Text('Clear ${ids.length} shortlisted?'),
                            content: const Text('This only clears your shortlist. The candidate profiles stay put.'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text('Clear', style: TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.w800)),
                              ),
                            ],
                          ),
                        );
                        if (ok == true) {
                          ref.read(shortlistProvider.notifier).clear(employer.id);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BarButton extends StatelessWidget {
  const _BarButton({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13, color: Colors.white),
              const SizedBox(width: 4),
              Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Colors.white)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShortlistSheet extends ConsumerWidget {
  const _ShortlistSheet({required this.employerId});
  final String employerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ids = ref.watch(shortlistProvider)[employerId] ?? const <String>[];
    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final profiles = ref.watch(profileProvider);
    final rows = ids
        .map((id) {
          final u = allUsers.where((x) => x.id == id).firstOrNull;
          final p = profiles[id];
          if (u == null || p == null) return null;
          return (u, p);
        })
        .whereType<(User, CandidateProfile)>()
        .toList();

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
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
                  decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)]), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.bookmark_rounded, size: 18, color: Colors.white),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${rows.length} shortlisted', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF09090B))),
                      const Text('Tap to open the full profile', style: TextStyle(fontSize: 11, color: Color(0xFF71717A))),
                    ],
                  ),
                ),
              ]),
            ),
            Expanded(
              child: ListView.separated(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
                itemCount: rows.length,
                separatorBuilder: (_, __) => const SizedBox(height: 6),
                itemBuilder: (context, i) {
                  final (u, p) = rows[i];
                  final initials = u.name.split(RegExp(r'\s+')).take(2).map((x) => x.isEmpty ? '' : x[0].toUpperCase()).join();
                  return Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        Navigator.of(context).pop();
                        context.go('/employer/candidates/${u.id}');
                      },
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFF4F4F5)),
                        ),
                        child: Row(children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF6D28D9)]), borderRadius: BorderRadius.circular(12)),
                            child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(u.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF09090B))),
                                Text(
                                  p.preferredLocation ?? p.itSpecialization ?? '—',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              ref.read(shortlistProvider.notifier).toggle(employerId, u.id);
                            },
                            borderRadius: BorderRadius.circular(999),
                            child: const Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(Icons.close_rounded, size: 16, color: Color(0xFFA1A1AA)),
                            ),
                          ),
                        ]),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
