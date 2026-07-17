import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../store/auth_provider.dart';
import '../store/theme_provider.dart';
import '../utils/otp.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/inline_set_password.dart';

class EmployerOtpPage extends ConsumerStatefulWidget {
  const EmployerOtpPage({super.key, required this.email, this.mode = 'register'});
  final String email;
  final String mode;
  @override
  ConsumerState<EmployerOtpPage> createState() => _EmployerOtpPageState();
}

class _EmployerOtpPageState extends ConsumerState<EmployerOtpPage> {
  final List<TextEditingController> _ctrls = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());
  String? _error;
  String? _demo;
  String _step = 'verify'; // 'verify' | 'setPassword'

  @override
  void initState() {
    super.initState();
    _demo = OtpService.active(widget.email);
  }

  @override
  void dispose() {
    for (final c in _ctrls) c.dispose();
    for (final n in _nodes) n.dispose();
    super.dispose();
  }

  void _onChange(int i, String v) {
    if (v.length == 1 && i < 5) _nodes[i + 1].requestFocus();
    else if (v.isEmpty && i > 0) _nodes[i - 1].requestFocus();
  }

  Future<void> _verify() async {
    final code = _ctrls.map((c) => c.text).join();
    if (code.length != 6) {
      setState(() => _error = 'Enter all 6 digits');
      return;
    }
    final auth = ref.read(authProvider.notifier);
    if (apiEnabled) {
      try {
        final res = await AuthApi.instance.verifyOtp(
          email: widget.email,
          code: code,
          purpose: widget.mode == 'login' ? ApiOtpPurpose.LOGIN : ApiOtpPurpose.REGISTER,
        );
        await auth.hydrateFromServer();
        if (!res.user.hasPassword) {
          if (mounted) setState(() => _step = 'setPassword');
        } else {
          if (mounted) context.go('/employer/dashboard');
        }
      } on ApiError catch (e) {
        setState(() => _error = _mapOtpError(e.code, e.message));
      } catch (_) {
        setState(() => _error = 'Verification failed. Try again.');
      }
      return;
    }
    if (!OtpService.verify(widget.email, code)) {
      setState(() => _error = 'Invalid or expired code. Try again.');
      return;
    }
    if (widget.mode == 'login') {
      auth.loginByEmail(widget.email);
    } else {
      auth.markVerified(widget.email);
    }
    if (mounted) context.go('/employer/dashboard');
  }

  String _mapOtpError(String code, String fallback) {
    switch (code) {
      case 'OTP_NOT_FOUND': return 'No code requested for this email. Tap Resend below.';
      case 'OTP_EXPIRED':   return 'This code expired. Tap Resend to get a fresh one.';
      case 'OTP_INVALID':   return 'Incorrect code. Check the digits and try again.';
      case 'OTP_LOCKED':    return 'Too many wrong attempts. Tap Resend to start over.';
      case 'RATE_LIMIT':    return 'Too many attempts. Wait a minute, then resend.';
      default:              return fallback.isNotEmpty ? fallback : 'Verification failed.';
    }
  }

  void _resend() {
    final code = OtpService.generate(widget.email);
    setState(() {
      _demo = code;
      _error = null;
      for (final c in _ctrls) c.clear();
    });
    _nodes[0].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    if (_step == 'setPassword') {
      return AuthScaffold(
        title: 'One quick step',
        subtitle: 'Set a password so you can sign in faster next time — or skip.',
        child: InlineSetPassword(
          onDone: () => context.go('/employer/dashboard'),
          brand: const Color(0xFF0EA5E9),
        ),
      );
    }
    return AuthScaffold(
      title: widget.mode == 'login' ? 'Sign in with code' : 'Verify your email',
      subtitle: 'We sent a 6-digit code to ${widget.email}',
      bgImage: 'assets/images/background-02.jpg',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_demo != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFFF59E0B).withValues(alpha: 0.10) : const Color(0xFFFEF3C7),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('Demo only: no email sent', style: TextStyle(fontSize: 11.5, color: Color(0xFFB45309), fontWeight: FontWeight.w600)),
                  ),
                  Text(_demo!, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w800, fontSize: 17, color: Color(0xFFB45309), letterSpacing: 4)),
                ],
              ),
            ),
          Text(
            'Enter 6-digit code',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46)),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (i) => SizedBox(
              width: 44,
              height: 56,
              child: TextField(
                controller: _ctrls[i],
                focusNode: _nodes[i],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
                decoration: InputDecoration(
                  counterText: '',
                  contentPadding: EdgeInsets.zero,
                  filled: true,
                  fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5)),
                ),
                onChanged: (v) => _onChange(i, v),
              ),
            )),
          ),
          if (_error != null)
            Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(fontSize: 11, color: Color(0xFFEF4444)))),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _verify,
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
                Text('Verify and continue', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(width: 6),
                Icon(Icons.check, size: 18),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => context.go(widget.mode == 'login' ? '/employer/login' : '/employer/register'),
                child: Text('← Wrong email?', style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
              ),
              GestureDetector(
                onTap: _resend,
                child: const Text('Resend code', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF0369A1))),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
