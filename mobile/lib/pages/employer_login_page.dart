import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

class EmployerLoginPage extends ConsumerStatefulWidget {
  const EmployerLoginPage({super.key});
  @override
  ConsumerState<EmployerLoginPage> createState() => _EmployerLoginPageState();
}

class _EmployerLoginPageState extends ConsumerState<EmployerLoginPage> {
  final _email = TextEditingController();
  String? _err;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _err = 'Enter a valid email');
      return;
    }
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
      subtitle: 'Sign in to your employer account with a one-time email code.',
      bgImage: 'assets/images/background-02.jpg',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(
            label: 'Work email',
            controller: _email,
            placeholder: 'you@company.com',
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
            error: _err,
          ),
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
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Send Email OTP', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward, size: 16),
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
