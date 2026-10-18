import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../account/screens/account_screen.dart';
import '../../auth/models/client_user.dart';
import '../../nutrition/models/meal_models.dart';
import '../../notifications/models/notification_item.dart';
import '../../notifications/services/notification_service.dart';

/// شاشة اليوم التفاعلية (Today Hub)
/// تصميم فائق النقاء والهدوء متطابق مع معايير التطبيقات العالمية الراقية (Editorial Minimal)
class TodayHubScreen extends StatefulWidget {
  final LocalStorage storage;
  final Function(int tabIndex)? onNavigateToTab;

  const TodayHubScreen({
    super.key,
    required this.storage,
    this.onNavigateToTab,
  });

  @override
  State<TodayHubScreen> createState() => _TodayHubScreenState();
}

class _TodayHubScreenState extends State<TodayHubScreen> {
  ClientUser? _user;
  Map<String, dynamic>? _activeProgram;
  late final NotificationService _notificationService;
  List<NotificationItem> _notifications = [];

  DailyMacroTarget _macroTarget = DailyMacroTarget(calories: 0, protein: 0, carbs: 0, fat: 0, waterLiters: 0.0);
  List<SupplementItem> _supplements = [];

  String _todayWorkoutName = 'لا توجد جلسة محددة لليوم';
  int _todayExercisesCount = 0;
  bool _hasProgram = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _programChangeSummary;

  @override
  void initState() {
    super.initState();
    _notificationService = NotificationService(ApiClient(widget.storage));
    _loadData();
  }

  void _loadData() {
    final clientData = widget.storage.getClientData();
    if (clientData != null) {
      _user = ClientUser.fromJson(clientData);
    }

    _activeProgram = widget.storage.getCachedActiveProgram();
    if (_activeProgram != null) {
      _applyProgram(_activeProgram!);
    }
    _refreshActiveProgram();

    if (_user != null) {
      _notificationService.fetchNotifications(_user!.clientCode).then((notifs) {
        if (mounted) {
          setState(() {
            _notifications = notifs;
          });
        }
      });
    }

    setState(() {});
  }

