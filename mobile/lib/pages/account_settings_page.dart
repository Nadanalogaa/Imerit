import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../api/profile_api.dart';
import '../store/auth_provider.dart';
import '../widgets/inline_set_password.dart';

/// Signed-in user's account settings — identity summary (name, mobile,
/// email, role) + password management. Same pattern as web's
/// /settings/account.
///
/// Employer accounts additionally see a read-only Company row sourced
/// from `EmployerProfile.companyName`. The row is intentionally locked
/// because as of 2026-08 only Super Admin can change an employer's
/// company name — backend `PATCH /employer/profile` silently drops the
/// field for everyone else.
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
            // Identity summary — read-only by default, flips to an
            // inline edit form for name / mobile / email / role when
            // the pencil icon is tapped. Mirrors web's
            // AccountIdentitySection.
            const _AccountIdentitySection(),
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
  const _Field({required this.label, required this.value, this.locked = false, this.lockHint});
  final String label;
  final String value;
  final bool locked;
  final String? lockHint;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                SizedBox(
                  width: 120,
                  child: Text(label,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.5, color: Colors.grey[600])),
                ),
                Expanded(
                  child: Row(
                    children: [
                      if (locked) ...[
                        const Icon(Icons.lock_rounded, size: 12, color: Color(0xFF71717A)),
                        const SizedBox(width: 6),
                      ],
                      Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
                    ],
                  ),
                ),
              ],
            ),
            if (locked && lockHint != null)
              Padding(
                padding: const EdgeInsets.only(top: 4, left: 120),
                child: Text(
                  lockHint!,
                  style: TextStyle(fontSize: 11, color: Colors.grey[600], fontStyle: FontStyle.italic),
                ),
              ),
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

/// "Account" card — read-only view by default, flips to an inline edit
/// form when the pencil icon in the header is tapped. As of 2026-08 the
/// visitor can also self-update `email` (email format validated, backend
/// returns 409 EMAIL_TAKEN / 400 INVALID_EMAIL on conflict) and `role`
/// (constrained to CANDIDATE / EMPLOYER; privileged tiers hide the
/// dropdown). Employer accounts additionally see a locked Company row
/// sourced from EmployerProfile.companyName — only Super Admin can
/// change that value now, matching the web behaviour.
class _AccountIdentitySection extends ConsumerStatefulWidget {
  const _AccountIdentitySection();
  @override
  ConsumerState<_AccountIdentitySection> createState() => _AccountIdentitySectionState();
}

class _AccountIdentitySectionState extends ConsumerState<_AccountIdentitySection> {
  bool _editing = false;
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();
  String _role = 'CANDIDATE';
  bool _saving = false;
  String? _error;
  String? _success;
  String? _companyName; // sourced from /employer/profile for employers
  bool _companyLoading = false;

  static const _companyLockHint = 'Only Super Admin can change your company name. Contact your account manager to update it.';

