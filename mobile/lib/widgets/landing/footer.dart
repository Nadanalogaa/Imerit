import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../brand_logo.dart';

class LandingFooter extends StatelessWidget {
  const LandingFooter({super.key, required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final linkColor =
        isDark ? Colors.white.withValues(alpha: 0.75) : const Color(0xFF3F3F46);
    final divider =
        isDark ? Colors.white.withValues(alpha: 0.25) : const Color(0xFFA1A1AA);
    final muted =
        isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A);

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
          const SizedBox(height: 16),

          // Legal links — required for Play Store / App Store listing
          // and for parity with the web footer.
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _FooterLink('Privacy', color: linkColor, onTap: () => context.push('/legal/privacy')),
              _Divider(color: divider),
              _FooterLink('Terms', color: linkColor, onTap: () => context.push('/legal/terms')),
              _Divider(color: divider),
              _FooterLink('Refund', color: linkColor, onTap: () => context.push('/legal/refund')),
            ],
          ),
          const SizedBox(height: 14),

          Text(
            "© ${DateTime.now().year} RUDRAA Human Resource Solutions Pvt. Ltd.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, color: muted),
          ),
          const SizedBox(height: 4),
          Text(
            'Made with ❤️ in Tamil Nadu',
            style: TextStyle(fontSize: 11, color: muted),
          ),
        ],
      ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  const _FooterLink(this.text, {required this.color, required this.onTap});
  final String text;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: color,
          ),
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider({required this.color});
  final Color color;
  @override
  Widget build(BuildContext context) => Text(
        '·',
        style: TextStyle(color: color, fontSize: 12),
      );
}
