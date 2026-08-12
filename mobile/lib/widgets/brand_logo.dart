import 'package:flutter/material.dart';

/// Single source of truth for the app wordmark. The dark-ink art
/// (`logo-dark.png`) ships on EVERY surface — light theme, dark theme,
/// the auth scaffold, the footer — so the brand looks identical
/// regardless of the visitor's theme choice. The `logo-white.png`
/// variant is deprecated and no longer referenced; `forceTheme` is
/// kept only so old callers that still pass it don't error.
///
/// The PNGs were trimmed of their transparent padding at build time
/// (see web/public/logo-*.png sources), so the sizes here map
/// directly to visible glyph height.
///
/// Sizes roughly:
///  - `small`  ~ 28 px (AppBar / footer)
///  - `medium` ~ 40 px (auth headers)
///  - `large`  ~ 72 px (hero / landing)
class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.size = BrandLogoSize.medium,
    this.plateColor,
    this.forceTheme,
  });

  final BrandLogoSize size;

  /// Optional rounded plate behind the logo — legacy hack for the
  /// old JPEG logo that had white edges. Kept as an escape hatch;
  /// most callers can drop it now that the PNGs have transparent
  /// backgrounds.
  final Color? plateColor;

  /// Deprecated — kept only so callers still passing `Brightness.dark`
  /// don't error. The logo is ALWAYS `logo-dark.png` now, everywhere.
  /// Remove this field the next time we sweep BrandLogo call sites.
  final Brightness? forceTheme;

  double get _height => switch (size) {
        BrandLogoSize.small => 28,
        BrandLogoSize.medium => 40,
        BrandLogoSize.large => 72,
      };

  double get _pad => switch (size) {
        BrandLogoSize.small => 3,
        BrandLogoSize.medium => 5,
        BrandLogoSize.large => 8,
      };

  @override
  Widget build(BuildContext context) {
    // Mirrors web/src/components/Brand.tsx — one logo, everywhere.
    final image = Image.asset(
      'assets/logo/logo-dark.png',
      height: _height,
      fit: BoxFit.contain,
      semanticLabel: 'i-Tamil Recruit — Job Portal for Skilled Talent',
    );
    if (plateColor == null) return image;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: _pad, vertical: _pad),
      decoration: BoxDecoration(
        color: plateColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: image,
    );
  }
}

enum BrandLogoSize { small, medium, large }
