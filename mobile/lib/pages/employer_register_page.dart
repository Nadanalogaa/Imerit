import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

class EmployerRegisterPage extends ConsumerStatefulWidget {
  const EmployerRegisterPage({super.key});
  @override
  ConsumerState<EmployerRegisterPage> createState() => _EmployerRegisterPageState();
}

class _EmployerRegisterPageState extends ConsumerState<EmployerRegisterPage> {
  final _name = TextEditingController();
  final _company = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();
  Map<String, String?> _errors = {};

  @override
  void dispose() {
    _name.dispose();
    _company.dispose();
    _mobile.dispose();
    _email.dispose();
    super.dispose();
  }

  void _submit() {
    final auth = ref.read(authProvider.notifier);
    final name = _name.text.trim();
    final company = _company.text.trim();
    final mobile = _mobile.text.trim();
    final email = _email.text.trim();

    final errs = <String, String?>{};
    if (name.isEmpty) errs['name'] = 'Required';
    if (company.isEmpty) errs['company'] = 'Required';
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(mobile)) errs['mobile'] = 'Enter a valid 10-digit mobile';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) errs['email'] = 'Enter a valid email';
    if (auth.findByEmail(email) != null) errs['email'] = 'An account already exists with this email';
    setState(() => _errors = errs);
    if (errs.isNotEmpty) return;

    auth.register(role: Role.employer, name: name, email: email, mobile: mobile, company: company);
    OtpService.generate(email);
    context.go('/employer/verify?email=${Uri.encodeQueryComponent(email)}');
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Create your employer account',
      subtitle: "Job posting is free. Subscribe only when you're ready to search candidates.",
      bgImage: 'assets/images/background-02.jpg',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(label: 'Your name', controller: _name, placeholder: 'e.g. Priya Iyer', error: _errors['name'], autofocus: true),
          const SizedBox(height: 14),
          ItrTextField(label: 'Company name', controller: _company, placeholder: 'e.g. Zoho Corporation', error: _errors['company']),
          const SizedBox(height: 14),
          ItrTextField(
            label: 'Mobile number',
            controller: _mobile,
            placeholder: '9876543210',
            keyboardType: TextInputType.number,
            maxLength: 10,
            formatters: [FilteringTextInputFormatter.digitsOnly],
            error: _errors['mobile'],
          ),
          const SizedBox(height: 14),
          ItrTextField(
            label: 'Work email',
            controller: _email,
            placeholder: 'you@company.com',
            keyboardType: TextInputType.emailAddress,
            error: _errors['email'],
            hint: "We'll send a 6-digit code to verify.",
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
                const Text('Already have an account? ', style: TextStyle(fontSize: 12)),
                GestureDetector(
                  onTap: () => context.go('/employer/login'),
                  child: const Text(
                    'Sign in',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0369A1)),
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
