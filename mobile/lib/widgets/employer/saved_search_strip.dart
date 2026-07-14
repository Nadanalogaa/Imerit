import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/auth_provider.dart';
import '../../store/employer_prefs_provider.dart';
import '../candidate_filter_sheet.dart';

/// Horizontal strip of the employer's saved candidate searches. Rendered
/// above the search bar on the candidates page so 1-tap re-apply is
/// always in reach. Long-press a chip → confirm dialog to delete; tap the
/// bell icon on a chip → toggle new-match notifications.
class SavedSearchStrip extends ConsumerWidget {
  const SavedSearchStrip({
    super.key,
    required this.onApply,
  });

  final ValueChanged<CandidateFilterState> onApply;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final employer = ref.watch(authProvider);
    if (employer == null) return const SizedBox.shrink();
    final saved = ref
        .watch(savedSearchesProvider)
        .where((s) => s.employerId == employer.id)
        .toList();
    if (saved.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bookmark_rounded, size: 12, color: Color(0xFFEA580C)),
              const SizedBox(width: 4),
              const Text(
                'SAVED SEARCHES',
                style: TextStyle(fontSize: 10, letterSpacing: 1.6, fontWeight: FontWeight.w800, color: Color(0xFFEA580C)),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: const Color(0xFFF97316).withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                child: Text('${saved.length}', style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Color(0xFFC2410C))),
              ),
            ],
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.zero,
              itemCount: saved.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, i) {
                final s = saved[i];
                return _SavedChip(
                  search: s,
                  onApply: () {
                    HapticFeedback.selectionClick();
                    onApply(s.filters);
                  },
                  onToggleNotify: () {
                    HapticFeedback.selectionClick();
                    ref.read(savedSearchesProvider.notifier).toggleNotify(s.id);
                  },
                  onLongPress: () async {
                    HapticFeedback.mediumImpact();
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: Text('Delete "${s.name}"?'),
                        content: const Text("You'll lose this saved filter and its new-match notifications."),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Delete', style: TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    );
                    if (ok == true) {
                      ref.read(savedSearchesProvider.notifier).remove(s.id);
                    }
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _SavedChip extends StatelessWidget {
  const _SavedChip({
    required this.search,
    required this.onApply,
    required this.onToggleNotify,
    required this.onLongPress,
  });

  final SavedCandidateSearch search;
  final VoidCallback onApply;
  final VoidCallback onToggleNotify;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onApply,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFFFFF7ED), Color(0xFFFEEDD5)]),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.35)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.bookmark_rounded, size: 11, color: Color(0xFFEA580C)),
              const SizedBox(width: 5),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 140),
                child: Text(
                  search.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFFC2410C)),
                ),
              ),
              const SizedBox(width: 6),
              InkWell(
                onTap: onToggleNotify,
                borderRadius: BorderRadius.circular(999),
                child: Padding(
                  padding: const EdgeInsets.all(2),
                  child: Icon(
                    search.notify ? Icons.notifications_active_rounded : Icons.notifications_off_rounded,
                    size: 12,
                    color: search.notify ? const Color(0xFFEA580C) : const Color(0xFFA1A1AA),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
