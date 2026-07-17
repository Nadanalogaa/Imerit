import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../store/auth_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/staff/credential_share_sheet.dart';
import '../widgets/theme_toggle.dart';

/// Super-admin lens on staff accounts. Only super-admin can mint new staff
/// (candidate/employer/admin routes can't reach this screen).
class SuperAdminStaffPage extends ConsumerStatefulWidget {
  const SuperAdminStaffPage({super.key});

  @override
  ConsumerState<SuperAdminStaffPage> createState() => _SuperAdminStaffPageState();
}

class _SuperAdminStaffPageState extends ConsumerState<SuperAdminStaffPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _mobile = TextEditingController();
  bool _showForm = false;
  String? _error;
  int _tick = 0;

  // Per-row reveal for the staff password. Keyed by user id so revealing
  // one row doesn't unmask every password on screen.
  final Set<String> _revealed = {};

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _mobile.dispose();
    super.dispose();
  }

  /// Bottom-sheet dialog that lets super-admin type a new password directly
  /// (instead of accepting the auto-generated one from Reset). Returns the
  /// typed password on Save, or null on Cancel.
  Future<String?> _promptChangePassword(User target) async {
    final ctrl = TextEditingController(text: target.sharedPassword ?? '');
    bool show = true;
    String? error;
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => StatefulBuilder(
        builder: (context, setLocal) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE4E4E7),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF10B981)]),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.key_rounded, size: 20, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Change password',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                          ),
                          Text(
                            'for ${target.name} · ${target.email}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF71717A)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'New password',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF3F3F46)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: ctrl,
                  obscureText: !show,
                  autofocus: true,
                  style: const TextStyle(fontSize: 14, fontFamily: 'monospace', color: Color(0xFF09090B)),
                  decoration: InputDecoration(
                    hintText: 'Type a memorable password',
                    hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFFA1A1AA)),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    suffixIcon: IconButton(
                      icon: Icon(show ? Icons.visibility_off_rounded : Icons.visibility_rounded, size: 18, color: const Color(0xFF71717A)),
                      onPressed: () => setLocal(() => show = !show),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Minimum 6 characters. This exact string becomes the sign-in password — no hashing, no email. Share it manually.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF71717A), height: 1.4),
                ),
                if (error != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Text(
                      error!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(sheetCtx),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: Color(0xFFE4E4E7)),
                          foregroundColor: const Color(0xFF52525B),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: const Text('Cancel', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final v = ctrl.text.trim();
                          if (v.length < 6) {
                            setLocal(() => error = 'Password must be at least 6 characters');
                            return;
                          }
                          Navigator.pop(sheetCtx, v);
                        },
                        icon: const Icon(Icons.check_rounded, size: 16),
                        label: const Text('Save password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 6,
                          shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
    ctrl.dispose();
    return result;
  }

  Future<void> _create() async {
    setState(() => _error = null);
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Enter a name');
      return;
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_email.text.trim())) {
      setState(() => _error = 'Enter a valid email');
      return;
    }
    try {
      final result = await ref.read(authProvider.notifier).createStaff(
            name: _name.text.trim(),
            email: _email.text.trim(),
            mobile: _mobile.text.trim().isEmpty ? null : _mobile.text.trim(),
          );
      HapticFeedback.mediumImpact();
      _name.clear();
      _email.clear();
      _mobile.clear();
      setState(() {
        _showForm = false;
        _tick++;
      });
      if (!mounted) return;
      await CredentialShareSheet.show(
        context,
        title: 'Staff invited',
        subtitle: '${result.user.name} can now sign in at /staff/login',
        email: result.user.email,
        password: result.password,
      );
    } on ApiError catch (e) {
      setState(() => _error = e.code == 'EMAIL_TAKEN'
          ? 'An account already exists for that email.'
          : (e.message.isNotEmpty ? e.message : 'Could not create staff account.'));
    } catch (_) {
      setState(() => _error = 'Could not create staff account.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authProvider);
    if (me == null || me.role != Role.superAdmin) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/super-admin'));
      return const SizedBox.shrink();
    }
    final users = ref.watch(authProvider.notifier).allUsers();
    final staff = users.where((u) => u.role == Role.staff).toList()
      ..sort((a, b) => a.name.compareTo(b.name));

    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Staff accounts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/super-admin/dashboard'),
        ),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      // Rebuild whenever create/deactivate flips `_tick`.
      body: KeyedSubtree(
        key: ValueKey(_tick),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'STAFF ACCOUNTS',
                          style: TextStyle(
                            fontSize: 11,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFEA580C),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${staff.length} staff · post jobs for employers',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: () => setState(() => _showForm = !_showForm),
                    icon: Icon(_showForm ? Icons.close_rounded : Icons.add_rounded, size: 14),
                    label: Text(_showForm ? 'Cancel' : 'Invite', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF97316),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                "Staff manage the Employer Master and post jobs. They can't reach admin or candidate surfaces. Sign-in is password-based until email is wired.",
                style: TextStyle(fontSize: 12, color: Color(0xFF52525B), height: 1.4),
              ),
              const SizedBox(height: 14),
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                child: _showForm
                    ? Container(
                        padding: const EdgeInsets.all(14),
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF97316).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.25)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            ItrTextField(label: 'Name', controller: _name, placeholder: 'Priya Ramesh', autofocus: true),
                            const SizedBox(height: 10),
                            ItrTextField(
                              label: 'Work email',
                              controller: _email,
                              placeholder: 'priya@rudraahr.com',
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 10),
                            ItrTextField(
                              label: 'Mobile (optional)',
                              controller: _mobile,
                              placeholder: '9876543210',
                              keyboardType: TextInputType.phone,
                              maxLength: 10,
                              formatters: [FilteringTextInputFormatter.digitsOnly],
                            ),
                            if (_error != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 10),
                                child: Text(
                                  _error!,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                                ),
                              ),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: _create,
                              icon: const Icon(Icons.key_rounded, size: 14),
                              label: const Text('Create + generate password', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFF97316),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
              if (staff.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFFE4E4E7)),
                  ),
                  child: const Center(
                    child: Column(
                      children: [
                        Icon(Icons.groups_outlined, size: 32, color: Color(0xFFA1A1AA)),
                        SizedBox(height: 8),
                        Text('No staff invited yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                        SizedBox(height: 2),
                        Text(
                          'Tap Invite to add the first one.',
                          style: TextStyle(fontSize: 11.5, color: Color(0xFF71717A)),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...staff.map((u) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: _StaffRow(
                        user: u,
                        revealed: _revealed.contains(u.id),
                        onToggleReveal: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            if (_revealed.contains(u.id)) {
                              _revealed.remove(u.id);
                            } else {
                              _revealed.add(u.id);
                            }
                          });
                        },
                        onCopy: () async {
                          if (u.sharedPassword == null) return;
                          await Clipboard.setData(ClipboardData(text: u.sharedPassword!));
                          HapticFeedback.lightImpact();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Password copied', style: TextStyle(fontSize: 12.5)),
                                backgroundColor: Color(0xFF10B981),
                                behavior: SnackBarBehavior.floating,
                                duration: Duration(milliseconds: 1400),
                              ),
                            );
                          }
                        },
                        onChange: () async {
                          final newPwd = await _promptChangePassword(u);
                          if (newPwd == null || !context.mounted) return;
                          try {
                            await ref.read(authProvider.notifier).setSharedPassword(u.id, newPwd);
                            HapticFeedback.mediumImpact();
                            setState(() => _tick++);
                            if (!context.mounted) return;
                            await CredentialShareSheet.show(
                              context,
                              title: 'Password updated',
                              subtitle: 'New credentials for ${u.name}',
                              email: u.email,
                              password: newPwd,
                            );
                          } catch (_) {
                            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Could not set password.')),
                            );
                          }
                        },
                        onToggle: (v) async {
                          try {
                            await ref.read(authProvider.notifier).setDeactivated(u.id, v);
                            setState(() => _tick++);
                          } catch (_) {
                            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Could not toggle account.')),
                            );
                          }
                        },
                        onReset: () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: Text('Reset password for ${u.name}?'),
                              content: const Text("The old password stops working immediately. Their live session (if any) is dropped."),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                                FilledButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
                                  child: const Text('Reset'),
                                ),
                              ],
                            ),
                          );
                          if (ok != true || !context.mounted) return;
                          try {
                            final password = await ref.read(authProvider.notifier).resetSharedPassword(u.id);
                            HapticFeedback.mediumImpact();
                            setState(() => _tick++);
                            if (!context.mounted) return;
                            await CredentialShareSheet.show(
                              context,
                              title: 'Password reset',
                              subtitle: 'New credentials for ${u.name}',
                              email: u.email,
                              password: password,
                            );
                          } catch (_) {
                            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Could not reset password.')),
                            );
                          }
                        },
                      ),
                    )),
            ],
          ),
        ),
      ),
    );
  }
}

