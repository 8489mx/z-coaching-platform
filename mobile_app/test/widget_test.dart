import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:z_coaching_app/core/storage/local_storage.dart';
import 'package:z_coaching_app/main.dart';

void main() {
  testWidgets('تحميل وانطلاق شاشة تسجيل الدخول بنجاح', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final storage = await LocalStorage.getInstance();

    await tester.pumpWidget(ZCoachingApp(storage: storage, hasSession: false));
    await tester.pumpAndSettle();

    // التحقق من ظهور عنوان المنظومة وزر الدخول
    expect(find.text('منظومة Z التدريبية'), findsOneWidget);
    expect(find.text('تسجيل الدخول ومزامنة الخطة'), findsOneWidget);
  });
}