  @override
  void initState() {
    super.initState();
    // Kick off the employer-profile fetch after the first frame so
    // `ref` is safe to read.
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeFetchCompany());
  }

  Future<void> _maybeFetchCompany() async {
    final user = ref.read(authProvider);
    if (user == null || user.role != Role.employer || !apiEnabled) return;
    setState(() => _companyLoading = true);
    try {
      final profile = await ProfileApi.instance.getMyEmployerProfile();
      if (!mounted) return;
      setState(() => _companyName = (profile['companyName'] as String?)?.trim());
    } catch (_) {
      // Non-fatal — fall back to the cached `user.company` (which
      // staff-provisioned rows carry). Leaving _companyName null means
      // the row uses the fallback path in build().
    } finally {
      if (mounted) setState(() => _companyLoading = false);
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _email.dispose();
    super.dispose();
  }

  void _startEdit(User user) {
    _name.text = user.name;
    _mobile.text = user.mobile ?? '';
    _email.text = user.email;
    // The role dropdown only offers CANDIDATE / EMPLOYER — mirror the
    // current role into that shape (privileged roles keep the pill and
    // never see the dropdown).
    _role = user.role == Role.employer ? 'EMPLOYER' : 'CANDIDATE';
    setState(() {
      _error = null;
      _success = null;
      _editing = true;
    });
  }

  void _cancel() {
    setState(() {
      _editing = false;
      _error = null;
    });
  }

  bool _isPrivileged(Role r) =>
      r == Role.admin || r == Role.superAdmin || r == Role.staff;

  Future<void> _save() async {
    setState(() { _error = null; _success = null; });
    final user = ref.read(authProvider);
    if (user == null) return;
    final trimmedName = _name.text.trim();
    final trimmedEmail = _email.text.trim();
    if (trimmedName.length < 2) {
      setState(() => _error = 'Name must be at least 2 characters.');
      return;
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(trimmedEmail)) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    setState(() => _saving = true);
    try {
      // Only send `role` when it's actually a public role AND we're
      // showing the dropdown — privileged accounts leave role alone.
      final sendRole = !_isPrivileged(user.role) ? _role : null;
      await AuthApi.instance.updateMe(
        name: trimmedName,
        mobile: _mobile.text.trim(),
        email: trimmedEmail == user.email ? null : trimmedEmail,
        role: sendRole == null || sendRole == _apiRoleFor(user.role) ? null : sendRole,
      );
      // Pull the fresh user row back through the provider so any widget
      // bound to `authProvider` re-renders with the new values.
      await ref.read(authProvider.notifier).refreshFromServer();
      HapticFeedback.mediumImpact();
      if (!mounted) return;
      setState(() { _success = 'Saved.'; _editing = false; });
    } on ApiError catch (e) {
      setState(() => _error = switch (e.code) {
            'MOBILE_TOO_SHORT' => 'Mobile number looks too short.',
            'NAME_TOO_SHORT' => 'Name must be at least 2 characters.',
            'NAME_TOO_LONG' => 'Name is too long.',
            'INVALID_EMAIL' => 'Enter a valid email.',
            'EMAIL_TAKEN' => 'Another account already uses that email.',
            'ROLE_FORBIDDEN' => "That role change isn't allowed.",
            _ => 'Could not save. Try again.',
          });
    } catch (_) {
      setState(() => _error = 'Could not save. Try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  /// Uppercase wire value for a Role — used to compare against `_role`
  /// so we don't send a no-op role change.
  String _apiRoleFor(Role r) {
    switch (r) {
      case Role.employer:
        return 'EMPLOYER';
      case Role.candidate:
        return 'CANDIDATE';
      case Role.admin:
        return 'ADMIN';
      case Role.superAdmin:
        return 'SUPER_ADMIN';
      case Role.staff:
        return 'STAFF';
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider);
    if (user == null) return const SizedBox.shrink();
    final isEmployer = user.role == Role.employer;
    // Prefer the freshly-fetched EmployerProfile.companyName; fall
    // back to the cached user.company for offline / not-yet-loaded.
    final resolvedCompany = _companyName?.isNotEmpty == true
        ? _companyName
        : (user.company?.isNotEmpty == true ? user.company : null);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).dividerColor),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(user.email, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                  ],
                ),
              ),
              if (!_editing)
                IconButton(
                  tooltip: 'Edit contact details',
                  onPressed: () => _startEdit(user),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_editing) ...[
            _EditField(label: 'Name', controller: _name, hint: 'Your full name'),
            const SizedBox(height: 10),
            _EditField(label: 'Mobile', controller: _mobile, hint: '9876543210', keyboardType: TextInputType.phone),
            const SizedBox(height: 10),
            _EditField(label: 'Email', controller: _email, hint: 'you@example.com', keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 10),
            // Role dropdown — only CANDIDATE / EMPLOYER, per backend.
            // Privileged accounts (admin / super_admin / staff) keep
            // their role read-only.
            if (!_isPrivileged(user.role))
              _RoleDropdown(
                value: _role,
                onChanged: (v) => setState(() => _role = v ?? _role),
              )
            else
              _Field(label: 'ROLE', value: user.role.name.replaceAll('superAdmin', 'super admin')),
            if (isEmployer) ...[
              const SizedBox(height: 10),
              _Field(
                label: 'COMPANY',
                value: _companyLoading && resolvedCompany == null ? 'Loading…' : (resolvedCompany ?? '—'),
                locked: true,
                lockHint: _companyLockHint,
              ),
            ],
            if (_error != null)
              Padding(padding: const EdgeInsets.only(top: 6), child: Text(_error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12))),
            const SizedBox(height: 12),
            Row(children: [
              ElevatedButton(
                onPressed: _saving ? null : _save,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_saving ? 'Saving…' : 'Save changes'),
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                onPressed: _saving ? null : _cancel,
                icon: const Icon(Icons.close_rounded, size: 14),
                label: const Text('Cancel'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ]),
          ] else ...[
            _Field(label: 'ROLE', value: user.role.name.replaceAll('superAdmin', 'super admin')),
            if (user.mobile != null) _Field(label: 'MOBILE', value: user.mobile!),
            if (isEmployer)
              _Field(
                label: 'COMPANY',
                value: _companyLoading && resolvedCompany == null ? 'Loading…' : (resolvedCompany ?? '—'),
                locked: true,
                lockHint: _companyLockHint,
              ),
            _Field(label: 'MEMBER SINCE', value: DateTime.tryParse(user.createdAt)?.toLocal().toString().split(' ')[0] ?? user.createdAt),
            if (_success != null)
              Padding(padding: const EdgeInsets.only(top: 8), child: Text(_success!, style: const TextStyle(color: Color(0xFF059669), fontSize: 12))),
          ],
        ],
      ),
    );
  }
}

class _EditField extends StatelessWidget {
  const _EditField({required this.label, required this.controller, this.hint, this.keyboardType});
  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.only(bottom: 4), child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
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
}

/// Role dropdown for the account edit form. Only exposes the two public
/// roles the backend allows a self-service PATCH to select — CANDIDATE
/// and EMPLOYER — because staff / admin / super-admin can only be
/// created by a privileged actor.
class _RoleDropdown extends StatelessWidget {
  const _RoleDropdown({required this.value, required this.onChanged});
  final String value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(padding: EdgeInsets.only(bottom: 4), child: Text('Role', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500))),
        DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5)),
          ),
          items: const [
            DropdownMenuItem(value: 'CANDIDATE', child: Text('Candidate')),
            DropdownMenuItem(value: 'EMPLOYER', child: Text('Employer')),
          ],
          onChanged: onChanged,
        ),
      ],
    );
  }
}
