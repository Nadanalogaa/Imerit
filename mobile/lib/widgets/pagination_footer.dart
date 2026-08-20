import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Simple pagination footer for a client-side-paginated list. Flutter port
/// of `web/src/components/Pagination.tsx`.
///
/// Window strategy — always show first + last + a small window around the
/// current page (2 on each side). Ellipses (…) between gaps. Keeps the
/// button strip compact (~7–9 slots) even at page 50.
///
/// Renders nothing when [totalPages] is ≤ 1 so tiny result sets don't get
/// visual noise. The parent slices its data by [pageSize] and rebuilds when
/// [onChange] fires with the 1-based next page number.
class PaginationFooter extends StatelessWidget {
  const PaginationFooter({
    super.key,
    required this.page,
    required this.totalPages,
    required this.totalItems,
    required this.pageSize,
    required this.onChange,
    this.isDark = false,
    this.accent = const Color(0xFFF97316),
  });

  final int page;
  final int totalPages;
  final int totalItems;
  final int pageSize;
  final ValueChanged<int> onChange;
  final bool isDark;

  /// Brand tint for the active page pill. Defaults to orange (candidate side);
  /// pass sky-blue on the employer side to match the rest of that page.
  final Color accent;

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();
    final clamped = page.clamp(1, totalPages);

    // Compute the slot list — first, a small window around current, last.
    const first = 1;
    final last = totalPages;
    final windowPages = <int>[];
    for (var p = clamped - 2; p <= clamped + 2; p++) {
      if (p >= first && p <= last) windowPages.add(p);
    }
    final slots = <int>{first, ...windowPages, last}.toList()..sort();

    final shownFrom = (clamped - 1) * pageSize + 1;
    final shownTo = (clamped * pageSize).clamp(0, totalItems);

    void go(int p) {
      if (p < 1 || p > totalPages || p == clamped) return;
      HapticFeedback.selectionClick();
      onChange(p);
    }

    final borderColor =
        isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7);
    final surface = isDark ? const Color(0xFF18181B) : Colors.white;
    final mutedText =
        isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B);
    final strongText = isDark ? Colors.white : const Color(0xFF09090B);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.center,
        spacing: 12,
        runSpacing: 8,
        children: [
          RichText(
            text: TextSpan(
              style: TextStyle(fontSize: 11.5, color: mutedText),
              children: [
                const TextSpan(text: 'Showing '),
                TextSpan(
                  text: '$shownFrom–$shownTo',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: strongText,
                  ),
                ),
                const TextSpan(text: ' of '),
                TextSpan(
                  text: '$totalItems',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    color: strongText,
                  ),
                ),
              ],
            ),
          ),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _StepButton(
                icon: Icons.chevron_left_rounded,
                label: 'Prev',
                disabled: clamped <= 1,
                onTap: () => go(clamped - 1),
                isDark: isDark,
              ),
              for (var i = 0; i < slots.length; i++) ...[
                if (i > 0 && slots[i] - slots[i - 1] > 1)
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Text(
                      '…',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFFA1A1AA),
                      ),
                    ),
                  ),
                _PageChip(
                  page: slots[i],
                  isActive: slots[i] == clamped,
                  onTap: () => go(slots[i]),
                  isDark: isDark,
                  accent: accent,
                ),
              ],
              _StepButton(
                icon: Icons.chevron_right_rounded,
                label: 'Next',
                trailingIcon: true,
                disabled: clamped >= totalPages,
                onTap: () => go(clamped + 1),
                isDark: isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.icon,
    required this.label,
    required this.disabled,
    required this.onTap,
    required this.isDark,
    this.trailingIcon = false,
  });

  final IconData icon;
  final String label;
  final bool disabled;
  final VoidCallback onTap;
  final bool isDark;
  final bool trailingIcon;

  @override
  Widget build(BuildContext context) {
    final borderColor =
        isDark ? Colors.white.withValues(alpha: 0.14) : const Color(0xFFE4E4E7);
    final text =
        isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46);
    final child = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!trailingIcon) Icon(icon, size: 13, color: text),
          if (!trailingIcon) const SizedBox(width: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: text,
            ),
          ),
          if (trailingIcon) const SizedBox(width: 2),
          if (trailingIcon) Icon(icon, size: 13, color: text),
        ],
      ),
    );
    return Opacity(
      opacity: disabled ? 0.4 : 1.0,
      child: Material(
        color: Colors.transparent,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: borderColor),
          borderRadius: BorderRadius.circular(999),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: disabled ? null : onTap,
          child: child,
        ),
      ),
    );
  }
}

class _PageChip extends StatelessWidget {
  const _PageChip({
    required this.page,
    required this.isActive,
    required this.onTap,
    required this.isDark,
    required this.accent,
  });

  final int page;
  final bool isActive;
  final VoidCallback onTap;
  final bool isDark;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    final text = isActive
        ? Colors.white
        : (isDark
            ? Colors.white.withValues(alpha: 0.85)
            : const Color(0xFF3F3F46));
    return Material(
      color: isActive ? accent : Colors.transparent,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: isActive ? null : onTap,
        child: Container(
          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: isActive
              ? BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: accent.withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                )
              : null,
          alignment: Alignment.center,
          child: Text(
            '$page',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: text,
            ),
          ),
        ),
      ),
    );
  }
}
