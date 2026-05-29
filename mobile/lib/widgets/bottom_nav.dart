import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../store/theme_provider.dart';

class AppBottomNav extends ConsumerWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A0A0B) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              _Item(
                isActive: currentIndex == 0,
                icon: Icons.home_outlined,
                activeIcon: Icons.home_rounded,
                label: 'Home',
                isDark: isDark,
                onTap: () => onTap(0),
              ),
              _Item(
                isActive: currentIndex == 1,
                icon: Icons.work_outline,
                activeIcon: Icons.work_rounded,
                label: 'Jobs',
                isDark: isDark,
                onTap: () => onTap(1),
              ),
              _Item(
                isActive: currentIndex == 2,
                icon: Icons.person_add_alt_outlined,
                activeIcon: Icons.person_add_alt_1_rounded,
                label: 'Apply',
                isDark: isDark,
                onTap: () => onTap(2),
              ),
              _Item(
                isActive: currentIndex == 3,
                icon: Icons.person_outline,
                activeIcon: Icons.person_rounded,
                label: 'Profile',
                isDark: isDark,
                onTap: () => onTap(3),
              ),
              _Item(
                isActive: currentIndex == 4,
                icon: Icons.menu_outlined,
                activeIcon: Icons.menu_rounded,
                label: 'More',
                isDark: isDark,
                onTap: () => onTap(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  const _Item({
    required this.isActive,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isDark,
    required this.onTap,
  });

  final bool isActive;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final activeColor = const Color(0xFFF97316);
    final inactive = isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A);
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isActive ? activeIcon : icon, size: 22, color: isActive ? activeColor : inactive),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                color: isActive ? activeColor : inactive,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
