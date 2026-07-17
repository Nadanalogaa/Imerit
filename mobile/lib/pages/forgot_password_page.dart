import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../widgets/auth_scaffold.dart';
import '../widgets/itr_text_field.dart';

/// Two-step wizard on one page:
///   1. request — user enters email → we call /auth/password/forgot
///      which dispatches a PASSWORD_RESET OTP if the account has a
///      passwordHash. Same response either way (no enumeration).
///   2. reset — user enters the OTP + a new password → we call
///      /auth/password/reset which verifies + sets the new bcrypt
///      hash and nulls out the old sharedPassword so admins can no
///      longer reveal the prior credential.
///
/// `?lane=staff|employer|candidate` in the URL tunes the copy + the
/// back-to-login destination. Defaults to staff.
class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key, this.lane = 'staff'});
  final String lane;
  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _newPwd = TextEditingController();
  String _step = 'request'; // 'request' | 'reset'
  bool _show = false;
  bool _submitting = false;
  String? _error;
  String? _info;

  String get _loginPath => switch (widget.lane) {
        'employer' => '/employer/login',
        'candidate' => '/candidate/login',
        _ => '/staff/login',
      };

  Color get _brand => widget.lane == 'employer' ? const Color(0xFF0EA5E9) : const Color(0xFFF97316);

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    _newPwd.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    setState(() { _error = null; _info = null; });
    final email = _email.text.trim();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      setState(() => _error = 'Enter a valid email.');
      return;
    }
    setState(() => _submitting = true);
    try {
      await AuthApi.instance.forgotPassword(email);
      setState(() {
        _info = 'If an eligible account exists for that email, a reset code has been sent. Check your inbox (and spam folder).';
        _step = 'reset';
      });
    } on ApiError catch (e) {
      setState(() => _error = e.code == 'RATE_LIMIT'
          ? 'Too many attempts — try again in an hour.'
          : 'Could not send the reset code. Try again in a moment.');
    } catch (_) {
      setState(() => _error = 'Could not send the reset code. Try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _applyReset() async {
    setState(() { _error = null; _info = null; });
    if (!RegExp(r'^\d{6}$').hasMatch(_code.text.trim())) {
      setState(() => _error = 'Enter the 6-digit code from your email.');
      return;
    }
    if (_newPwd.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    setState(() => _submitting = true);
    try {
      await AuthApi.instance.resetPassword(_email.text.trim(), _code.text.trim(), _newPwd.text);
      HapticFeedback.mediumImpact();
      if (mounted) context.go('$_loginPath?reset=1');
    } on ApiError catch (e) {
      setState(() => _error = switch (e.code) {
            'OTP_INVALID' || 'OTP_NOT_FOUND' => 'Incorrect code. Check your inbox and try again.',
            'OTP_EXPIRED' => 'That code has expired. Request a new one.',
            'OTP_LOCKED' => 'Too many wrong attempts. Request a fresh code.',
            'PASSWORD_TOO_SHORT' => 'Password must be at least 8 characters.',
            _ => 'Could not reset the password. Try again.',
          });
    } catch (_) {
      setState(() => _error = 'Could not reset the password.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Reset your password',
      subtitle: 'Get a fresh password for your ${widget.lane} account.',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_info != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
              ),
              child: Text(_info!, style: const TextStyle(fontSize: 12, color: Color(0xFF047857))),
            ),
          if (_step == 'request') ...[
            ItrTextField(label: 'Email', controller: _email, hint: 'you@company.com', keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _sendCode,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: _brand,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(_submitting ? 'Sending...' : 'Send reset code', style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ] else ...[
            ItrTextField(label: 'Email', controller: _email),
            const SizedBox(height: 12),
            ItrTextField(label: '6-digit code', controller: _code, hint: '123456', keyboardType: TextInputType.number, maxLength: 6),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text('New password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey[700])),
            ),
            Stack(alignment: Alignment.centerRight, children: [
              TextField(
                controller: _newPwd,
                obscureText: !_show,
                decoration: InputDecoration(
                  hintText: 'At least 8 characters',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: _brand, width: 1.5),
                  ),
                ),
              ),
              IconButton(
                onPressed: () => setState(() => _show = !_show),
                icon: Icon(_show ? Icons.visibility_off : Icons.visibility, size: 18),
              ),
            ]),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _applyReset,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: _brand,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(_submitting ? 'Resetting...' : 'Set new password', style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
            TextButton(
              onPressed: () => setState(() { _step = 'request'; _code.clear(); _newPwd.clear(); _error = null; }),
              child: const Text("Didn't get a code? Send it again.", style: TextStyle(fontSize: 12)),
            ),
          ],
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(_error!, style: const TextStyle(fontSize: 12, color: Color(0xFFEF4444))),
            ),
          const SizedBox(height: 24),
          Center(
            child: GestureDetector(
              onTap: () => context.go(_loginPath),
              child: Text('← Back to ${widget.lane} sign in',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            ),
          ),
        ],
      ),
    );
  }
}
