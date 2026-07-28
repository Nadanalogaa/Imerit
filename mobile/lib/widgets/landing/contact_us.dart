import 'dart:convert';
import 'package:flutter/material.dart';
import '../../storage/storage.dart';

class ContactUs extends StatelessWidget {
  const ContactUs({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      child: Column(
        children: [
          const Text(
            'CONTACT US',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              color: Color(0xFFEA580C),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Contact Us',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 8),
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: TextStyle(
                fontSize: 13,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.7)
                    : const Color(0xFF52525B),
              ),
              children: [
                const TextSpan(text: 'We Believe Your '),
                TextSpan(
                  text: 'Feedback',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : const Color(0xFF09090B),
                  ),
                ),
                const TextSpan(text: ' Drives Our Growth'),
              ],
            ),
          ),
          const SizedBox(height: 22),
          _ContactCard(
            isDark: isDark,
            icon: Icons.place_outlined,
            iconGradient: const [Color(0xFFF97316), Color(0xFFC2410C)],
            title: 'Our Presence',
            body:
                'RUDRAA HR Solutions Pvt. Ltd.\nRO: Salem · Branches: Chennai, Hosur',
          ),
          const SizedBox(height: 12),
          _ContactCard(
            isDark: isDark,
            icon: Icons.lightbulb_outline,
            iconGradient: const [Color(0xFFF59E0B), Color(0xFFCA8A04)],
            title: 'How can we improve?',
            body:
                'Your suggestions shape the platform.\nEvery message reaches the founding team.',
          ),
          const SizedBox(height: 12),
          _ContactCard(
            isDark: isDark,
            icon: Icons.mail_outline,
            iconGradient: const [Color(0xFF8B5CF6), Color(0xFFD946EF)],
            title: 'Email',
            body:
                'Service@itamilrecruit.net\nWill respond within 48 hours / 2 working days',
          ),
          const SizedBox(height: 12),
          _ContactCard(
            isDark: isDark,
            icon: Icons.phone_iphone_outlined,
            iconGradient: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
            title: 'Contacts',
            body: 'Mobile (WhatsApp only)\nMonday to Saturday · 10 AM to 6 PM',
          ),
          const SizedBox(height: 22),

          // Interactive contact form — parity with web ContactUs form.
          // Fields: Full name (req), Email (opt), Phone (opt), Subject,
          // Message (req). Stored under `itr.contacts` — same key that
          // the web app uses so admin views can pick up either source.
          _ContactForm(isDark: isDark),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({
    required this.isDark,
    required this.icon,
    required this.title,
    required this.body,
    required this.iconGradient,
  });

  final bool isDark;
  final IconData icon;
  final String title;
  final String body;
  final List<Color> iconGradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: iconGradient,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white : const Color(0xFF09090B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: TextStyle(
                    fontSize: 12.5,
                    height: 1.4,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.65)
                        : const Color(0xFF52525B),
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

class _ContactForm extends StatefulWidget {
  const _ContactForm({required this.isDark});
  final bool isDark;

  @override
  State<_ContactForm> createState() => _ContactFormState();
}

class _ContactFormState extends State<_ContactForm> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  void _submit() {
    if (_name.text.trim().isEmpty || _message.text.trim().isEmpty) return;
    final raw = Storage.instance.getString('itr.contacts');
    final List<dynamic> list =
        raw == null ? [] : (jsonDecode(raw) as List<dynamic>);
    list.insert(0, {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'name': _name.text,
      'email': _email.text,
      'phone': _phone.text,
      'subject': _subject.text,
      'message': _message.text,
      'createdAt': DateTime.now().toIso8601String(),
    });
    Storage.instance.setString('itr.contacts', jsonEncode(list));
    setState(() {
      _sent = true;
      _name.clear();
      _email.clear();
      _phone.clear();
      _subject.clear();
      _message.clear();
    });
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) setState(() => _sent = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  const Color(0xFFF97316).withValues(alpha: 0.10),
                  const Color(0xFF18181B),
                  const Color(0xFFF59E0B).withValues(alpha: 0.06),
                ]
              : [
                  const Color(0xFFFFF7ED),
                  const Color(0xFFFFEDD5),
                  const Color(0xFFFEF3C7),
                ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark
              ? const Color(0xFFF97316).withValues(alpha: 0.30)
              : const Color(0xFFFED7AA),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 4,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFF97316), Color(0xFFEA580C), Color(0xFFF59E0B)],
              ),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 18),
          _Field(
            isDark: isDark,
            controller: _name,
            label: 'Full name',
            hint: 'e.g. Karthick S.',
            required: true,
          ),
          const SizedBox(height: 12),
          _Field(
            isDark: isDark,
            controller: _email,
            label: 'Email (optional)',
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          _Field(
            isDark: isDark,
            controller: _phone,
            label: 'Phone (optional)',
            hint: '+91 ...',
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          _Field(
            isDark: isDark,
            controller: _subject,
            label: 'Subject',
            hint: "What's it about?",
          ),
          const SizedBox(height: 12),
          _Field(
            isDark: isDark,
            controller: _message,
            label: 'We would love to hear your "Questions & Suggestions"',
            hint: 'Share your questions, feedback, or suggestions here...',
            maxLines: 5,
            required: true,
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEA580C),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.send, size: 15),
                SizedBox(width: 8),
                Text(
                  'Send message',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            _sent
                ? "Got it — we'll respond within 48 hours."
                : 'Response within 48 hours / 2 working days.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: _sent ? FontWeight.w600 : FontWeight.w400,
              color: _sent
                  ? const Color(0xFF059669)
                  : (isDark
                      ? Colors.white.withValues(alpha: 0.55)
                      : const Color(0xFF71717A)),
            ),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.isDark,
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.keyboardType,
    this.required = false,
  });

  final bool isDark;
  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final TextInputType? keyboardType;
  final bool required;

  @override
  Widget build(BuildContext context) {
    final labelColor =
        isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46);
    final borderColor =
        isDark ? const Color(0xFF3F3F46) : const Color(0xFFFED7AA);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RichText(
          text: TextSpan(
            children: [
              TextSpan(
                text: label.toUpperCase(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: labelColor,
                  letterSpacing: 0.8,
                ),
              ),
              if (required)
                const TextSpan(
                  text: ' *',
                  style: TextStyle(
                    color: Color(0xFFEA580C),
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: TextStyle(
            fontSize: 13.5,
            color: isDark ? const Color(0xFFF4F4F5) : const Color(0xFF18181B),
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.35)
                  : const Color(0xFF9CA3AF),
              fontSize: 13,
            ),
            filled: true,
            fillColor: isDark ? const Color(0xFF09090B) : Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
