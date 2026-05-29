import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/theme_provider.dart';

class SignInChip extends ConsumerWidget {
  const SignInChip({
    super.key,
    required this.onCandidate,
    required this.onEmployer,
  });

  final void Function(String action) onCandidate;
  final void Function(String action) onEmployer;

  void _open(BuildContext context, bool isDark) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.2)
                      : Colors.black.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Sign in or register',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : const Color(0xFF09090B),
                ),
              ),
              const SizedBox(height: 18),
              _Block(
                isDark: isDark,
                tint: const [Color(0xFFF97316), Color(0xFFC2410C)],
                eyebrow: "I'M A CANDIDATE",
                onLogin: () {
                  Navigator.pop(context);
                  onCandidate('login');
                },
                onRegister: () {
                  Navigator.pop(context);
                  onCandidate('register');
                },
              ),
              const SizedBox(height: 12),
              _Block(
                isDark: isDark,
                tint: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
                eyebrow: "I'M AN EMPLOYER",
                onLogin: () {
                  Navigator.pop(context);
                  onEmployer('login');
                },
                onRegister: () {
                  Navigator.pop(context);
                  onEmployer('register');
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _open(context, isDark),
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: Colors.white.withValues(alpha: 0.15),
            border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
          ),
          child: const Text(
            'Sign in',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
            ),
          ),
        ),
      ),
    );
  }
}

class _Block extends StatelessWidget {
  const _Block({
    required this.isDark,
    required this.tint,
    required this.eyebrow,
    required this.onLogin,
    required this.onRegister,
  });

  final bool isDark;
  final List<Color> tint;
  final String eyebrow;
  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShaderMask(
            shaderCallback: (b) => LinearGradient(colors: tint).createShader(b),
            child: Text(
              eyebrow,
              style: const TextStyle(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onLogin,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: BorderSide(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.2)
                          : const Color(0xFFE4E4E7),
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    foregroundColor: isDark ? Colors.white : const Color(0xFF09090B),
                  ),
                  child: const Text('Sign in', style: TextStyle(fontWeight: FontWeight.w600)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: onRegister,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    backgroundColor: tint.first,
                    foregroundColor: Colors.white,
                    elevation: 0,
                  ),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: tint),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: const Text('Register', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
