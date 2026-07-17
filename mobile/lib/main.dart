import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'storage/storage.dart';
import 'store/applications_provider.dart';
import 'store/auth_provider.dart';
import 'store/jobs_provider.dart';
import 'store/locations_provider.dart';
import 'store/profile_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Storage.init();
  final container = ProviderContainer();
  await container.read(locationsProvider.notifier).load();
  // Best-effort: if a valid auth cookie is in the jar, sync currentUser
  // with the server so the app boots straight into the dashboard.
  // Non-blocking on failure — offline / no-session boots normally.
  //
  // AWAITED so the follow-up per-role fetches see the resolved user.
  await container.read(authProvider.notifier).hydrateFromServer();
  // Prime the jobs cache from /jobs so browse shows live listings from
  // the moment the app opens. Also non-blocking — the localStorage
  // seeds render immediately while the fetch is in flight.
  unawaited(container.read(jobsProvider.notifier).fetchJobs());
  // For candidates: pull their profile + applications so the
  // moderation pill lights up on the dashboard, "my applications"
  // list is fresh, and any server-side edits from another device
  // show up here too.
  final user = container.read(authProvider);
  if (user?.role == Role.candidate) {
    unawaited(container.read(profileProvider.notifier).fetchMine());
    unawaited(container.read(applicationsProvider.notifier).fetchMine(user!.id));
  }
  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const ItamilRecruitApp(),
    ),
  );
}

// Small local `unawaited` since we don't pull in dart:async for one call.
void unawaited(Future<void> f) {}
