import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';
import '../store/auth_provider.dart';

const _key = 'itr.welcomeDismissed';

class WelcomeBanner extends ConsumerStatefulWidget {
  const WelcomeBanner({
    super.key,
    required this.onCandidate,
    required this.onEmployer,
  });

  final void Function(String action) onCandidate;
  final void Function(String action) onEmployer;

  @override
  ConsumerState<WelcomeBanner> createState() => _WelcomeBannerState();
}

class _WelcomeBannerState extends ConsumerState<WelcomeBanner>
    with SingleTickerProviderStateMixin {
  bool _hidden = true;

  @override
  void initState() {
    super.initState();
    _hidden = Storage.instance.getString(_key) == 'true';
  }

  void _dismiss() {
    Storage.instance.setString(_key, 'true');
    setState(() => _hidden = true);
  }

  @override
  Widget build(BuildContext context) {
    final loggedIn = ref.watch(authProvider) != null;
    final shouldHide = _hidden || loggedIn;
    return AnimatedSize(
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOut,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: SizeTransition(sizeFactor: anim, child: child),
        ),
        child: shouldHide ? const SizedBox.shrink() : _buildBanner(),
      ),
    );
  }

  Widget _buildBanner() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEA580C), Color(0xFFF97316), Color(0xFF0EA5E9)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('👋', style: TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'New here? Tell us who you are',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              InkWell(
                onTap: _dismiss,
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  child: const Icon(Icons.close_rounded, color: Colors.white70, size: 18),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _RoleRow(
            icon: Icons.person_outline,
            label: 'Looking for a job?',
            onSignIn: () => widget.onCandidate('login'),
            onRegister: () => widget.onCandidate('register'),
            primaryTextColor: const Color(0xFFC2410C),
          ),
          const SizedBox(height: 8),
          _RoleRow(
            icon: Icons.business_center_outlined,
            label: 'Looking for talent?',
            onSignIn: () => widget.onEmployer('login'),
            onRegister: () => widget.onEmployer('register'),
            primaryTextColor: const Color(0xFF0369A1),
          ),
        ],
      ),
    );
  }
}

class _RoleRow extends StatelessWidget {
  const _RoleRow({
    required this.icon,
    required this.label,
    required this.onSignIn,
    required this.onRegister,
    required this.primaryTextColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onSignIn;
  final VoidCallback onRegister;
  final Color primaryTextColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.20)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white.withValues(alpha: 0.95), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          _PillBtn(
            label: 'Sign in',
            outlined: true,
            onTap: onSignIn,
            textColor: Colors.white,
          ),
          const SizedBox(width: 6),
          _PillBtn(
            label: 'Register',
            outlined: false,
            onTap: onRegister,
            textColor: primaryTextColor,
          ),
        ],
      ),
    );
  }
}

class _PillBtn extends StatelessWidget {
  const _PillBtn({
    required this.label,
    required this.outlined,
    required this.onTap,
    required this.textColor,
  });

  final String label;
  final bool outlined;
  final VoidCallback onTap;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: outlined ? Colors.transparent : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: outlined
                ? Border.all(color: Colors.white.withValues(alpha: 0.5))
                : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}
