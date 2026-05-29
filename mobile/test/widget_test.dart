import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:itamil_recruit/app.dart';
import 'package:itamil_recruit/storage/storage.dart';

void main() {
  testWidgets('Landing page renders both entry cards', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await Storage.init();

    await tester.pumpWidget(const ProviderScope(child: ItamilRecruitApp()));
    await tester.pumpAndSettle();

    expect(find.text('Are you applying for a job?'), findsOneWidget);
    expect(find.text('Are you searching for a candidate?'), findsOneWidget);
    expect(find.text('Profile posting is FREE'), findsOneWidget);
    expect(find.text('Job posting is FREE'), findsOneWidget);
  });
}
