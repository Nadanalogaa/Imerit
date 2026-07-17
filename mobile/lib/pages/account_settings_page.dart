import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../store/auth_provider.dart';
import '../widgets/inline_set_password.dart';

/// Signed-in user's account settings — password management + basic
/// identity summary. Same pattern as web's /settings/account.
///
/// Renders one of two forms based on user.hasPassword:
///   - has one → change-password form (old + new)
///   - has none → embedded InlineSetPassword widget (set for first time)
class AccountSettingsPage extends ConsumerWidget {
  const AccountSettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider);
    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/'));
      return const SizedBox.shrink();
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Account settings'),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Identity summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).dividerColor),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(user.email, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                  const SizedBox(height: 12),
                  _Field(label: 'ROLE', value: user.role.name.replaceAll('superAdmin', 'super admin')),
                  if (user.mobile != null) _Field(label: 'MOBILE', value: user.mobile!),
                  _Field(label: 'MEMBER SINCE', value: DateTime.tryParse(user.createdAt)?.toLocal().toString().split(' ')[0] ?? user.createdAt),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Password section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).dividerColor),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF97316).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.vpn_key, color: Color(0xFFF97316), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Password', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                            Text(
                              user.hasPassword
                                  ? 'Change your password. OTP sign-in still works too.'
                                  : "Set a password so you can sign in without waiting for an OTP email.",
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (user.hasPassword)
                    const _ChangePasswordForm()
                  else
                    InlineSetPassword(
                      onDone: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Password saved.')),
                        );
                      },
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Row(
          children: [
            SizedBox(
              width: 120,
              child: Text(label,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: Colors.grey[600])),
            ),
            Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
          ],
        ),
      );
}

class _ChangePasswordForm extends ConsumerStatefulWidget {
  const _ChangePasswordForm();
  @override
  ConsumerState<_ChangePasswordForm> createState() => _ChangePasswordFormState();
}

class _ChangePasswordFormState extends ConsumerState<_ChangePasswordForm> {
  final _old = TextEditingController();
  final _newPwd = TextEditingController();
  final _confirm = TextEditingController();
  bool _show = false;
  bool _submitting = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _old.dispose();
    _newPwd.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _error = null; _success = null; });
    if (_old.text.isEmpty) return setState(() => _error = 'Enter your current password.');
    if (_newPwd.text.length < 8) return setState(() => _error = 'New password must be at least 8 characters.');
    if (_newPwd.text == _old.text) return setState(() => _error = 'New password must be different from the current one.');
    if (_newPwd.text != _confirm.text) return setState(() => _error = "New passwords don't match.");
    setState(() => _submitting = true);
    try {
      await AuthApi.instance.changePassword(_old.text, _newPwd.text);
      HapticFeedback.mediumImpact();
      _old.clear(); _newPwd.clear(); _confirm.clear();
      setState(() => _success = 'Password changed. Use the new one next time you sign in.');
    } on ApiError catch (e) {
      setState(() => _error = switch (e.code) {
            'OLD_PASSWORD_INVALID' => 'Current password is incorrect.',
            'PASSWORD_TOO_SHORT' => 'New password must be at least 8 characters.',
            'PASSWORD_UNCHANGED' => 'New password must be different.',
            _ => 'Could not change the password. Try again.',
          });
    } catch (_) {
      setState(() => _error = 'Could not change the password.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      _pwdField('Current password', _old),
      const SizedBox(height: 10),
      _pwdField('New password', _newPwd, hint: 'At least 8 characters'),
      const SizedBox(height: 10),
      _pwdField('Confirm new password', _confirm),
      const SizedBox(height: 8),
      Row(children: [
        Checkbox(value: _show, onChanged: (v) => setState(() => _show = v ?? false)),
        const Text('Show passwords', style: TextStyle(fontSize: 12)),
      ]),
      if (_error != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12))),
      if (_success != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_success!, style: const TextStyle(color: Color(0xFF059669), fontSize: 12))),
      const SizedBox(height: 12),
      ElevatedButton(
        onPressed: _submitting ? null : _submit,
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12),
          backgroundColor: const Color(0xFFF97316),
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(_submitting ? 'Updating...' : 'Update password'),
      ),
    ]);
  }

  Widget _pwdField(String label, TextEditingController c, {String? hint}) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
          TextField(
            controller: c,
            obscureText: !_show,
            decoration: InputDecoration(
              hintText: hint,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5)),
            ),
          ),
        ],
      );
}
