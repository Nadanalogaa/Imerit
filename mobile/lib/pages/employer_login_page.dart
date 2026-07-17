import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../store/auth_provider.dart';
import '../store/theme_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

/// Employer sign-in has two modes now:
///
///  * **OTP** (default) — self-registered employers who verified their
///    email.
///  * **Password** — employers provisioned by staff via the Employer
///    Master. Staff hand over creds manually until email is wired.
class EmployerLoginPage extends ConsumerStatefulWidget {
  const EmployerLoginPage({super.key});

  @override
  ConsumerState<EmployerLoginPage> createState() => _EmployerLoginPageState();
}

enum _Mode { otp, password }

class _EmployerLoginPageState extends ConsumerState<EmployerLoginPage> {
  _Mode _mode = _Mode.otp;
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPwd = false;
  String? _err;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    setState(() => _err = null);
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _err = 'Enter a valid email');
      return;
    }
    if (_mode == _Mode.password) {
      if (_password.text.length < 6) {
        setState(() => _err = 'Password looks incomplete');
        return;
      }
      try {
        final user = await ref
            .read(authProvider.notifier)
            .passwordLogin(email, _password.text);
        if (user.role != Role.employer) {
          setState(() => _err = "That account isn't an employer.");
          return;
        }
        if (mounted) context.go('/employer/dashboard');
      } on ApiError catch (e) {
        setState(() => _err = e.code == 'ACCOUNT_DEACTIVATED'
            ? 'This employer account is deactivated. Contact your recruiter.'
            : "That email + password combo didn't match. If your recruiter didn't share a password, use email OTP instead.");
      } catch (_) {
        setState(() => _err = 'Sign in failed — try again.');
      }
      return;
    }
    // OTP mode
    final user = ref.read(authProvider.notifier).findByEmail(email);
    if (user == null || user.role != Role.employer) {
      setState(() => _err = 'No employer account found with this email');
      return;
    }
    OtpService.generate(email);
    context.go('/employer/verify?email=${Uri.encodeQueryComponent(email)}&mode=login');
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Welcome back',
      subtitle: _mode == _Mode.otp
          ? 'Sign in to your employer account with a one-time email code.'
          : 'Sign in with the credentials your recruiter shared.',
      bgImage: 'assets/images/background-02.jpg',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _ModeToggle(mode: _mode, onChange: (m) => setState(() { _mode = m; _err = null; })),
          const SizedBox(height: 14),
          ItrTextField(
            label: 'Work email',
            controller: _email,
            placeholder: 'you@company.com',
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
            error: _mode == _Mode.otp ? _err : null,
          ),
          if (_mode == _Mode.password) ...[
            const SizedBox(height: 12),
            _PasswordField(
              controller: _password,
              show: _showPwd,
              onToggle: () => setState(() => _showPwd = !_showPwd),
              error: _err,
            ),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: const Color(0xFF0EA5E9),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 6,
              shadowColor: const Color(0xFF0EA5E9).withValues(alpha: 0.4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  _mode == _Mode.otp ? 'Send Email OTP' : 'Sign in',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.arrow_forward, size: 16),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Center(
            child: Wrap(
              alignment: WrapAlignment.center,
              children: [
                const Text('New to i-Tamil Recruit? ', style: TextStyle(fontSize: 12)),
                GestureDetector(
                  onTap: () => context.go('/employer/register'),
                  child: const Text('Create an account', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0369A1))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeToggle extends StatelessWidget {
  const _ModeToggle({required this.mode, required this.onChange});
  final _Mode mode;
  final ValueChanged<_Mode> onChange;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          _pill(context, _Mode.otp, 'Email OTP', Icons.mail_rounded),
          _pill(context, _Mode.password, 'Password', Icons.key_rounded),
        ],
      ),
    );
  }

  Widget _pill(BuildContext context, _Mode m, String label, IconData icon) {
    final selected = m == mode;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChange(m),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF0EA5E9) : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
            boxShadow: selected
                ? [BoxShadow(color: const Color(0xFF0EA5E9).withValues(alpha: 0.30), blurRadius: 6, offset: const Offset(0, 3))]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 12, color: selected ? Colors.white : const Color(0xFF71717A)),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: selected ? Colors.white : const Color(0xFF52525B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Theme-aware password field with show/hide toggle. Mirrors
/// [ItrTextField] chrome so text is readable in both light + dark.
/// Previously hardcoded a white fill + default text color, which
/// rendered typed characters invisible on dark surfaces.
class _PasswordField extends ConsumerWidget {
  const _PasswordField({
    required this.controller,
    required this.show,
    required this.onToggle,
    this.error,
  });
  final TextEditingController controller;
  final bool show;
  final VoidCallback onToggle;
  final String? error;

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
            hintText: 'Ask your recruiter for the credentials',
            hintStyle: TextStyle(fontSize: 12.5, color: hintColor),
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
              borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
            ),
          ),
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444))),
          ),
      ],
    );
  }
}
