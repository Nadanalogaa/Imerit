import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';

/// Interactive save/bookmark button used across job cards and the job
/// detail page. Provides an optimistic flip + rose-tinted pulse + haptic
/// tick + snackbar confirmation on each tap. Mirrors the web
/// `toggleSaveAsync` optimistic UI but with the touch-native feedback
/// (haptics + burst animation) that only make sense on mobile.
class SaveJobButton extends ConsumerStatefulWidget {
  const SaveJobButton({
    super.key,
    required this.jobId,
    required this.jobTitle,
    this.size = SaveJobButtonSize.medium,
    this.tone = SaveJobButtonTone.rose,
  });

  final String jobId;
  final String jobTitle;
  final SaveJobButtonSize size;
  final SaveJobButtonTone tone;

  @override
  ConsumerState<SaveJobButton> createState() => _SaveJobButtonState();
}

enum SaveJobButtonSize { small, medium, large }

enum SaveJobButtonTone { rose, brand }

class _SaveJobButtonState extends ConsumerState<SaveJobButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _burst;

  @override
  void initState() {
    super.initState();
    _burst = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
  }

  @override
  void dispose() {
    _burst.dispose();
    super.dispose();
  }

  double get _iconSize => switch (widget.size) {
        SaveJobButtonSize.small => 14,
        SaveJobButtonSize.medium => 18,
        SaveJobButtonSize.large => 22,
      };

  double get _padding => switch (widget.size) {
        SaveJobButtonSize.small => 6,
        SaveJobButtonSize.medium => 8,
        SaveJobButtonSize.large => 10,
      };

  Color get _tone => switch (widget.tone) {
        SaveJobButtonTone.rose => const Color(0xFFE11D48),
        SaveJobButtonTone.brand => const Color(0xFFF97316),
      };

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider);
    if (user == null) return const SizedBox.shrink();
    // Watch the AppData state directly so the button re-renders when the
    // save map changes. Reading via the notifier's helper method wouldn't
    // re-run this build on state changes.
    final saved = ref.watch(applicationsProvider).saved[user.id] ?? const [];
    final isSaved = saved.contains(widget.jobId);

    return Semantics(
      button: true,
      label: isSaved ? 'Remove ${widget.jobTitle} from saved' : 'Save ${widget.jobTitle}',
      child: GestureDetector(
        onTap: () {
          HapticFeedback.mediumImpact();
          ref.read(applicationsProvider.notifier).toggleSave(user.id, widget.jobId);
          _burst
            ..reset()
            ..forward();
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(children: [
                Icon(isSaved ? Icons.bookmark_remove_rounded : Icons.bookmark_added_rounded, size: 16, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isSaved
                        ? 'Removed from saved'
                        : 'Saved · we\'ll surface similar jobs',
                    style: const TextStyle(fontSize: 12.5),
                  ),
                ),
              ]),
              backgroundColor: isSaved ? const Color(0xFF71717A) : _tone,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              margin: const EdgeInsets.all(16),
              duration: const Duration(seconds: 2),
            ),
          );
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Pulse ring — expands + fades out on tap.
            AnimatedBuilder(
              animation: _burst,
              builder: (_, __) {
                final t = _burst.value;
                if (t == 0) return const SizedBox.shrink();
                return Opacity(
                  opacity: (1 - t).clamp(0, 1),
                  child: Container(
                    width: (_iconSize + _padding * 2 + 4) + (t * 24),
                    height: (_iconSize + _padding * 2 + 4) + (t * 24),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: _tone, width: 2),
                    ),
                  ),
                );
              },
            ),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: EdgeInsets.all(_padding),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSaved ? _tone.withValues(alpha: 0.14) : Colors.white,
                border: Border.all(
                  color: isSaved ? _tone : const Color(0xFFE4E4E7),
                  width: isSaved ? 1.5 : 1,
                ),
                boxShadow: isSaved
                    ? [BoxShadow(color: _tone.withValues(alpha: 0.30), blurRadius: 10, offset: const Offset(0, 4))]
                    : null,
              ),
              child: AnimatedScale(
                scale: isSaved ? 1.15 : 1,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutBack,
                child: Icon(
                  isSaved ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
                  size: _iconSize,
                  color: isSaved ? _tone : const Color(0xFF71717A),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
