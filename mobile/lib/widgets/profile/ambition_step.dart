import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../store/theme_provider.dart';

const _maxLen = 220;

class AmbitionStepWidget extends ConsumerWidget {
  const AmbitionStepWidget({
    super.key,
    required this.shortCtrl,
    required this.longCtrl,
    this.shortError,
    this.longError,
    required this.onChange,
  });

  final TextEditingController shortCtrl;
  final TextEditingController longCtrl;
  final String? shortError;
  final String? longError;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: isDark
                ? LinearGradient(colors: [
                    const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                    const Color(0xFFD946EF).withValues(alpha: 0.06),
                  ])
                : const LinearGradient(colors: [Color(0xFFF5F3FF), Color(0xFFFAE8FF)]),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark
                  ? const Color(0xFF8B5CF6).withValues(alpha: 0.2)
                  : const Color(0xFFE9D5FF),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.auto_awesome_rounded, size: 18, color: Color(0xFF7C3AED)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Our team uses your ambitions to match you with relevant industries and roles. Be honest and specific.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.45,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.85)
                        : const Color(0xFF52525B),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        _AmbField(
          icon: Icons.flag_rounded,
          iconColor: const Color(0xFF059669),
          label: 'Short-term ambition',
          helper: 'Where do you want to be in the next 1–2 years?',
          hint: 'e.g. Land a junior software role at a Tamil Nadu startup and ship features within 6 months.',
          ctrl: shortCtrl,
          error: shortError,
          onChange: onChange,
          isDark: isDark,
        ),
        const SizedBox(height: 16),
        _AmbField(
          icon: Icons.explore_rounded,
          iconColor: const Color(0xFF0284C7),
          label: 'Long-term ambition',
          helper: 'Where do you see yourself in 5–10 years?',
          hint: 'e.g. Lead an engineering team and mentor first-generation graduates from rural Tamil Nadu into tech careers.',
          ctrl: longCtrl,
          error: longError,
          onChange: onChange,
          isDark: isDark,
        ),
      ],
    );
  }
}

class _AmbField extends StatelessWidget {
  const _AmbField({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.helper,
    required this.hint,
    required this.ctrl,
    required this.error,
    required this.onChange,
    required this.isDark,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String helper;
  final String hint;
  final TextEditingController ctrl;
  final String? error;
  final VoidCallback onChange;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: iconColor),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          helper,
          style: TextStyle(
            fontSize: 11.5,
            color: isDark
                ? Colors.white.withValues(alpha: 0.55)
                : const Color(0xFF71717A),
          ),
        ),
        const SizedBox(height: 8),
        ListenableBuilder(
          listenable: ctrl,
          builder: (_, _) {
            final hasError = error != null && error!.isNotEmpty;
            return TextField(
              controller: ctrl,
              maxLines: 3,
              maxLength: _maxLen,
              onChanged: (_) => onChange(),
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white : const Color(0xFF09090B),
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(
                  fontSize: 12.5,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.3)
                      : const Color(0xFFA1A1AA),
                ),
                filled: true,
                fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                counterText: '',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: hasError
                        ? const Color(0xFFFB7185)
                        : (isDark
                            ? Colors.white.withValues(alpha: 0.12)
                            : const Color(0xFFE4E4E7)),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: hasError
                        ? const Color(0xFFFB7185)
                        : (isDark
                            ? Colors.white.withValues(alpha: 0.12)
                            : const Color(0xFFE4E4E7)),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: hasError ? const Color(0xFFEF4444) : const Color(0xFFF97316),
                    width: 1.5,
                  ),
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            if (error != null && error!.isNotEmpty)
              Text(error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))
            else
              Text(
                'Keep it short — about 2 lines.',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.4)
                      : const Color(0xFFA1A1AA),
                ),
              ),
            ListenableBuilder(
              listenable: ctrl,
              builder: (_, _) => Text(
                '${ctrl.text.length} / $_maxLen',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: ctrl.text.length > _maxLen * 0.85
                      ? const Color(0xFFF59E0B)
                      : (isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
