import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../widgets/itr_text_field.dart';
import '../widgets/staff/credential_share_sheet.dart';
import '../widgets/staff/staff_scaffold.dart';

/// Add / edit an employer in the master. When `employerId` is null, this
/// is the create flow: on submit, a fresh password is generated and the
/// CredentialShareSheet pops so staff can hand it off. When editing, the
/// email field is locked (it's the auth key) and password reset is a
/// separate action.
class StaffEmployerFormPage extends ConsumerStatefulWidget {
  const StaffEmployerFormPage({super.key, this.employerId});
  final String? employerId;

  @override
  ConsumerState<StaffEmployerFormPage> createState() => _StaffEmployerFormPageState();
}

class _StaffEmployerFormPageState extends ConsumerState<StaffEmployerFormPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _mobile = TextEditingController();
  final _company = TextEditingController();
  String? _error;
  User? _target;

  bool get _editing => widget.employerId != null;

  @override
  void initState() {
    super.initState();
    if (_editing) {
      // Prime fields from the target row. Runs post-frame so ref is safe.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final users = ref.read(authProvider.notifier).allUsers();
        final match = users.where((u) => u.id == widget.employerId).toList();
        if (match.isNotEmpty) {
          _target = match.first;
          _name.text = _target!.name;
          _email.text = _target!.email;
          _mobile.text = _target!.mobile ?? '';
          _company.text = _target!.company ?? '';
          setState(() {});
        }
      });
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _mobile.dispose();
    _company.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final me = ref.read(authProvider);
    if (me == null) return;
    setState(() => _error = null);
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Enter a contact name');
      return;
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(_email.text.trim())) {
      setState(() => _error = 'Enter a valid email');
      return;
    }

    if (_editing && _target != null) {
      ref.read(authProvider.notifier).updateEmployer(
            _target!.id,
            name: _name.text.trim(),
            mobile: _mobile.text.trim().isEmpty ? null : _mobile.text.trim(),
            company: _company.text.trim().isEmpty ? null : _company.text.trim(),
          );
      if (mounted) context.go('/staff/employers');
      return;
    }

    try {
      final result = ref.read(authProvider.notifier).createEmployerByStaff(
            staffId: me.id,
            name: _name.text.trim(),
            email: _email.text.trim(),
            mobile: _mobile.text.trim().isEmpty ? null : _mobile.text.trim(),
            company: _company.text.trim().isEmpty ? null : _company.text.trim(),
          );
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      await CredentialShareSheet.show(
        context,
        title: 'Employer created',
        subtitle: '${result.user.name} can now sign in via /employer/login',
        email: result.user.email,
        password: result.password,
      );
      if (mounted) context.go('/staff/employers');
    } on StateError catch (e) {
      if (e.message == 'EMAIL_TAKEN') {
        setState(() => _error = 'An account already exists for that email. Use edit instead.');
      } else {
        setState(() => _error = 'Could not create employer.');
      }
    }
  }

  Future<void> _resetPassword() async {
    if (_target == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Reset password for ${_target!.name}?'),
        content: const Text('The old password will stop working immediately.'),
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
    if (ok != true) return;
    final password = ref.read(authProvider.notifier).resetEmployerPassword(_target!.id);
    HapticFeedback.mediumImpact();
    if (!mounted) return;
    await CredentialShareSheet.show(
      context,
      title: 'Password reset',
      subtitle: 'New credentials for ${_target!.name}',
      email: _target!.email,
      password: password,
    );
  }

  @override
  Widget build(BuildContext context) {
    return StaffScaffold(
      title: _editing ? 'Edit employer' : 'Add employer',
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF14B8A6), Color(0xFF10B981)]),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 4)),
                    ],
                  ),
                  child: const Icon(Icons.business_center_rounded, size: 20, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _editing ? 'Edit employer' : 'Add employer to master',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _editing
                            ? 'Update contact info or reset the login password.'
                            : "A password will be generated on Submit — you'll see it once so you can share it.",
                        style: const TextStyle(fontSize: 11.5, color: Color(0xFF71717A), height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ItrTextField(label: 'Contact name', controller: _name, placeholder: 'Priya Ramesh', autofocus: !_editing),
            const SizedBox(height: 12),
            ItrTextField(label: 'Company', controller: _company, placeholder: 'Zoho Corporation'),
            const SizedBox(height: 12),
            // Email locked in edit mode — auth key.
            IgnorePointer(
              ignoring: _editing,
              child: Opacity(
                opacity: _editing ? 0.55 : 1,
                child: ItrTextField(
                  label: 'Work email',
                  controller: _email,
                  placeholder: 'priya@zoho.com',
                  keyboardType: TextInputType.emailAddress,
                  hint: _editing ? 'Email is the auth key — reset the password instead of changing the address.' : null,
                ),
              ),
            ),
            const SizedBox(height: 12),
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
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            const SizedBox(height: 22),
            if (_editing && _target?.sharedPassword != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: OutlinedButton.icon(
                  onPressed: _resetPassword,
                  icon: const Icon(Icons.refresh_rounded, size: 14),
                  label: const Text('Reset password', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFB45309),
                    side: const BorderSide(color: Color(0xFFF59E0B)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
            ElevatedButton.icon(
              onPressed: _submit,
              icon: Icon(_editing ? Icons.save_rounded : Icons.key_rounded, size: 16),
              label: Text(
                _editing ? 'Save changes' : 'Create + generate password',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 6,
                shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
              ),
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: () => context.go('/staff/employers'),
              child: const Text('Cancel', style: TextStyle(fontSize: 12.5)),
            ),
          ],
        ),
      ),
    );
  }
}
