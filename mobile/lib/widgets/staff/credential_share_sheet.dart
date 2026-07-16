import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// One-time bottom sheet surfacing a freshly-generated email + password
/// pair so staff can hand it off manually until real email is wired.
///
/// Same job as the web's `CredentialShareModal`, adapted for mobile: it's
/// a `showModalBottomSheet` rather than an overlay dialog, has a big
/// "copy both" affordance, and requires an acknowledgement tick before
/// letting the user dismiss — so nobody accidentally swipes it away
/// before capturing the password.
class CredentialShareSheet extends StatefulWidget {
  const CredentialShareSheet({
    super.key,
    required this.title,
    required this.subtitle,
    required this.email,
    required this.password,
  });

  final String title;
  final String subtitle;
  final String email;
  final String password;

  /// Convenience — pops the sheet on top of [context]. Returns after the
  /// sheet is dismissed. Uses `isDismissible: false` so a stray drag
  /// doesn't lose the credentials.
  static Future<void> show(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String email,
    required String password,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (_) => CredentialShareSheet(
        title: title,
        subtitle: subtitle,
        email: email,
        password: password,
      ),
    );
  }

  @override
  State<CredentialShareSheet> createState() => _CredentialShareSheetState();
}

class _CredentialShareSheetState extends State<CredentialShareSheet> {
  String? _copied;
  bool _ack = false;

  Future<void> _copy(String kind, String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    if (!mounted) return;
    setState(() => _copied = kind);
    Future.delayed(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _copied = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE4E4E7),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
              _Header(title: widget.title, subtitle: widget.subtitle),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                      ),
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Email delivery isn't wired yet",
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF92400E)),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Share these credentials manually (WhatsApp, phone, in person). The password stays visible on the Employer Master row for later lookup.',
                            style: TextStyle(fontSize: 11.5, color: Color(0xFF92400E), height: 1.4),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _CredRow(
                      icon: Icons.mail_rounded,
                      label: 'Email',
                      value: widget.email,
                      copied: _copied == 'email',
                      onCopy: () => _copy('email', widget.email),
                    ),
                    const SizedBox(height: 10),
                    _CredRow(
                      icon: Icons.key_rounded,
                      label: 'Password',
                      value: widget.password,
                      mono: true,
                      copied: _copied == 'password',
                      onCopy: () => _copy('password', widget.password),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () => _copy(
                        'both',
                        'Email: ${widget.email}\nPassword: ${widget.password}',
                      ),
                      icon: Icon(
                        _copied == 'both' ? Icons.check_rounded : Icons.copy_rounded,
                        size: 16,
                      ),
                      label: Text(
                        _copied == 'both' ? 'Both copied to clipboard' : 'Copy both',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                        foregroundColor: const Color(0xFF047857),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    InkWell(
                      onTap: () => setState(() => _ack = !_ack),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAFAFA),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE4E4E7)),
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: _ack ? const Color(0xFF10B981) : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: _ack ? const Color(0xFF10B981) : const Color(0xFFD4D4D8),
                                  width: 1.5,
                                ),
                              ),
                              child: _ack
                                  ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                "I've captured these credentials — I can share them with the employer and close this sheet.",
                                style: TextStyle(fontSize: 12, color: Color(0xFF52525B), height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: _ack ? () => Navigator.of(context).pop() : null,
                      icon: const Icon(Icons.check_rounded, size: 16),
                      label: const Text('Done', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFFA1A1AA),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: _ack ? 6 : 0,
                        shadowColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0D9488)]),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.20),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.verified_user_rounded, size: 22, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11.5,
                    color: Colors.white.withValues(alpha: 0.90),
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

class _CredRow extends StatelessWidget {
  const _CredRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.copied,
    required this.onCopy,
    this.mono = false,
  });
  final IconData icon;
  final String label;
  final String value;
  final bool copied;
  final VoidCallback onCopy;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 12, color: const Color(0xFF71717A)),
            const SizedBox(width: 6),
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.6,
                color: Color(0xFF71717A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 4, 4, 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE4E4E7)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: mono ? FontWeight.w700 : FontWeight.w600,
                    fontFamily: mono ? 'monospace' : null,
                    color: const Color(0xFF09090B),
                  ),
                ),
              ),
              InkWell(
                onTap: onCopy,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF4F4F5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        copied ? Icons.check_rounded : Icons.copy_rounded,
                        size: 13,
                        color: const Color(0xFF52525B),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        copied ? 'Copied' : 'Copy',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF52525B)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
