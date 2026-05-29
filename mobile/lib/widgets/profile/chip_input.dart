import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

class ChipInput extends ConsumerStatefulWidget {
  const ChipInput({
    super.key,
    required this.value,
    required this.onChange,
    this.placeholder,
    this.suggestions = const [],
    this.max,
    this.hint,
  });

  final List<String> value;
  final ValueChanged<List<String>> onChange;
  final String? placeholder;
  final List<String> suggestions;
  final int? max;
  final String? hint;

  @override
  ConsumerState<ChipInput> createState() => _ChipInputState();
}

class _ChipInputState extends ConsumerState<ChipInput> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _add(String raw) {
    final v = raw.trim();
    if (v.isEmpty) return;
    if (widget.value.contains(v)) return;
    if (widget.max != null && widget.value.length >= widget.max!) return;
    widget.onChange([...widget.value, v]);
    _ctrl.clear();
    _focus.requestFocus();
  }

  void _remove(int i) {
    final next = [...widget.value];
    next.removeAt(i);
    widget.onChange(next);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final atMax =
        widget.max != null && widget.value.length >= widget.max!;
    final remaining = widget.suggestions.where((s) => !widget.value.contains(s)).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF09090B) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.10)
                  : const Color(0xFFE4E4E7),
            ),
          ),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ...List.generate(widget.value.length, (i) {
                return _Chip(
                  label: widget.value[i],
                  onRemove: () => _remove(i),
                );
              }),
              IntrinsicWidth(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 120),
                  child: TextField(
                    controller: _ctrl,
                    focusNode: _focus,
                    enabled: !atMax,
                    onSubmitted: _add,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white : const Color(0xFF09090B),
                    ),
                    decoration: InputDecoration(
                      hintText: atMax ? 'Max ${widget.max} reached' : (widget.placeholder ?? 'Type and press Enter'),
                      hintStyle: TextStyle(
                        fontSize: 12.5,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.3)
                            : const Color(0xFFA1A1AA),
                      ),
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (widget.hint != null) ...[
          const SizedBox(height: 6),
          Text(
            '${widget.hint!}${widget.max != null ? ' (${widget.value.length}/${widget.max})' : ''}',
            style: TextStyle(
              fontSize: 11,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.5)
                  : const Color(0xFF71717A),
            ),
          ),
        ],
        if (remaining.isNotEmpty && !atMax) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: remaining
                .map(
                  (s) => InkWell(
                    onTap: () => _add(s),
                    borderRadius: BorderRadius.circular(999),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.15)
                              : const Color(0xFFE4E4E7),
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Text(
                        '+ $s',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.7)
                              : const Color(0xFF52525B),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ],
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.onRemove});
  final String label;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 4, 4, 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF97316), Color(0xFFEA580C)],
        ),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(999),
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.25),
              ),
              child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
