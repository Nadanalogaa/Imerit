import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../store/auth_provider.dart';

/// Reusable "set a password?" mini-form. Both OTP verify pages
/// (candidate + employer) drop this in as their second step after a
/// successful code check for a user with no password yet.
///
/// The user can Set (calls /auth/password/set-initial + flips
/// hasPassword in the local store so the prompt doesn't reappear) or
/// Skip. Both actions call `onDone()` so the parent handles navigation.
///
/// Brand tint is configurable so candidates get orange, employers get
/// sky-blue — matches the web pattern.
class InlineSetPassword extends ConsumerStatefulWidget {
  const InlineSetPassword({
    super.key,
    required this.onDone,
    this.brand = const Color(0xFFF97316),
  });
  final VoidCallback onDone;
  final Color brand;

  @override
  ConsumerState<InlineSetPassword> createState() => _InlineSetPasswordState();
}

class _InlineSetPasswordState extends ConsumerState<InlineSetPassword> {
  final _pwd = TextEditingController();
  final _confirm = TextEditingController();
  bool _show = false;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _pwd.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _set() async {
    setState(() => _error = null);
    if (_pwd.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    if (_pwd.text != _confirm.text) {
      setState(() => _error = "Passwords don't match.");
      return;
    }
    setState(() => _submitting = true);
    try {
      await AuthApi.instance.setInitialPassword(_pwd.text);
      // Flip hasPassword in the local User so the prompt doesn't
      // reappear on the next OTP session.
      final me = ref.read(authProvider);
      if (me != null) {
        ref.read(authProvider.notifier).state = me.copyWith(hasPassword: true);
      }
      widget.onDone();
    } on ApiError catch (e) {
      setState(() => _error = e.code == 'PASSWORD_EXISTS'
          ? 'You already have a password.'
          : (e.message.isNotEmpty ? e.message : 'Could not set the password.'));
    } catch (_) {
      setState(() => _error = 'Could not set the password. Try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? const Color(0xFF09090B) : Colors.white;
    final borderColor = isDark ? Colors.white.withValues(alpha: 0.12) : const Color(0xFFE4E4E7);
    final textColor = isDark ? Colors.white : const Color(0xFF09090B);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _fieldLabel('New password', isDark),
        Stack(alignment: Alignment.centerRight, children: [
          TextField(
            controller: _pwd,
            obscureText: !_show,
            autofocus: true,
            style: TextStyle(color: textColor, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'At least 8 characters',
              filled: true,
              fillColor: bg,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: widget.brand, width: 1.5)),
            ),
          ),
          IconButton(
            onPressed: () => setState(() => _show = !_show),
            icon: Icon(_show ? Icons.visibility_off : Icons.visibility, size: 18),
            color: isDark ? Colors.white70 : const Color(0xFF6B7280),
          ),
        ]),
        const SizedBox(height: 12),
        _fieldLabel('Confirm password', isDark),
        TextField(
          controller: _confirm,
          obscureText: !_show,
          style: TextStyle(color: textColor, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Type it again',
            filled: true,
            fillColor: bg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: widget.brand, width: 1.5)),
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(_error!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12)),
          ),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: _submitting ? null : _set,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
            backgroundColor: widget.brand,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 6,
            shadowColor: widget.brand.withValues(alpha: 0.4),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.vpn_key, size: 18),
              const SizedBox(width: 6),
              Text(_submitting ? 'Saving...' : 'Set password', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
            ],
          ),
        ),
        TextButton(
          onPressed: _submitting ? null : widget.onDone,
          child: Text("Skip — I'll use OTP for now",
              style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : const Color(0xFF52525B), fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 4),
        Text(
          'You can set or change your password any time from account settings.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : const Color(0xFF71717A)),
        ),
      ],
    );
  }

  Widget _fieldLabel(String text, bool isDark) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46),
            )),
      );
}
