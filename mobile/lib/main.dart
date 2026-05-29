import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'storage/storage.dart';
import 'store/locations_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Storage.init();
  final container = ProviderContainer();
  await container.read(locationsProvider.notifier).load();
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const ItamilRecruitApp(),
    ),
  );
}
