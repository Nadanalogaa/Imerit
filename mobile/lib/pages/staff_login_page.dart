import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../store/auth_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

/// Password-based staff login. Mirrors the web `/staff/login` — no OTP,
/// because staff is an internal role bootstrapped by super-admin and the
/// auth flow needs to work before email is wired.
class StaffLoginPage extends ConsumerStatefulWidget {
  const StaffLoginPage({super.key});

  @override
  ConsumerState<StaffLoginPage> createState() => _StaffLoginPageState();
}

class _StaffLoginPageState extends ConsumerState<StaffLoginPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _show = false;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    final pwd = _password.text;
    setState(() => _error = null);
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _error = 'Enter a valid email');
      return;
    }
    if (pwd.length < 6) {
      setState(() => _error = 'Password looks incomplete');
      return;
    }
    setState(() => _submitting = true);
    try {
      final user = await ref.read(authProvider.notifier).passwordLogin(email, pwd);
      if (user.role != Role.staff) {
        setState(() => _error = "That account isn't a staff account. Use the correct login for your role.");
        return;
      }
      if (mounted) context.go('/staff/dashboard');
    } on ApiError catch (e) {
      setState(() => _error = e.code == 'ACCOUNT_DEACTIVATED'
          ? 'This staff account is deactivated. Ask a super-admin to reactivate it.'
          : 'Incorrect email or password.');
    } catch (_) {
      setState(() => _error = 'Sign in failed — try again in a moment.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Staff sign in',
      subtitle: 'Sign in with the credentials your super-admin shared with you.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(
            label: 'Staff email',
            controller: _email,
            placeholder: 'you@company.com',
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
          ),
          const SizedBox(height: 14),
          _PasswordField(controller: _password, show: _show, onToggle: () => setState(() => _show = !_show)),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 14, color: Color(0xFFB91C1C)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: const Icon(Icons.key_rounded, size: 16),
            label: Text(
              _submitting ? 'Signing in…' : 'Sign in',
              style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
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
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFAFA),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE4E4E7)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFF71717A)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Staff accounts are provisioned by the super-admin. Ask them to invite you.',
                    style: TextStyle(fontSize: 11, color: Color(0xFF52525B), height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Center(
            child: TextButton(
              onPressed: () => context.go('/'),
              child: const Text(
                '← Back to home',
                style: TextStyle(fontSize: 12, color: Color(0xFF71717A)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Theme-aware password field with a show/hide toggle. Mirrors the
/// [ItrTextField] chrome so the auth screens read as one system in
/// either light or dark mode. Previously the text color + fill were
/// hardcoded (light-only), which made typed characters invisible on
/// dark surfaces / high-contrast device settings.
class _PasswordField extends ConsumerWidget {
  const _PasswordField({
    required this.controller,
    required this.show,
    required this.onToggle,
  });

  final TextEditingController controller;
  final bool show;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final borderColor = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : const Color(0xFFE4E4E7);
    final textColor = isDark ? Colors.white : const Color(0xFF09090B);
    final fillColor = isDark ? const Color(0xFF09090B) : Colors.white;
    final hintColor = isDark
        ? Colors.white.withValues(alpha: 0.35)
        : const Color(0xFFA1A1AA);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Password',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46),
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: !show,
          style: TextStyle(fontSize: 14, color: textColor),
          decoration: InputDecoration(
            hintText: '••••••••',
            hintStyle: TextStyle(color: hintColor),
            filled: true,
            fillColor: fillColor,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(
                show ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                size: 18,
                color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF71717A),
              ),
              onPressed: onToggle,
              tooltip: show ? 'Hide password' : 'Show password',
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
