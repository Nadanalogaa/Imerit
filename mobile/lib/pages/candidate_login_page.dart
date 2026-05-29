import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

class CandidateLoginPage extends ConsumerStatefulWidget {
  const CandidateLoginPage({super.key});

  @override
  ConsumerState<CandidateLoginPage> createState() => _CandidateLoginPageState();
}

class _CandidateLoginPageState extends ConsumerState<CandidateLoginPage> {
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
    if (user == null || user.role != Role.candidate) {
      setState(() => _err = 'No candidate account found with this email');
      return;
    }
    OtpService.generate(email);
    context.go(
      '/candidate/verify?email=${Uri.encodeQueryComponent(email)}&mode=login',
    );
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Welcome back',
      subtitle:
          'Sign in to your candidate account with a one-time email code.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(
            label: 'Email',
            controller: _email,
            placeholder: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
            error: _err,
            hint: "We'll send you a fresh 6-digit code.",
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: const Color(0xFFF97316),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 6,
              shadowColor: const Color(0xFFF97316).withValues(alpha: 0.4),
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
                  onTap: () => context.go('/candidate/register'),
                  child: const Text(
                    'Create an account',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFEA580C),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
