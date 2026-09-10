import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
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

  DailyMacroTarget _macroTarget = DailyMacroTarget(calories: 2250, protein: 175, carbs: 220, fat: 65, waterLiters: 3.5);
  final int _consumedCalories = 1420;
  final int _consumedProtein = 115;
  final int _consumedCarbs = 140;
  final int _consumedFat = 42;

  final List<SupplementItem> _supplements = [
    SupplementItem(name: 'كرياتين مونوهيدرات', dosage: '5 جرام', timing: 'بعد التمرين مباشرة'),
    SupplementItem(name: 'أوميجا 3', dosage: '2 كبسولة', timing: 'مع وجبة الإفطار'),
    SupplementItem(name: 'فيتامين D3 + K2', dosage: '5000 وحدة', timing: 'مع أول وجبة دهنية'),
  ];

  String _todayWorkoutName = 'صدر وبايسبس - التركيز على القوة';
  int _todayExercisesCount = 5;

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
      final nutrition = _activeProgram!['nutrition'];
      if (nutrition is Map<String, dynamic>) {
        _macroTarget = DailyMacroTarget.fromJson(nutrition['daily_targets'] as Map<String, dynamic>?);
      }

      final training = _activeProgram!['training'];
      if (training is Map && training['sessions'] is List && (training['sessions'] as List).isNotEmpty) {
        final firstSession = (training['sessions'] as List).first;
        if (firstSession is Map) {
          _todayWorkoutName = firstSession['session_name']?.toString() ?? _todayWorkoutName;
          if (firstSession['exercises'] is List) {
            _todayExercisesCount = (firstSession['exercises'] as List).length;
          }
        }
      }
    }

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
    final calProgress = (_consumedCalories / _macroTarget.calories).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            _loadData();
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
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // بطاقة متابعة شرب الماء
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

                // بطاقة المكملات الغذائية اليومية
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
