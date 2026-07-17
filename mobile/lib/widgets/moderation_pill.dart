import 'package:flutter/material.dart';

/// Small colored pill showing the candidate's moderation state so
/// they understand whether they're visible to employers, still
/// waiting on review, or need to update. Falls back to nothing when
/// the status isn't known yet (e.g. offline mode or fresh signup).
///
/// Mirrors the web `<ModerationPill>` in CandidateDashboard.tsx.
class ModerationPill extends StatelessWidget {
  const ModerationPill({super.key, required this.status, this.notes});
  final String? status; // 'PENDING' | 'APPROVED' | 'REJECTED' | null
  final String? notes;

  @override
  Widget build(BuildContext context) {
    if (status == null) return const SizedBox.shrink();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final (bg, fg, label, icon) = switch (status) {
      'APPROVED' => (
        isDark ? const Color(0x2610B981) : const Color(0xFFD1FAE5),
        isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
        'Approved · visible to employers',
        Icons.verified_user_rounded,
      ),
      'REJECTED' => (
        isDark ? const Color(0x26F43F5E) : const Color(0xFFFECDD3),
        isDark ? const Color(0xFFFDA4AF) : const Color(0xFFBE123C),
        'Needs update — see email',
        Icons.warning_amber_rounded,
      ),
      _ => ( // PENDING (default)
        isDark ? const Color(0x26F59E0B) : const Color(0xFFFEF3C7),
        isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309),
        'Under review',
        Icons.schedule_rounded,
      ),
    };
    return Tooltip(
      message: status == 'REJECTED' && notes != null && notes!.isNotEmpty
          ? notes!
          : status == 'APPROVED'
              ? 'Employers can find you in searches.'
              : status == 'REJECTED'
                  ? 'Please review the feedback and resubmit.'
                  : "Our team is reviewing your profile. You'll be visible to employers once approved.",
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: fg),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: fg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
