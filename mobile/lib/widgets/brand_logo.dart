import 'package:flutter/material.dart';

/// Single source of truth for the app wordmark. The image itself is the full
/// lockup — orange icon + "Tamil Recruit" + tagline — so callers just pick a
/// height and get a properly-scaled banner. Renders on top of an optional
/// white-ish background so the JPEG's edges never fight a dark surface.
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
  });

  final BrandLogoSize size;

  /// If provided, wraps the logo in a rounded rectangle plate of this
  /// colour — useful on dark backgrounds where the logo needs a contrast
  /// backing. Pass null for surfaces that are already light.
  final Color? plateColor;

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
    final image = Image.asset(
      'assets/logo/logo-orange.jpeg',
      height: _height,
      fit: BoxFit.contain,
      // Semantics = accessible name for VoiceOver / TalkBack.
      semanticLabel: 'Tamil Recruit — Job Portal for Skilled Talent',
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
