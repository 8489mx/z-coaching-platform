import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:z_coaching_app/features/home/widgets/liquid_glass_nav_bar.dart';

void main() {
  group('LiquidGlassNavBar Widget Suite', () {
    testWidgets('renders all 4 tabs with RTL support and triggers tab selection', (tester) async {
      int selectedTab = 0;

      final items = const [
        LiquidGlassNavItem(icon: Icons.today_rounded, label: 'اليوم'),
        LiquidGlassNavItem(icon: Icons.fitness_center_rounded, label: 'التمارين'),
        LiquidGlassNavItem(icon: Icons.restaurant_rounded, label: 'التغذية'),
        LiquidGlassNavItem(icon: Icons.calendar_month_rounded, label: 'المتابعة'),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: Scaffold(
              bottomNavigationBar: LiquidGlassNavBar(
                currentIndex: selectedTab,
                items: items,
                onTabSelected: (index) {
                  selectedTab = index;
                },
              ),
            ),
          ),
        ),
      );

      // Verify all 4 tab labels render
      expect(find.text('اليوم'), findsOneWidget);
      expect(find.text('التمارين'), findsOneWidget);
      expect(find.text('التغذية'), findsOneWidget);
      expect(find.text('المتابعة'), findsOneWidget);

      // Tap on Tab 1 (التمارين)
      await tester.tap(find.text('التمارين'));
      await tester.pump(); // Start animation
      expect(selectedTab, 1);

      // Pump animation frames to verify spring simulation without crashes
      await tester.pump(const Duration(milliseconds: 100)); // mid-travel
      await tester.pump(const Duration(milliseconds: 200)); // deceleration
      await tester.pump(const Duration(milliseconds: 250)); // settled
    });
  });
}
