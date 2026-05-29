import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

class SegOption<T> {
  const SegOption({required this.id, required this.label, this.icon});
  final T id;
  final String label;
  final IconData? icon;
}

class SegmentedToggle<T> extends ConsumerWidget {
  const SegmentedToggle({
    super.key,
    required this.value,
    required this.options,
    required this.onChange,
    this.large = false,
  });

  final T? value;
  final List<SegOption<T>> options;
  final ValueChanged<T> onChange;
  final bool large;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.05)
            : const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Row(
        children: options.map((o) {
          final active = o.id == value;
          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              decoration: BoxDecoration(
                gradient: active
                    ? const LinearGradient(
                        colors: [Color(0xFFF97316), Color(0xFFEA580C)],
                      )
                    : null,
                borderRadius: BorderRadius.circular(12),
                boxShadow: active
                    ? [
                        BoxShadow(
                          color: const Color(0xFFF97316).withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => onChange(o.id),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      vertical: large ? 14 : 10,
                      horizontal: 8,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (o.icon != null) ...[
                          Icon(
                            o.icon,
                            size: large ? 18 : 14,
                            color: active
                                ? Colors.white
                                : (isDark
                                    ? Colors.white.withValues(alpha: 0.6)
                                    : const Color(0xFF52525B)),
                          ),
                          const SizedBox(width: 6),
                        ],
                        Flexible(
                          child: Text(
                            o.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: large ? 13.5 : 12,
                              fontWeight: FontWeight.w700,
                              color: active
                                  ? Colors.white
                                  : (isDark
                                      ? Colors.white.withValues(alpha: 0.6)
                                      : const Color(0xFF52525B)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