  /// يجلب البرنامج النشط للمتدرب المسجل من الخادم ويحفظه للعمل دون اتصال.
  Future<void> _refreshActiveProgram() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final response = await ApiClient(widget.storage).get(ApiConstants.activeProgram);
      final data = response.data;
      if (!response.isSuccess || data is! Map) {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          if (_activeProgram == null) {
            _errorMessage = 'تعذر الاتصال بالخادم لجلب الخطة الحالية. يرجى التحقق من اتصال الإنترنت.';
          }
        });
        return;
      }

      final program = data['master_program'] is Map
          ? Map<String, dynamic>.from(data['master_program'] as Map)
          : Map<String, dynamic>.from(data);
      if (data['client_view'] is Map) {
        program['client_view'] = data['client_view'];
      }

      // مقارنة مع النسخة السابقة لعرض ملخص التعديل إن وجد
      if (_activeProgram != null && data['updated_at'] != null && _activeProgram!['updated_at'] != data['updated_at']) {
        _programChangeSummary = 'تم تحديث خطتك التدريبية والغذائية من قبل المدرب وفق تقييمك الأخير.';
      }

      await widget.storage.cacheActiveProgram(program);
      if (!mounted) return;
      setState(() {
        _activeProgram = program;
        _isLoading = false;
        _errorMessage = null;
        _applyProgram(program);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        if (_activeProgram == null) {
          _errorMessage = 'حدث خطأ أثناء تحميل الخطة. يرجى مراجعة الاتصال أو المدرب.';
        }
      });
    }
  }

  /// يقرأ الأهداف اليومية وجلسة اليوم من شكل البرنامج الذي يرسله الخادم.
  void _applyProgram(Map<String, dynamic> program) {
    bool hasAnyData = false;

    // 1. الأهداف الغذائية من client_view أو nutrition
    final clientView = program['client_view'] as Map<String, dynamic>?;
    if (clientView != null && clientView['target_macros'] is Map) {
      _macroTarget = DailyMacroTarget.fromJson(Map<String, dynamic>.from(clientView['target_macros'] as Map));
      if (_macroTarget.calories > 0) hasAnyData = true;
    } else {
      final nutrition = program['nutrition'];
      final nutritionProgram = program['nutrition_program'];
      Map? targets;
      if (nutrition is Map) {
        final t = nutrition['daily_targets'] ?? nutrition['targets'];
        if (t is Map) targets = t;
      }
      if (targets == null && nutritionProgram is Map && nutritionProgram['macro_targets'] is Map) {
        targets = nutritionProgram['macro_targets'] as Map;
      }
      if (targets != null) {
        _macroTarget = DailyMacroTarget.fromJson({
          'calories': targets['calories'] ?? targets['calories_kcal'] ?? targets['target_calories'],
          'protein': targets['protein'] ?? targets['protein_g'],
          'carbs': targets['carbs'] ?? targets['carbohydrate_g'] ?? targets['carbs_g'],
          'fat': targets['fats'] ?? targets['fat'] ?? targets['fat_g'],
        });
        if (_macroTarget.calories > 0) hasAnyData = true;
      }
    }

    // 2. جلسة تمرين اليوم من client_view أو training
    if (clientView != null && clientView['training_session'] is Map) {
      final sessionMap = Map<String, dynamic>.from(clientView['training_session'] as Map);
      _todayWorkoutName = (sessionMap['session_name'] ?? sessionMap['name'] ?? sessionMap['title'] ?? 'جلسة تدريب اليوم').toString();
      if (sessionMap['exercises'] is List) {
        _todayExercisesCount = (sessionMap['exercises'] as List).length;
      }
      hasAnyData = true;
    } else {
      List? sessions;
      for (final key in ['training_program', 'training']) {
        final block = program[key];
        if (block is! Map) continue;
        final weeks = block['weeks'];
        if (weeks is List && weeks.isNotEmpty && weeks.first is Map && (weeks.first as Map)['sessions'] is List) {
          sessions = (weeks.first as Map)['sessions'] as List;
        } else if (block['sessions'] is List) {
          sessions = block['sessions'] as List;
        }
        if (sessions != null && sessions.isNotEmpty) break;
      }
      if (sessions != null && sessions.isNotEmpty && sessions.first is Map) {
        final firstSession = sessions.first as Map;
        _todayWorkoutName = (firstSession['session_name'] ?? firstSession['name'] ?? firstSession['title'])?.toString() ?? 'جلسة تدريب اليوم';
        if (firstSession['exercises'] is List) {
          _todayExercisesCount = (firstSession['exercises'] as List).length;
        }
        hasAnyData = true;
      }
    }

    // 3. المكملات المقررة من الخادم (للعرض فقط)
    final supplementsRaw = program['supplements'] ?? (program['master_program'] is Map ? (program['master_program'] as Map)['supplements'] : null);
    if (supplementsRaw is List && supplementsRaw.isNotEmpty) {
      _supplements = supplementsRaw
          .whereType<Map>()
          .map((s) => SupplementItem.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    } else {
      _supplements = [];
    }

    _hasProgram = hasAnyData || _todayExercisesCount > 0 || _macroTarget.calories > 0;
  }

  @override
  Widget build(BuildContext context) {
    final clientName = _user?.fullName.isNotEmpty == true ? _user!.fullName : 'كابتن';
    final isMax = _user?.tier.toUpperCase().contains('MAX') == true;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshActiveProgram,
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            children: [
              // ============================================================
              // 1. HEADER: CLEAN EDITORIAL WELCOME & ACCOUNT ACCESS
              // ============================================================
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text(
                            clientName.characters.first,
                            style: const TextStyle(
                              color: AppColors.primaryDeep,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'أهلاً بك،',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            clientName,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.3,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AccountScreen(storage: widget.storage)),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: isMax ? AppColors.maxTint : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(9999),
                        border: Border.all(
                          color: isMax ? AppColors.maxGold : AppColors.primary,
                          width: 1,
                        ),
                        boxShadow: AppColors.softCardShadow,
                      ),
                      child: Text(
                        isMax ? 'MAX' : 'ELITE',
                        style: TextStyle(
                          color: isMax ? AppColors.maxPrimary : AppColors.primaryDeep,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // تنبيه تعديل البرنامج إن وجد
              if (_programChangeSummary != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: AppColors.primaryDeep, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _programChangeSummary!,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.4),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _programChangeSummary = null),
                        child: const Icon(Icons.close, size: 16, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              if (!_hasProgram) ...[
                // حالة عدم وجود خطة نشطة
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border, width: 0.8),
                    boxShadow: AppColors.softCardShadow,
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.fitness_center_outlined, size: 44, color: AppColors.textMuted),
                      const SizedBox(height: 16),
                      const Text(
                        'لا توجد خطة معتمدة حالياً',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _errorMessage ?? 'يقوم المدرب حالياً بمراجعة واعتماد برنامجك المخصص.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.5),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: _refreshActiveProgram,
                        child: const Text('تحديث الصفحة'),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // ============================================================
                // 2. HERO TODAY WORKOUT CARD (TOP PRIORITY)
                // ============================================================
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(26),
                    border: Border.all(color: AppColors.border, width: 0.8),
                    boxShadow: AppColors.heroCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'تمرين اليوم المقرر',
                            style: TextStyle(
                              color: AppColors.primaryDeep,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                          if (_todayExercisesCount > 0)
                            Text(
                              '$_todayExercisesCount تمارين',
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12,
                                fontFamily: 'Alexandria',
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _todayWorkoutName,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.4,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'جلسة رئيسية لزيادة الكتلة والقوة مع تسجيل الأداء الميداني.',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                          height: 1.4,
                          fontFamily: 'Alexandria',
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            widget.onNavigateToTab?.call(1); // الانتقال لتبويب التمارين
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'بدء تمرين اليوم وتسجيل الأوزان',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Alexandria',
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 16, color: Colors.white),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // ============================================================
                // 3. CLEAN EDITORIAL MACRO TARGETS (NO BOXES IN BOXES)
                // ============================================================
                const Text(
                  'الأهداف الغذائية المقررة',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Alexandria',
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(26),
                    border: Border.all(color: AppColors.border, width: 0.8),
                    boxShadow: AppColors.softCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '${_macroTarget.calories}',
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -1,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'سعرة حرارية / اليوم',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              fontFamily: 'Alexandria',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // صف الماكروز الثلاثة بتنفس مريح وتصميم نظيف جداً
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildCleanMacroCol('البروتين', '${_macroTarget.protein}g', const Color(0xFF2563EB)),
                          Container(width: 1, height: 28, color: AppColors.borderLight),
                          _buildCleanMacroCol('الكارب', '${_macroTarget.carbs}g', const Color(0xFFD97706)),
                          Container(width: 1, height: 28, color: AppColors.borderLight),
                          _buildCleanMacroCol('الدهون', '${_macroTarget.fat}g', const Color(0xFFB45309)),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // ============================================================
                // 4. NEXT FOLLOW-UP & HYDRATION (DUAL TILES)
                // ============================================================
                Row(
                  children: [
                    // المتابعة القادمة
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(color: AppColors.border, width: 0.8),
                          boxShadow: AppColors.softCardShadow,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'المتابعة القادمة',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontFamily: 'Alexandria'),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              isMax ? 'كل 7 أيام' : 'كل 14 يوماً',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Alexandria',
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isMax ? 'باقة MAX VIP' : 'باقة ELITE',
                              style: TextStyle(
                                color: isMax ? AppColors.maxPrimary : AppColors.primaryDeep,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Alexandria',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // الترطيب المستهدف
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(color: AppColors.border, width: 0.8),
                          boxShadow: AppColors.softCardShadow,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'الترطيب اليومي',
                              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontFamily: 'Alexandria'),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _macroTarget.waterLiters > 0 ? '${_macroTarget.waterLiters} لتر' : '3.5 - 4.0 لتر',
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Alexandria',
                              ),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'معدل مستهدف ثابت',
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 10,
                                fontFamily: 'Alexandria',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // ============================================================
                // 5. SUPPLEMENTS REFERENCE (CLEAN LIST - READ-ONLY)
                // ============================================================
                if (_supplements.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const Text(
                    'المكملات المقررة',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Alexandria',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border, width: 0.8),
                      boxShadow: AppColors.softCardShadow,
                    ),
                    child: Column(
                      children: _supplements.asMap().entries.map((entry) {
                        final index = entry.key;
                        final sup = entry.value;
                        final isLast = index == _supplements.length - 1;

                        return Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: isLast ? null : const Border(bottom: BorderSide(color: AppColors.borderLight, width: 0.8)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      sup.name,
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Alexandria',
                                      ),
                                    ),
                                    if (sup.timing.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        sup.timing,
                                        style: const TextStyle(
                                          color: AppColors.textMuted,
                                          fontSize: 11,
                                          fontFamily: 'Alexandria',
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceMuted,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  sup.dosage,
                                  style: const TextStyle(
                                    color: AppColors.primaryDeep,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Alexandria',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],

                const SizedBox(height: 32),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCleanMacroCol(String label, String value, Color dotColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: dotColor,
            fontSize: 11,
            fontWeight: FontWeight.w600,
            fontFamily: 'Alexandria',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'Alexandria',
          ),
        ),
      ],
    );
  }
}
