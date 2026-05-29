import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/theme_provider.dart';

String _initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
}

class UserAvatarMenu extends ConsumerWidget {
  const UserAvatarMenu({super.key, required this.user});
  final User user;

  void _open(BuildContext context, bool isDark, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _Sheet(user: user, isDark: isDark, ref: ref),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _open(context, isDark, ref),
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.fromLTRB(4, 4, 12, 4),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            color: Colors.white.withValues(alpha: 0.18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.7, end: 1),
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOutBack,
                builder: (_, scale, child) => Transform.scale(scale: scale, child: child),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF97316), Color(0xFFC2410C)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFF97316).withValues(alpha: 0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      _initials(user.name),
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                user.name.split(' ').first,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  shadows: [Shadow(color: Colors.black54, blurRadius: 6)],
                ),
              ),
              const SizedBox(width: 4),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                color: Colors.white,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Sheet extends StatelessWidget {
  const _Sheet({required this.user, required this.isDark, required this.ref});
  final User user;
  final bool isDark;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      builder: (_, t, child) => Transform.translate(
        offset: Offset(0, (1 - t) * 30),
        child: Opacity(opacity: t, child: child),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF18181B) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(0, 12, 0, 16),
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
                const SizedBox(height: 18),

                // Profile header
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFFF97316).withValues(alpha: 0.10),
                              const Color(0xFFFCD34D).withValues(alpha: 0.05),
                            ]
                          : [
                              const Color(0xFFFFF7ED),
                              const Color(0xFFFEFCE8),
                            ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF97316), Color(0xFFC2410C)],
                          ),
                        ),
                        child: Center(
                          child: Text(
                            _initials(user.name),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : const Color(0xFF09090B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              user.email,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11.5,
                                color: isDark
                                    ? Colors.white.withValues(alpha: 0.6)
                                    : const Color(0xFF52525B),
                              ),
                            ),
                            if (user.emailVerified) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Icon(Icons.verified_rounded, size: 10, color: Color(0xFF059669)),
                                    SizedBox(width: 4),
                                    Text(
                                      'Verified',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF059669),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),
                _Row(
                  isDark: isDark,
                  icon: Icons.dashboard_rounded,
                  label: 'Dashboard',
                  onTap: () {
                    Navigator.pop(context);
                    context.go('/candidate/dashboard');
                  },
                ),
                _Row(
                  isDark: isDark,
                  icon: Icons.person_rounded,
                  label: 'My profile',
                  soon: true,
                ),
                _Row(
                  isDark: isDark,
                  icon: Icons.settings_rounded,
                  label: 'Settings',
                  soon: true,
                ),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  height: 1,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : const Color(0xFFE4E4E7),
                ),
                _Row(
                  isDark: isDark,
                  icon: Icons.logout_rounded,
                  label: 'Sign out',
                  danger: true,
                  onTap: () {
                    Navigator.pop(context);
                    ref.read(authProvider.notifier).logout();
                    context.go('/');
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({
    required this.isDark,
    required this.icon,
    required this.label,
    this.onTap,
    this.danger = false,
    this.soon = false,
  });

  final bool isDark;
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool danger;
  final bool soon;

  @override
  Widget build(BuildContext context) {
    final color = danger
        ? const Color(0xFFE11D48)
        : (isDark ? Colors.white : const Color(0xFF18181B));
    return InkWell(
      onTap: soon ? null : onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color.withValues(alpha: soon ? 0.4 : 1)),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: color.withValues(alpha: soon ? 0.4 : 1),
                ),
              ),
            ),
            if (soon)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  'SOON',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.55)
                        : const Color(0xFF71717A),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
