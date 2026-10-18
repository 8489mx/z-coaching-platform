import 'package:flutter/material.dart';
import 'liquid_glass_nav_bar.dart';

void main() {
  runApp(const LiquidGlassDemoApp());
}

/// تطبيق مستقل ومعزول تماماً لاختبار شريط التنقل بالعدسة الزجاجية السائلة
class LiquidGlassDemoApp extends StatelessWidget {
  const LiquidGlassDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Liquid Glass Navigation Demo',
      theme: ThemeData(
        fontFamily: 'Alexandria',
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      ),
      home: const LiquidGlassDemoScreen(),
    );
  }
}

class LiquidGlassDemoScreen extends StatefulWidget {
  const LiquidGlassDemoScreen({super.key});

  @override
  State<LiquidGlassDemoScreen> createState() => _LiquidGlassDemoScreenState();
}

class _LiquidGlassDemoScreenState extends State<LiquidGlassDemoScreen> {
  int _currentTabIndex = 0;

  final List<LiquidGlassNavItem> _navItems = const [
    LiquidGlassNavItem(icon: Icons.today_rounded, label: 'اليوم'),
    LiquidGlassNavItem(icon: Icons.fitness_center_rounded, label: 'التمارين'),
    LiquidGlassNavItem(icon: Icons.restaurant_rounded, label: 'التغذية'),
    LiquidGlassNavItem(icon: Icons.calendar_month_rounded, label: 'المتابعة'),
  ];

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        body: SafeArea(
          child: Column(
            children: [
              // رأس الصفحة التوضيحي
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Z Coaching Platform',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.blueGrey.shade600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'معاينة العدسة الزجاجية السائلة',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blueGrey.shade100),
                      ),
                      child: Text(
                        'تبويب: ${_navItems[_currentTabIndex].label}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0284C7),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // مساحة المحتوى لاختبار شفافية وانكسار الشريط أمام العناصر
              Expanded(
                child: Center(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _navItems[_currentTabIndex].icon,
                          size: 48,
                          color: const Color(0xFF0284C7),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'التبويب النشط حالياً: ${_navItems[_currentTabIndex].label}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'انقر على تبويب آخر في الشريط السفلي لاختبار حركة الفقاعة وانكسار الزجاج',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.blueGrey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // شريط التنقل السفلي بالعدسة الزجاجية السائلة
              LiquidGlassNavBar(
                currentIndex: _currentTabIndex,
                items: _navItems,
                animationDuration: const Duration(milliseconds: 400),
                onTabSelected: (index) {
                  setState(() {
                    _currentTabIndex = index;
                  });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
