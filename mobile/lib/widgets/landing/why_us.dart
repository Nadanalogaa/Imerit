import 'package:flutter/material.dart';

/// Inline emphasis colour matching the source doc (Why us.docx uses
/// #BF4E14 — a close cousin of Tailwind brand-700 on web).
const _kEmphOnLight = Color(0xFFC2410C);
const _kEmphOnDark = Color(0xFFFB923C);

class WhyUs extends StatelessWidget {
  const WhyUs({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final items = <_WhyItem>[
      _WhyItem(
        title: 'Focus on our Young Aspirants',
        descBuilder: (isDark) => [
          const TextSpan(text: 'Part-time job opportunities via our '),
          _emphPlain('"Earn While You Learn"', isDark),
          const TextSpan(text: ' initiative — plus '),
          _emph('Internships', isDark),
          const TextSpan(text: ' and '),
          _emph('Apprenticeships', isDark),
          const TextSpan(text: ' that build real experience.'),
        ],
        icon: Icons.school_outlined,
        colors: const [Color(0xFFF97316), Color(0xFFD97706)],
      ),
      _WhyItem(
        title: '5 Stunning Templates',
        descBuilder: (isDark) => [
          const TextSpan(text: 'One-page résumés — '),
          _emph('Classic', isDark),
          const TextSpan(text: ', '),
          _emph('Modern', isDark),
          const TextSpan(text: ', '),
          _emph('Creative', isDark),
          const TextSpan(text: ', '),
          _emph('Corporate', isDark),
          const TextSpan(text: ', or '),
          _emph('Tech Mono', isDark),
          const TextSpan(text: '.'),
        ],
        icon: Icons.dashboard_customize_outlined,
        colors: const [Color(0xFF10B981), Color(0xFF14B8A6)],
      ),
      _WhyItem(
        title: 'Update Your Skills First, CV Optional',
        descBuilder: (isDark) => [
          _emph('No résumé needed.', isDark),
          const TextSpan(text: ' Just add your education and skills — we build the profile.'),
        ],
        icon: Icons.check_circle_outline,
        colors: const [Color(0xFF8B5CF6), Color(0xFFD946EF)],
      ),
      _WhyItem(
        title: 'Built for Every Industry',
        descBuilder: (isDark) => [
          _emph('IT and Non-IT', isDark),
          const TextSpan(text: ', '),
          _emph('MSMEs', isDark),
          const TextSpan(text: ', large enterprises, start-ups, freelancers, consultants.'),
        ],
        icon: Icons.apartment_outlined,
        colors: const [Color(0xFF0EA5E9), Color(0xFF06B6D4)],
      ),
    ];

    final bodyColor = isDark
        ? Colors.white.withValues(alpha: 0.6)
        : const Color(0xFF52525B);
    final headColor = isDark ? Colors.white : const Color(0xFF09090B);

    return Container(
      width: double.infinity,
      color: isDark ? const Color(0xFF0A0A0B) : const Color(0xFFFAFAFA),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      child: Column(
        children: [
          const Text(
            'WHY CHOOSE US',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
              color: Color(0xFFEA580C),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Beyond a traditional job portal',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: headColor,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Built for a Zero-Unemployment Tamil Nadu',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.4,
              color: Color(0xFFEA580C),
            ),
          ),
          const SizedBox(height: 12),
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: TextStyle(fontSize: 12.5, height: 1.55, color: bodyColor),
              children: [
                const TextSpan(text: 'Driven by the vision of creating a '),
                _emph('"Zero-Unemployment" state', isDark),
                const TextSpan(text: ', our specialised sourcing team identifies talent in every district — '),
                _emphPlain('ensuring the perfect fit between talent, skills, and job requirements.', isDark),
              ],
            ),
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            itemBuilder: (_, i) => _Tile(item: items[i], isDark: isDark),
          ),
        ],
      ),
    );
  }
}

/// Bold + brand-orange inline emphasis span (matches the doc's #BF4E14).
TextSpan _emph(String text, bool isDark) => TextSpan(
      text: text,
      style: TextStyle(
        fontWeight: FontWeight.w700,
        color: isDark ? _kEmphOnDark : _kEmphOnLight,
      ),
    );

/// Bold only (no colour) — matches "Earn While You Learn" in the doc.
TextSpan _emphPlain(String text, bool isDark) => TextSpan(
      text: text,
      style: TextStyle(
        fontWeight: FontWeight.w700,
        color: isDark ? Colors.white : const Color(0xFF18181B),
      ),
    );

class _WhyItem {
  const _WhyItem({
    required this.title,
    required this.descBuilder,
    required this.icon,
    required this.colors,
  });
  final String title;
  final List<InlineSpan> Function(bool isDark) descBuilder;
  final IconData icon;
  final List<Color> colors;
}

class _Tile extends StatelessWidget {
  const _Tile({required this.item, required this.isDark});
  final _WhyItem item;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final bodyColor = isDark
        ? Colors.white.withValues(alpha: 0.65)
        : const Color(0xFF52525B);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: item.colors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(item.icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            item.title,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
              color: isDark ? _kEmphOnDark : _kEmphOnLight,
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: TextStyle(
                  fontSize: 11.5,
                  height: 1.45,
                  color: bodyColor,
                ),
                children: item.descBuilder(isDark),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
