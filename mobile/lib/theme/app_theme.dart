import 'package:flutter/material.dart';

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
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark
          ? const Color(0xFF09090B)
          : Colors.white,
      fontFamily: '.SF Pro Display',
      textTheme: Typography.englishLike2021.apply(
        bodyColor: isDark ? Colors.white : const Color(0xFF18181B),
        displayColor: isDark ? Colors.white : const Color(0xFF09090B),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: isDark ? Colors.white : const Color(0xFF18181B),
      ),
    );
  }
}
