import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/admin_helpers.dart';
import '../store/auth_provider.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

class AdminLoginPage extends ConsumerStatefulWidget {
  const AdminLoginPage({super.key});
  @override
  ConsumerState<AdminLoginPage> createState() => _AdminLoginPageState();
}

class _AdminLoginPageState extends ConsumerState<AdminLoginPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _show = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    final email = _email.text.trim();
    final pwd = _password.text;
    final res = checkAdmin(email, pwd);
    if (res == null) {
      setState(() => _error = 'Invalid email or password');
      return;
    }
    final auth = ref.read(authProvider.notifier);
    final existing = auth.findByEmail(email);
    if (existing == null) {
      auth.register(role: res.role, name: res.name, email: email);
      auth.markVerified(email);
    } else {
      auth.loginByEmail(email);
    }
    context.go(res.role == Role.superAdmin ? '/super-admin/dashboard' : '/admin/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Internal access',
      subtitle: 'Sign in to the admin panel',
      bgImage: 'assets/images/background-04.jpg',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ItrTextField(
            label: 'Email',
            controller: _email,
            placeholder: 'admin@itr.com',
            keyboardType: TextInputType.emailAddress,
            autofocus: true,
          ),
          const SizedBox(height: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF3F3F46))),
              const SizedBox(height: 6),
              TextField(
                controller: _password,
                obscureText: !_show,
                decoration: InputDecoration(
                  hintText: '••••••••',
                  suffixIcon: IconButton(
                    icon: Icon(_show ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    onPressed: () => setState(() => _show = !_show),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE4E4E7))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE4E4E7))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5)),
                ),
              ),
              if (_error != null)
                Padding(padding: const EdgeInsets.only(top: 6), child: Text(_error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
            ],
          ),
          const SizedBox(height: 18),
          ElevatedButton.icon(
            onPressed: _submit,
            icon: const Icon(Icons.shield_rounded, size: 16),
            label: const Text('Sign in', style: TextStyle(fontWeight: FontWeight.w700)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF18181B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 4,
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('DEMO CREDENTIALS', style: TextStyle(fontSize: 9, letterSpacing: 1.5, fontWeight: FontWeight.w800, color: Color(0xFFB45309))),
                const SizedBox(height: 4),
                ...demoCreds().map((c) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 1),
                      child: Text(
                        '${c.role == Role.superAdmin ? "Super " : ""}Admin · ${c.email} / ${c.password}',
                        style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', color: Color(0xFFB45309)),
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
