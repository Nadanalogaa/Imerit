import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router.dart';
import 'store/theme_provider.dart';
import 'theme/app_theme.dart';

class ItamilRecruitApp extends ConsumerWidget {
  const ItamilRecruitApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(themeProvider);
    return MaterialApp.router(
      title: 'i-Tamil Recruit',
      debugShowCheckedModeBanner: false,
      themeMode: mode,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: appRouter,
    );
  }
}
