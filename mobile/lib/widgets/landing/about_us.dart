import 'package:flutter/material.dart';

class AboutUs extends StatelessWidget {
  const AboutUs({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AspectRatio(
              aspectRatio: 16 / 10,
              child: Image.asset(
                'assets/images/background-03.jpg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'ABOUT US',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              color: Color(0xFFEA580C),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Powered by RUDRAA HR Solutions',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            'RUDRAA Human Resource Solutions Pvt. Ltd. is a Tamil-Nadu-based recruitment firm built around a simple belief: every student and every professional in our state deserves a fair shot at a great career — regardless of their field, college, or hometown.',
            style: TextStyle(
              fontSize: 13.5,
              height: 1.55,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.7)
                  : const Color(0xFF52525B),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'We connect freshers with their first internship, and help experienced professionals find their next role — across IT, HR, Finance, Sales, Marketing, Supply Chain, BPO, and skilled trades.',
            style: TextStyle(
              fontSize: 13.5,
              height: 1.55,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.7)
                  : const Color(0xFF52525B),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _Stat(value: '38', label: 'Districts', isDark: isDark)),
              const SizedBox(width: 10),
              Expanded(child: _Stat(value: '20+', label: 'Career fields', isDark: isDark)),
              const SizedBox(width: 10),
              Expanded(child: _Stat(value: 'TA/EN', label: 'Languages', isDark: isDark)),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, required this.isDark});
  final String value;
  final String label;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.55)
                  : const Color(0xFF71717A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.4,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
        ],
      ),
    );
  }
}
