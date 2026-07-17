import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'storage/storage.dart';
import 'store/auth_provider.dart';
import 'store/locations_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Storage.init();
  final container = ProviderContainer();
  await container.read(locationsProvider.notifier).load();
  // Best-effort: if a valid auth cookie is in the jar, sync currentUser
  // with the server so the app boots straight into the dashboard.
  // Non-blocking on failure — offline / no-session boots normally.
  unawaited(container.read(authProvider.notifier).hydrateFromServer());
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const ItamilRecruitApp(),
    ),
  );
}

// Small local `unawaited` since we don't pull in dart:async for one call.
void unawaited(Future<void> f) {}
