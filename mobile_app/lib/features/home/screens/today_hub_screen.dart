import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../auth/models/client_user.dart';
import '../../nutrition/models/meal_models.dart';
import '../../notifications/models/notification_item.dart';
import '../../notifications/services/notification_service.dart';

/// شاشة اليوم التفاعلية (Today Hub)
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
  int _unreadNotificationsCount = 0;

  DailyMacroTarget _macroTarget = DailyMacroTarget(calories: 0, protein: 0, carbs: 0, fat: 0, waterLiters: 0.0);
  int _consumedCalories = 0;
  int _consumedProtein = 0;
  int _consumedCarbs = 0;
  int _consumedFat = 0;

  List<SupplementItem> _supplements = [];

  String _todayWorkoutName = 'لا توجد جلسة محددة لليوم';
  int _todayExercisesCount = 0;
  bool _hasProgram = false;
  bool _isLoading = false;
  String? _errorMessage;

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
            _unreadNotificationsCount = notifs.where((n) => !n.isRead).length;
          });
        }
      });
    }

    setState(() {});
  }

  /// يجلب البرنامج النشط للمتدرب المسجل من الخادم (GET /api/v1/programs/active) ويحفظه للعمل دون اتصال.
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
          _errorMessage = 'حدث خطأ أثناء تحميل الخطة. يرجى التحقق من اتصال الإنترنت أو مراجعة المدرب.';
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

    // 3. المكملات المقررة من الخادم
    final supplementsRaw = program['supplements'] ?? (program['master_program'] is Map ? (program['master_program'] as Map)['supplements'] : null);
    if (supplementsRaw is List && supplementsRaw.isNotEmpty) {
      _supplements = supplementsRaw
          .whereType<Map>()
          .map((s) => SupplementItem.fromJson(Map<String, dynamic>.from(s)))
          .toList();
    } else {
      _supplements = [];
    }

    _hasProgram = hasAnyData;
  }

  void _showNotificationsSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'صندوق التنبيهات والإشعارات',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (_unreadNotificationsCount > 0)
                        TextButton(
                          onPressed: () async {
                            if (_user != null) {
                              await _notificationService.markAsRead(_user!.clientCode);
                              if (mounted) {
                                setState(() {
                                  _unreadNotificationsCount = 0;
                                  _notifications = _notifications.map((n) => NotificationItem(
                                    id: n.id,
                                    clientCode: n.clientCode,
                                    title: n.title,
                                    body: n.body,
                                    isRead: true,
                                    createdAt: n.createdAt,
                                    payload: n.payload,
                                  )).toList();
                                });
                                setSheetState(() {});
                              }
                            }
                          },
                          child: const Text('تحديد الكل كمقروء', style: TextStyle(color: AppColors.primary, fontSize: 12)),
                        ),
                    ],
                  ),
                  const Divider(color: AppColors.border),
                  const SizedBox(height: 8),
                  if (_notifications.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 30),
                      child: Center(
                        child: Text(
                          'لا توجد إشعارات جديدة حالياً',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ),
                      ),
                    )
                  else
                    Flexible(
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: _notifications.length,
                        separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                        itemBuilder: (context, idx) {
                          final item = _notifications[idx];
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 0),
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: item.isRead ? AppColors.backgroundDeep : AppColors.primaryLight,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                item.isRead ? Icons.notifications_none : Icons.notifications_active,
                                color: item.isRead ? AppColors.textMuted : AppColors.primary,
                                size: 20,
                              ),
                            ),
                            title: Text(
                              item.title,
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                fontWeight: item.isRead ? FontWeight.normal : FontWeight.bold,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 2),
                                Text(
                                  item.body,
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final clientName = _user?.fullName ?? 'بطل Z Coaching';
    final tier = _user?.subscriptionTier ?? 'MAX';
    final calProgress = _macroTarget.calories > 0
        ? (_consumedCalories / _macroTarget.calories).clamp(0.0, 1.0)
        : 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await _refreshActiveProgram();
          },
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // رأس الصفحة وبيانات المشترك
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'أهلاً بك، $clientName',
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'الجدول اليومي والأهداف المحددة',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Stack(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
                              onPressed: _showNotificationsSheet,
                            ),
                            if (_unreadNotificationsCount > 0)
                              Positioned(
                                right: 8,
                                top: 8,
                                child: Container(
                                  padding: const EdgeInsets.all(3),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFEF4444),
                                    shape: BoxShape.circle,
                                  ),
                                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                  child: Text(
                                    '$_unreadNotificationsCount',
                                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.primary, width: 1.2),
                          ),
                          child: Text(
                            'باقة $tier',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                if (!_hasProgram) ...[
                  Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.assignment_outlined, size: 52, color: AppColors.textMuted),
                        const SizedBox(height: 16),
                        const Text(
                          'لا توجد خطة نشطة حالياً',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _errorMessage ?? 'يرجى تحديث الصفحة أو مراجعة المدرب لتفعيل خطتك التدريبية والغذائية.',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _refreshActiveProgram,
                          icon: const Icon(Icons.refresh, size: 18),
                          label: const Text('تحديث الصفحة'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  // بطاقة السعرات والماكروز اليومية
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'السعرات الحرارية اليومية',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              '$_consumedCalories / ${_macroTarget.calories} سعرة',
                              style: const TextStyle(
                                color: AppColors.secondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: LinearProgressIndicator(
                            value: calProgress,
                            minHeight: 10,
                            backgroundColor: AppColors.surfaceLight,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: AppColors.border),
                        const SizedBox(height: 12),

                        // الماكروز الثلاثة
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildMacroItem('البروتين', '$_consumedProtein / ${_macroTarget.protein}g', AppColors.primary),
                            _buildMacroItem('الكارب', '$_consumedCarbs / ${_macroTarget.carbs}g', AppColors.secondary),
                            _buildMacroItem('الدهون', '$_consumedFat / ${_macroTarget.fat}g', AppColors.warning),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // بطاقة تمرين اليوم
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.fitness_center, color: AppColors.primary, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'تمرين اليوم',
                                  style: TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                              ],
                            ),
                            if (_todayExercisesCount > 0)
                              Text(
                                '$_todayExercisesCount تمارين',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                              ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          _todayWorkoutName,
                          style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            widget.onNavigateToTab?.call(2); // التوجه لتبويب التمرين
                          },
                          icon: const Icon(Icons.play_arrow, size: 18),
                          label: const Text('بدء جلسة التمرين الآن وتسجيل الأوزان'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(46),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // بطاقة متابعة شرب الماء
                  if (_macroTarget.waterLiters > 0) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.water_drop_outlined, color: AppColors.secondary, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'شرب الماء والترطيب',
                                    style: TextStyle(
                                      color: AppColors.textPrimary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                '${_macroTarget.waterLiters} لتر/اليوم',
                                style: const TextStyle(
                                  color: AppColors.secondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'المعدل الاسترشادي الثابت للحفاظ على الترطيب والوظائف الفسيولوجية للجسم',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // بطاقة المكملات الغذائية اليومية
                  if (_supplements.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.medication_outlined, color: AppColors.warning, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'المكملات المقررة اليوم',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ..._supplements.map((sup) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(
                                  sup.name,
                                  style: TextStyle(
                                    color: sup.isTaken ? AppColors.textMuted : AppColors.textPrimary,
                                    decoration: sup.isTaken ? TextDecoration.lineThrough : null,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  '${sup.dosage} - ${sup.timing}',
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                ),
                                value: sup.isTaken,
                                activeColor: AppColors.primary,
                                onChanged: (val) {
                                  setState(() {
                                    sup.isTaken = val ?? false;
                                  });
                                },
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  ],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMacroItem(String title, String value, Color color) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ],
    );
  }
}
