import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:infravision_mobile/main.dart';

void main() {
  testWidgets('Smoke test aplikasi berjalan', (WidgetTester tester) async {
    // Build aplikasi kita dengan status belum login.
    await tester.pumpWidget(const InfraVisionApp(isLoggedIn: false));

    // Memastikan aplikasi tidak crash saat dirender.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}