import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../account/screens/account_screen.dart';
import '../../checkin/services/checkin_service.dart';
import '../../checkin/screens/weekly_checkin_screen.dart';
import '../../nutrition/screens/nutrition_screen.dart';
import '../../workout/services/workout_service.dart';
import '../../workout/screens/workout_screen.dart';
import '../widgets/liquid_glass_nav_bar.dart';
import 'today_hub_screen.dart';

/// الشاشة الرئيسية الحاضنة لأشرطة التنقل السفلية (Main Navigation Hub)
/// شريط ملاحة سفلي عالمي فائق النقاء بنمط العدسة الزجاجية السائلة (Liquid Glass Navigation)
class MainNavigationScreen extends StatefulWidget {
  final LocalStorage storage;
  const MainNavigationScreen({super.key, required this.storage});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  // P1-B11: keys for the refresh-on-return wiring. IndexedStack keeps
  // screens mounted, so without these a tab switch never reloaded.
  final GlobalKey<WorkoutScreenState> _workoutKey = GlobalKey<WorkoutScreenState>();
  final GlobalKey<NutritionScreenState> _nutritionKey = GlobalKey<NutritionScreenState>();

  static const List<LiquidGlassNavItem> _navItems = [
    LiquidGlassNavItem(icon: Icons.home_rounded, label: 'اليوم'),
    LiquidGlassNavItem(icon: Icons.fitness_center_rounded, label: 'التمارين'),
    LiquidGlassNavItem(icon: Icons.eco_rounded, label: 'التغذية'),
    LiquidGlassNavItem(icon: Icons.fact_check_rounded, label: 'المتابعة'),
    LiquidGlassNavItem(icon: Icons.account_circle_rounded, label: 'حسابي'),
  ];

  @override
  void initState() {
    super.initState();
    _screens = [
      TodayHubScreen(
        storage: widget.storage,
        onNavigateToTab: _onTabSelected,
      ),
      WorkoutScreen(key: _workoutKey, storage: widget.storage),
      NutritionScreen(key: _nutritionKey, storage: widget.storage),
      WeeklyCheckinScreen(storage: widget.storage),
      AccountScreen(storage: widget.storage),
    ];
    _uploadPendingCheckins();
    _uploadPendingWorkouts();
  }

  /// أي متابعة اتحفظت على الجهاز وقت انقطاع النت تترفع أول ما التطبيق يفتح ومعاه اتصال.
  Future<void> _uploadPendingCheckins() async {
    final service = CheckinService(ApiClient(widget.storage), widget.storage);
    final result = await service.flushPendingCheckins();
    if (!mounted || (result['uploaded'] ?? 0) == 0) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.primaryDeep,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Text(
          'تمت مزامنة ${result['uploaded']} متابعة مسجلة محلياً بنجاح.',
          style: const TextStyle(fontFamily: 'Alexandria', fontSize: 13),
        ),
      ),
    );
  }

  /// P1-B11: mirror of _uploadPendingCheckins for the exercise queue.
  /// flushPendingWorkoutLogs existed with zero callers, so offline
  /// workout logs sat on the device forever.
  Future<void> _uploadPendingWorkouts() async {
    final service = WorkoutService(widget.storage);
    final result = await service.flushPendingWorkoutLogs();
    if (!mounted || (result['uploaded'] ?? 0) == 0) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.primaryDeep,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        content: Text(
          'تمت مزامنة ${result['uploaded']} سجل تمرين محلي بنجاح.',
          style: const TextStyle(fontFamily: 'Alexandria', fontSize: 13),
        ),
      ),
    );
  }

  void _onTabSelected(int index) {
    setState(() => _currentIndex = index);
    // P1-B11: refresh the tab's data on return (see the screens'
    // refresh() methods). The check-in and account tabs keep their own
    // loading behavior and are untouched.
    if (index == 1) _workoutKey.currentState?.refresh();
    if (index == 2) _nutritionKey.currentState?.refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      extendBody: true,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: LiquidGlassNavBar(
        currentIndex: _currentIndex,
        items: _navItems,
        onTabSelected: _onTabSelected,
      ),
    );
  }
}
