import 'package:flutter/material.dart';

class WhyUs extends StatelessWidget {
  const WhyUs({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final items = const [
      _WhyItem(
        title: 'No CV needed',
        desc: 'Just simple structured fields. We render it beautifully for employers.',
        icon: Icons.description_outlined,
        colors: [Color(0xFFF97316), Color(0xFFD97706)],
      ),
      _WhyItem(
        title: '5 stunning templates',
        desc: 'Pick a profile look that fits you. Always one page, always polished.',
        icon: Icons.dashboard_customize_outlined,
        colors: [Color(0xFF10B981), Color(0xFF14B8A6)],
      ),
      _WhyItem(
        title: 'Built for every field',
        desc: "IT, HR, Sales, Finance, BPO, vocational — Tamil Nadu's full talent pool.",
        icon: Icons.public_outlined,
        colors: [Color(0xFF8B5CF6), Color(0xFFD946EF)],
      ),
      _WhyItem(
        title: 'Tamil Nadu first',
        desc: 'Made in Tamil Nadu, for Tamil Nadu. We know our cities, colleges, and companies.',
        icon: Icons.place_outlined,
        colors: [Color(0xFF0EA5E9), Color(0xFF06B6D4)],
      ),
    ];

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
            'A recruitment platform that fits Tamil Nadu',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.6,
              color: isDark ? Colors.white : const Color(0xFF09090B),
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
              childAspectRatio: 0.85,
            ),
            itemBuilder: (_, i) => _Tile(item: items[i], isDark: isDark),
          ),
        ],
      ),
    );
  }
}

class _WhyItem {
  const _WhyItem({
    required this.title,
    required this.desc,
    required this.icon,
    required this.colors,
  });
  final String title;
  final String desc;
  final IconData icon;
  final List<Color> colors;
}

class _Tile extends StatelessWidget {
  const _Tile({required this.item, required this.isDark});
  final _WhyItem item;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
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
              fontSize: 14.5,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
              color: isDark ? Colors.white : const Color(0xFF09090B),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: Text(
              item.desc,
              style: TextStyle(
                fontSize: 11.5,
                height: 1.45,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : const Color(0xFF52525B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
