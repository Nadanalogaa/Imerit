import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

class CandidateRegisterPage extends ConsumerStatefulWidget {
  const CandidateRegisterPage({super.key});

  @override
  ConsumerState<CandidateRegisterPage> createState() => _CandidateRegisterPageState();
}

class _CandidateRegisterPageState extends ConsumerState<CandidateRegisterPage> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();
  String? _nameErr;
  String? _mobileErr;
  String? _emailErr;

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _email.dispose();
    super.dispose();
  }

  void _submit() {
    final auth = ref.read(authProvider.notifier);
    final name = _name.text.trim();
    final mobile = _mobile.text.trim();
    final email = _email.text.trim();

    String? nameErr;
    String? mobileErr;
    String? emailErr;

    if (name.isEmpty) nameErr = 'Required';
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(mobile)) {
      mobileErr = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      emailErr = 'Enter a valid email';
    }
    if (auth.findByEmail(email) != null) {
      emailErr = 'An account already exists with this email';
    }

    setState(() {
      _nameErr = nameErr;
      _mobileErr = mobileErr;
      _emailErr = emailErr;
    });

    if (nameErr != null || mobileErr != null || emailErr != null) return;

    auth.register(role: Role.candidate, name: name, email: email, mobile: mobile);
    OtpService.generate(email);
    context.go('/candidate/verify?email=${Uri.encodeQueryComponent(email)}');
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Create your candidate account',
      subtitle: 'Profile posting is free. Takes less than a minute.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(
            label: 'Full name',
            controller: _name,
            placeholder: 'e.g. Karthick S.',
            error: _nameErr,
            autofocus: true,
          ),
          const SizedBox(height: 14),
          ItrTextField(
            label: 'Mobile number',
            controller: _mobile,
            placeholder: '9876543210',
            keyboardType: TextInputType.number,
            maxLength: 10,
            formatters: [FilteringTextInputFormatter.digitsOnly],
            error: _mobileErr,
            hint: "We'll never share this without your permission.",
          ),
          const SizedBox(height: 14),
          ItrTextField(
            label: 'Email',
            controller: _email,
            placeholder: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            error: _emailErr,
            hint: "We'll send a 6-digit code to verify.",
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
                const Text('Already have an account? ', style: TextStyle(fontSize: 12)),
                GestureDetector(
                  onTap: () => context.go('/candidate/login'),
                  child: const Text(
                    'Sign in',
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
