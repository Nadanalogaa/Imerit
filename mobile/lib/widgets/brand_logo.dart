import 'package:flutter/material.dart';

/// Single source of truth for the app wordmark. Ships in two ink
/// colours — dark for light surfaces, white for dark surfaces —
/// which we swap based on the caller's theme.
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

  /// Bypass the surrounding theme and pin the logo to one variant.
  /// Used on always-dark surfaces (auth pages) so the logo doesn't
  /// flip based on the app-wide theme toggle.
  ///
  ///   forceTheme = Brightness.dark  → always white-ink logo
  ///   forceTheme = Brightness.light → always dark-ink logo
  ///   null                          → picks based on Theme.of(context)
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

  String _assetFor(Brightness b) => b == Brightness.dark
      ? 'assets/logo/logo-white.png'
      : 'assets/logo/logo-dark.png';

  @override
  Widget build(BuildContext context) {
    final effective = forceTheme ?? Theme.of(context).brightness;
    final image = Image.asset(
      _assetFor(effective),
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
