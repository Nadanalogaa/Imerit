import 'package:flutter/material.dart';
import '../brand_logo.dart';

class LandingFooter extends StatelessWidget {
  const LandingFooter({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7),
          ),
        ),
      ),
      child: Column(
        children: [
          const Center(child: BrandLogo(size: BrandLogoSize.small)),
          const SizedBox(height: 10),
          Text(
            "© ${DateTime.now().year} RUDRAA Human Resource Solutions Pvt. Ltd.",
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Made with ❤️ in Tamil Nadu',
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A),
            ),
          ),
        ],
      ),
    );
  }
}
