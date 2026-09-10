import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../auth/screens/login_screen.dart';
import '../../auth/services/auth_service.dart';
import '../../checkin/screens/weekly_checkin_screen.dart';
import '../../nutrition/screens/nutrition_screen.dart';
import '../../workout/screens/workout_screen.dart';
import 'today_hub_screen.dart';

/// الشاشة الرئيسية الحاضنة لأشرطة التنقل السفلية (Main Navigation Hub)
class MainNavigationScreen extends StatefulWidget {
  final LocalStorage storage;
  const MainNavigationScreen({super.key, required this.storage});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      TodayHubScreen(
        storage: widget.storage,
        onNavigateToTab: (index) {
          setState(() => _currentIndex = index);
        },
      ),
      NutritionScreen(storage: widget.storage),
      WorkoutScreen(storage: widget.storage),
      WeeklyCheckinScreen(storage: widget.storage),
    ];
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text(
          'هل ترغب بالفعل في تسجيل الخروج من هذا الجهاز؟',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              await widget.storage.clearSession();
              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => LoginScreen(storage: widget.storage),
                  ),
                );
              }
            },
            child: const Text('تأكيد الخروج'),
          ),
        ],
      ),
    );
  }

  void _handleDeleteAccount() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الحساب والبيانات نهائياً', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
        content: const Text(
          'تحذير: سيؤدي هذا الإجراء إلى مسح حسابك وكافة خططك الرياضية وسجلات التمارين وصور التقييم الأسبوعي بشكل كامل ونهائي من خوادم المنظومة دون إمكانية استرجاعها.\n\nهل تؤكد رغبتك في حذف الحساب نهائياً؟',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء التراجع', style: TextStyle(color: AppColors.textPrimary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              final apiClient = ApiClient(widget.storage);
              final authService = AuthService(apiClient, widget.storage);
              await authService.deleteAccount();

              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => LoginScreen(storage: widget.storage),
                  ),
                );
              }
            },
            child: const Text('نعم، احذف حسابي نهائياً'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Z COACHING'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppColors.textSecondary),
            color: AppColors.surface,
            onSelected: (value) {
              if (value == 'logout') {
                _handleLogout();
              } else if (value == 'delete_account') {
                _handleDeleteAccount();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout, size: 18, color: AppColors.textSecondary),
                    SizedBox(width: 8),
                    Text('تسجيل الخروج', style: TextStyle(color: AppColors.textPrimary, fontSize: 13)),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'delete_account',
                child: Row(
                  children: [
                    Icon(Icons.delete_forever, size: 18, color: AppColors.danger),
                    SizedBox(width: 8),
                    Text('حذف الحساب نهائياً', style: TextStyle(color: AppColors.danger, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.today_outlined),
            activeIcon: Icon(Icons.today),
            label: 'اليوم',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_outlined),
            activeIcon: Icon(Icons.restaurant),
            label: 'التغذية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fitness_center_outlined),
            activeIcon: Icon(Icons.fitness_center),
            label: 'التمارين',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_turned_in_outlined),
            activeIcon: Icon(Icons.assignment_turned_in),
            label: 'المتابعة',
          ),
        ],
      ),
    );
  }
}
