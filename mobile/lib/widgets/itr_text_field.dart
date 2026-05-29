import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/theme_provider.dart';

class ItrTextField extends ConsumerWidget {
  const ItrTextField({
    super.key,
    required this.label,
    required this.controller,
    this.placeholder,
    this.keyboardType,
    this.maxLength,
    this.error,
    this.hint,
    this.formatters,
    this.autofocus = false,
  });

  final String label;
  final TextEditingController controller;
  final String? placeholder;
  final TextInputType? keyboardType;
  final int? maxLength;
  final String? error;
  final String? hint;
  final List<TextInputFormatter>? formatters;
  final bool autofocus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final hasError = error != null && error!.isNotEmpty;
    final borderColor = hasError
        ? const Color(0xFFFB7185)
        : (isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7));
    final focusColor = hasError
        ? const Color(0xFFEF4444)
        : const Color(0xFFF97316);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark
                ? Colors.white.withValues(alpha: 0.85)
                : const Color(0xFF3F3F46),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          autofocus: autofocus,
          keyboardType: keyboardType,
          inputFormatters: formatters,
          maxLength: maxLength,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.white : const Color(0xFF09090B),
          ),
          decoration: InputDecoration(
            counterText: '',
            hintText: placeholder,
            hintStyle: TextStyle(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.35)
                  : const Color(0xFFA1A1AA),
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: focusColor, width: 1.5),
            ),
          ),
        ),
        if (hint != null && !hasError)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              hint!,
              style: TextStyle(
                fontSize: 11,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.5)
                    : const Color(0xFF71717A),
              ),
            ),
          ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              error!,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFFEF4444),
              ),
            ),
          ),
      ],
    );
  }
}
