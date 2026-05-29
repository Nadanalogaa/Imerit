import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/storage.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() {
    final saved = Storage.instance.getString(StorageKeys.theme);
    return saved == 'dark' ? ThemeMode.dark : ThemeMode.light;
  }

  void toggle() {
    final next = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    state = next;
    Storage.instance.setString(
      StorageKeys.theme,
      next == ThemeMode.dark ? 'dark' : 'light',
    );
  }

  void setMode(ThemeMode mode) {
    state = mode;
    Storage.instance.setString(
      StorageKeys.theme,
      mode == ThemeMode.dark ? 'dark' : 'light',
    );
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);
