import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const brand = Color(0xFFF97316);
  static const brandDark = Color(0xFFC2410C);
  static const sky = Color(0xFF0EA5E9);
}

class AppTheme {
  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      brightness: Brightness.light,
    );
    return _base(scheme, Brightness.light);
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.brand,
      brightness: Brightness.dark,
    );
    return _base(scheme, Brightness.dark);
  }

  static ThemeData _base(ColorScheme scheme, Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    // Lato — matches the web app's font choice. GoogleFonts fetches on
    // first launch and caches locally after that. Applied both via
    // `fontFamily` (for widgets that read it directly) AND via
    // `textTheme` (so all Material text styles inherit the family).
    final base = Typography.englishLike2021.apply(
      bodyColor: isDark ? Colors.white : const Color(0xFF18181B),
      displayColor: isDark ? Colors.white : const Color(0xFF09090B),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark
          ? const Color(0xFF09090B)
          : Colors.white,
      fontFamily: GoogleFonts.lato().fontFamily,
      textTheme: GoogleFonts.latoTextTheme(base),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
        titleTextStyle: GoogleFonts.lato(
          color: isDark ? Colors.white : const Color(0xFF18181B),
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
