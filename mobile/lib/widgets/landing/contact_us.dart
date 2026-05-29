import 'package:flutter/material.dart';

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
            "Let's talk",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Questions, partnerships, or feedback — we'd love to hear from you.",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.6)
                  : const Color(0xFF52525B),
            ),
          ),
          const SizedBox(height: 22),
          _ContactCard(
            isDark: isDark,
            icon: Icons.place_outlined,
            title: 'Visit us',
            body: 'RUDRAA HR Solutions Pvt. Ltd.\nTamil Nadu, India',
          ),
          const SizedBox(height: 12),
          _ContactCard(
            isDark: isDark,
            icon: Icons.call_outlined,
            title: 'Call us',
            body: 'Mon – Sat, 9am – 7pm\n+91 00000 00000',
          ),
          const SizedBox(height: 12),
          _ContactCard(
            isDark: isDark,
            icon: Icons.mail_outline,
            title: 'Email us',
            body: 'hello@itamilrecruit.com\nReplies within 24 hrs',
          ),
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
  });

  final bool isDark;
  final IconData icon;
  final String title;
  final String body;

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
              gradient: const LinearGradient(
                colors: [Color(0xFFF97316), Color(0xFFC2410C)],
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
