import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../store/auth_provider.dart';
import '../theme_toggle.dart';

/// Shared chrome for every /staff/* page. AppBar with the teal brand tone,
/// endDrawer with the four nav destinations + sign-out. Keeps the page
/// bodies focused on their actual content.
class StaffScaffold extends ConsumerWidget {
  const StaffScaffold({
    super.key,
    required this.title,
    required this.body,
    this.action,
  });

  final String title;
  final Widget body;

  /// Optional right-aligned action inside the AppBar (before the theme
  /// toggle) — e.g. a "+ Add" button on list pages.
  final Widget? action;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(authProvider);
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0.6,
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              margin: const EdgeInsets.only(left: 12),
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF10B981)]),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withValues(alpha: 0.35),
                    blurRadius: 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(Icons.groups_rounded, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                ),
                Text(
                  'Staff console',
                  style: TextStyle(fontSize: 10.5, color: Colors.black.withValues(alpha: 0.55)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          if (action != null) Padding(padding: const EdgeInsets.only(right: 4), child: action!),
          const ThemeToggle(),
          const SizedBox(width: 4),
        ],
      ),
      endDrawer: _StaffDrawer(me: me),
      body: body,
    );
  }
}

class _StaffDrawer extends ConsumerWidget {
  const _StaffDrawer({required this.me});
  final User? me;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF10B981)]),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.groups_rounded, size: 22, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          me?.name ?? 'Staff',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          me?.email ?? '',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFF4F4F5)),
            _DrawerLink(icon: Icons.dashboard_rounded, label: 'Dashboard', to: '/staff/dashboard'),
            _DrawerLink(icon: Icons.business_center_rounded, label: 'Employer Master', to: '/staff/employers'),
            _DrawerLink(icon: Icons.post_add_rounded, label: 'Post a job', to: '/staff/jobs/new'),
            _DrawerLink(icon: Icons.work_history_rounded, label: 'My jobs', to: '/staff/jobs'),
            const Spacer(),
            const Divider(height: 1, color: Color(0xFFF4F4F5)),
            ListTile(
              leading: const Icon(Icons.logout_rounded, size: 20, color: Color(0xFFE11D48)),
              title: const Text(
                'Sign out',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFE11D48)),
              ),
              onTap: () {
                ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/staff/login');
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerLink extends StatelessWidget {
  const _DrawerLink({required this.icon, required this.label, required this.to});
  final IconData icon;
  final String label;
  final String to;

  @override
  Widget build(BuildContext context) {
    final active = GoRouterState.of(context).uri.path == to;
    return ListTile(
      leading: Icon(
        icon,
        size: 20,
        color: active ? const Color(0xFF10B981) : const Color(0xFF52525B),
      ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: active ? const Color(0xFF10B981) : const Color(0xFF18181B),
        ),
      ),
      selected: active,
      selectedTileColor: const Color(0xFF10B981).withValues(alpha: 0.08),
      onTap: () {
        Navigator.of(context).pop();
        if (!active) context.go(to);
      },
    );
  }
}