class _StaffRow extends StatelessWidget {
  const _StaffRow({
    required this.user,
    required this.revealed,
    required this.onToggleReveal,
    required this.onCopy,
    required this.onChange,
    required this.onToggle,
    required this.onReset,
  });
  final User user;
  final bool revealed;
  final VoidCallback onToggleReveal;
  final VoidCallback onCopy;
  final VoidCallback onChange;
  final ValueChanged<bool> onToggle;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final hasPwd = user.sharedPassword != null;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF10B981)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join(),
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: Color(0xFF09090B))),
                    Text(user.email, style: const TextStyle(fontSize: 11.5, color: Color(0xFF52525B)), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: user.deactivated ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  user.deactivated ? 'DEACTIVATED' : 'ACTIVE',
                  style: TextStyle(
                    fontSize: 9,
                    letterSpacing: 1.2,
                    fontWeight: FontWeight.w800,
                    color: user.deactivated ? const Color(0xFFB91C1C) : const Color(0xFF047857),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Switch.adaptive(
                value: !user.deactivated,
                onChanged: (v) => onToggle(!v),
                activeThumbColor: const Color(0xFF10B981),
              ),
            ],
          ),
          if (hasPwd) ...[
            const SizedBox(height: 10),
            // Password chip — reveal/copy inline so super-admin can verify
            // + hand off without popping the share sheet every time.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE4E4E7)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.key_rounded, size: 12, color: Color(0xFF71717A)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      revealed ? user.sharedPassword! : '••••••••••',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF09090B),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: onToggleReveal,
                    icon: Icon(
                      revealed ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      size: 16,
                      color: const Color(0xFF71717A),
                    ),
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    tooltip: revealed ? 'Hide password' : 'Reveal password',
                  ),
                  IconButton(
                    onPressed: onCopy,
                    icon: const Icon(Icons.copy_rounded, size: 15, color: Color(0xFF71717A)),
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    tooltip: 'Copy password',
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: onChange,
                icon: const Icon(Icons.key_rounded, size: 12),
                label: const Text('Change', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  foregroundColor: const Color(0xFF0F766E),
                  side: const BorderSide(color: Color(0xFF14B8A6)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
              const SizedBox(width: 6),
              OutlinedButton.icon(
                onPressed: onReset,
                icon: const Icon(Icons.refresh_rounded, size: 12),
                label: const Text('Reset', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  foregroundColor: const Color(0xFFB45309),
                  side: const BorderSide(color: Color(0xFFFCD34D)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
