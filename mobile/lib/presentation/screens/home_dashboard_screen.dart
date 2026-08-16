import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../data/services/api_service.dart';
import 'workout_screen.dart';
import 'nutrition_screen.dart';
import 'checkin_screen.dart';

class HomeDashboardScreen extends StatefulWidget {
  final String clientCode;
  final String userName;

  const HomeDashboardScreen({
    super.key,
    this.clientCode = '2',
    this.userName = 'كيمو المحروقي',
  });

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  int _currentTabIndex = 0;
  bool _loading = true;
  Map<String, dynamic>? _programData;
  String? _coachNotes;

  @override
  void initState() {
    super.initState();
    _loadProgram();
  }

  Future<void> _loadProgram() async {
    try {
      setState(() => _loading = true);
      final res = await ApiService().fetchActiveProgram(widget.clientCode);
      setState(() {
        _programData = res['master_program'];
        _coachNotes = _programData?['coach_notes'];
      });
    } catch (e) {
      debugPrint('Error loading program: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: AppTheme.primary),
        ),
      );
    }

    final screens = [
      _buildOverviewTab(),
      WorkoutScreen(program: _programData),
      NutritionScreen(program: _programData),
      CheckinScreen(clientCode: widget.clientCode, onSubmitted: _loadProgram),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.userName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProgram,
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        onTap: (index) => setState(() => _currentTabIndex = index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textMuted,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.fitness_center_outlined),
            activeIcon: Icon(Icons.fitness_center),
            label: 'التمارين',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_outlined),
            activeIcon: Icon(Icons.restaurant),
            label: 'الوجبات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment),
            label: 'المتابعة',
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    final targets = _programData?['nutrition_program']?['targets'];
    final calories = targets?['calories_kcal'] ?? 2200;
    final protein = targets?['protein_g'] ?? 170;
    final carbs = targets?['carbs_g'] ?? 220;
    final fats = targets?['fats_g'] ?? 60;

    return RefreshIndicator(
      onRefresh: _loadProgram,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Coach Notes Banner
            if (_coachNotes != null && _coachNotes!.isNotEmpty) ...[
              Card(
                color: const Color(0xFFECFDF5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: AppTheme.success, width: 1.5),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.success,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'توجيهات الكابتن المباشرة 👑',
                              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _coachNotes!,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.6,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Daily Macro Overview
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'أهداف الطاقة والماكروز اليومية',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textDark),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMacroItem('السعرات', '$calories', 'kcal', AppTheme.primary),
                        _buildMacroItem('البروتين', '$protein', 'جرام', AppTheme.danger),
                        _buildMacroItem('الكارب', '$carbs', 'جرام', Colors.blue),
                        _buildMacroItem('الدهون', '$fats', 'جرام', AppTheme.warning),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Quick Actions Card
            Card(
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFE0F2FE),
                  child: Icon(Icons.fitness_center, color: AppTheme.primary),
                ),
                title: const Text('تمرين اليوم (Upper A)', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('اضغط لبدء تسجيل مجموعات تمرين اليوم'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () => setState(() => _currentTabIndex = 1),
              ),
            ),

            const SizedBox(height: 12),

            Card(
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Color(0xFFFEF3C7),
                  child: Icon(Icons.assignment, color: AppTheme.warning),
                ),
                title: const Text('المتابعة الأسبوعية (Check-in)', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('سجل قياسات الأسبوع لتحديث خطتك تلقائياً'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () => setState(() => _currentTabIndex = 3),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMacroItem(String label, String value, String unit, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          unit,
          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textDark),
        ),
      ],
    );
  }
}
