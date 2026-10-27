import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../models/meal_models.dart';

/// شاشة التغذية والوجبات اليومية (Nutrition Hub)
/// تصميم Light Mode هادئ مع حفظ التبديلات اليومية محلياً دون المساس بالخطة الأصلية
class NutritionScreen extends StatefulWidget {
  final LocalStorage storage;
  const NutritionScreen({super.key, required this.storage});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  DailyMacroTarget _macroTarget = DailyMacroTarget(calories: 0, protein: 0, carbs: 0, fat: 0);
  List<Meal> _meals = [];

  @override
  void initState() {
    super.initState();
    _loadMeals();
  }

  void _loadMeals() {
    final cached = widget.storage.getCachedActiveProgram();
    if (cached != null) {
      final clientView = cached['client_view'] as Map<String, dynamic>?;
      if (clientView != null) {
        if (clientView['target_macros'] is Map) {
          _macroTarget = DailyMacroTarget.fromJson(Map<String, dynamic>.from(clientView['target_macros'] as Map));
        }
        if (clientView['meals'] is List) {
          final rawMeals = clientView['meals'] as List;
          _meals = rawMeals.asMap().entries.map((e) => Meal.fromJson(Map<String, dynamic>.from(e.value as Map), e.key)).toList();
        }
      } else if (cached['nutrition'] is Map && cached['nutrition']['meals'] is List) {
        final rawMeals = cached['nutrition']['meals'] as List;
        _meals = rawMeals.asMap().entries.map((e) => Meal.fromJson(Map<String, dynamic>.from(e.value as Map), e.key)).toList();
        final targets = cached['nutrition']['targets'] ?? cached['nutrition']['daily_targets'];
        if (targets is Map) {
          _macroTarget = DailyMacroTarget.fromJson(Map<String, dynamic>.from(targets as Map));
        }
      }
    }

    // تطبيق التبديلات المحلية المحفوظة لليوم فقط
    _applySavedDailySwaps();

    setState(() {});
  }

  String _getTodaySwapsKey() {
    final now = DateTime.now().toIso8601String().substring(0, 10);
    return 'z_local_swaps_$now';
  }

  void _applySavedDailySwaps() {
    try {
      final raw = widget.storage.getClientData()?[_getTodaySwapsKey()];
      if (raw is Map) {
        for (final meal in _meals) {
          for (int i = 0; i < meal.items.length; i++) {
            final originalId = meal.items[i].id;
            if (raw.containsKey(originalId) && raw[originalId] is Map) {
              meal.items[i] = FoodItem.fromJson(Map<String, dynamic>.from(raw[originalId] as Map));
            }
          }
        }
      }
    } catch (_) {}
  }

  Future<void> _persistDailySwap(String originalItemId, FoodItem swappedItem) async {
    try {
      final clientData = widget.storage.getClientData() ?? {};
      final key = _getTodaySwapsKey();
      final existingSwaps = clientData[key] is Map ? Map<String, dynamic>.from(clientData[key] as Map) : <String, dynamic>{};

      existingSwaps[originalItemId] = {
        'id': swappedItem.id,
        'code': swappedItem.code,
        'name': swappedItem.name,
        'grams': swappedItem.grams,
        'calories': swappedItem.calories,
        'protein': swappedItem.protein,
        'carbs': swappedItem.carbs,
        'fat': swappedItem.fat,
      };

      clientData[key] = existingSwaps;
      await widget.storage.saveClientData(clientData);
    } catch (_) {}
  }

  void _openSwapSheet(Meal meal, FoodItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return _SwapSheetContent(
          storage: widget.storage,
          item: item,
          onSwapSelected: (FoodItem swappedItem) {
            setState(() {
              final itemIdx = meal.items.indexOf(item);
              if (itemIdx != -1) {
                meal.items[itemIdx] = swappedItem;
              }
            });
            _persistDailySwap(item.id, swappedItem);
            Navigator.pop(ctx);
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('خطة التغذية والوجبات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primaryDeep),
            onPressed: _loadMeals,
          ),
        ],
      ),
      body: _meals.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.restaurant_outlined, size: 48, color: AppColors.textMuted),
                    const SizedBox(height: 16),
                    const Text(
                      'لا توجد وجبات مسجلة حالياً. يرجى مراجعة المدرب لاعتماد خطتك.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: _loadMeals,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            )
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              children: [
                // بطاقة إجمالي الأهداف اليومية المقررة
                if (_macroTarget.calories > 0) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border),
                      boxShadow: AppColors.softCardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'الأهداف اليومية المقررة',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildMacroPill('السعرات', '${_macroTarget.calories}', AppColors.textPrimary, AppColors.background),
                            _buildMacroPill('البروتين', '${_macroTarget.protein}g', const Color(0xFF2563EB), const Color(0xFFEFF6FF)),
                            _buildMacroPill('الكارب', '${_macroTarget.carbs}g', const Color(0xFFD97706), const Color(0xFFFFFBEB)),
                            _buildMacroPill('الدهون', '${_macroTarget.fat}g', const Color(0xFFB45309), const Color(0xFFFEF3C7)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],

                // بطاقات الوجبات اليومية
                ..._meals.map((meal) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.border),
                      boxShadow: AppColors.softCardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // رأس الوجبة
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  meal.name,
                                  style: const TextStyle(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                if (meal.time != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    meal.time!,
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                                  ),
                                ],
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.secondaryTint,
                                borderRadius: BorderRadius.circular(9999),
                              ),
                              child: Text(
                                '${meal.totalCalories} سعرة',
                                style: const TextStyle(
                                  color: AppColors.primaryDeep,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: AppColors.borderLight, height: 1),
                        const SizedBox(height: 10),

                        // أصناف الوجبة بهوية Apple Health الهادئة
                        ...meal.items.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final item = entry.value;
                          final isLast = idx == meal.items.length - 1;
                          return Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildFoodItemRow(meal, item),
                              if (!isLast)
                                const Divider(
                                  color: Color(0xFFF2F2F7),
                                  height: 1,
                                  indent: 62,
                                ),
                            ],
                          );
                        }),

                        // صندوق ملاحظة المدرب المخفف إن وجدت
                        if (meal.coachNote != null && meal.coachNote!.trim().isNotEmpty)
                          _buildCoachNote(meal.coachNote!.trim()),
                      ],
                    ),
                  );
                }),

                // تنبيه استرشادي طبي وإخلاء مسؤولية
                Container(
                  margin: const EdgeInsets.only(top: 8, bottom: 24),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline, size: 16, color: AppColors.textMuted),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'تنبيه استرشادي: القيم الغذائية والخطط مقدمة لتحسين اللياقة البدنية والنمط الرياضي، وليست تشخيصاً أو بديلاً عن الاستشارة الطبية. استشر طبيبك المختص قبل البدء بأي حمية غذائية جديدة.',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.45),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildFoodItemRow(Meal meal, FoodItem item) {
    // تنسيق سطر الماكروز الهادئ الموحد بدون أي كبسولات ملونة
    final List<String> macroParts = [];
    if (item.name.contains('زيت') || item.name.contains('طحينة')) {
      macroParts.add('دهون صحية ${item.fat.round()}g');
      if (item.carbs > 0) macroParts.add('كارب ${item.carbs.round()}g');
      if (item.protein > 0) macroParts.add('بروتين ${item.protein.round()}g');
    } else {
      if (item.protein > 0) macroParts.add('بروتين ${item.protein.round()}g');
      if (item.carbs > 0) macroParts.add('كارب ${item.carbs.round()}g');
      if (item.fat > 0) macroParts.add('دهون ${item.fat.round()}g');
    }
    final macroText = macroParts.isEmpty ? '${item.calories} سعرة' : macroParts.join('  ·  ');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // صورة الصنف الموحدة بدقة 50x50 مع زوايا منحنية 13px
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFF2F2F7),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: const Color(0xFFE5E5EA)),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(13),
              child: Image.asset(
                item.imageAsset,
                width: 50,
                height: 50,
                fit: BoxFit.cover,
                errorBuilder: (ctx, err, stack) => const Center(
                  child: Icon(Icons.restaurant, size: 20, color: Color(0xFF8E8E93)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // التسلسل البصري الصارم: اسم الطعام ثم الكمية والسعرات ثم الماكروز الهادئة
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  item.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF1C1C1E),
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '${item.grams.round()} جم',
                      style: const TextStyle(
                        color: Color(0xFF007AFF),
                        fontWeight: FontWeight.bold,
                        fontSize: 12.5,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      '•',
                      style: TextStyle(color: Color(0xFFD1D5DB), fontSize: 10),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${item.calories} سعرة',
                      style: const TextStyle(
                        color: Color(0xFF8E8E93),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  macroText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF8E8E93),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (item.note != null && item.note!.trim().isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    item.note!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),

          // زر التبديل أو شارة الصنف الأساسي
          if (item.isLocked)
            InkWell(
              onTap: () => _showLockedFoodSheet(item),
              borderRadius: BorderRadius.circular(9999),
              child: Container(
                height: 30,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(9999),
                  border: Border.all(color: const Color(0xFFE5E5EA)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock_outline, size: 13, color: Color(0xFF8E8E93)),
                    SizedBox(width: 4),
                    Text(
                      'أساسي',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            InkWell(
              onTap: () => _openSwapSheet(meal, item),
              borderRadius: BorderRadius.circular(9999),
              child: Container(
                height: 30,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F2F7),
                  borderRadius: BorderRadius.circular(9999),
                  border: Border.all(color: const Color(0xFFE5E5EA)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.swap_horiz, size: 14, color: Color(0xFF007AFF)),
                    SizedBox(width: 4),
                    Text(
                      'تبديل',
                      style: TextStyle(
                        color: Color(0xFF007AFF),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCoachNote(String note) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 14, color: Color(0xFF8E8E93)),
          const SizedBox(width: 6),
          Expanded(
            child: RichText(
              text: TextSpan(
                children: [
                  const TextSpan(
                    text: 'ملاحظة: ',
                    style: TextStyle(
                      color: Color(0xFF334155),
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                  TextSpan(
                    text: note,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 11,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showLockedFoodSheet(FoodItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(9999),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: const Icon(Icons.lock, size: 14, color: Color(0xFFD97706)),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'صنف أساسي',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'الصنف:',
                        style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.name,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFFEF3C7)),
                  ),
                  child: Text(
                    item.lockReason ?? 'صنف أساسي لتوازن الدهون الصحية والألياف ولا يمكن استبداله.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF92400E),
                      height: 1.4,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1C1C1E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('حسناً', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMacroPill(String label, String value, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: textColor.withValues(alpha: 0.8), fontSize: 11)),
        ],
      ),
    );
  }
}

class _SwapSheetContent extends StatefulWidget {
  final LocalStorage storage;
  final FoodItem item;
  final ValueChanged<FoodItem> onSwapSelected;

  const _SwapSheetContent({
    required this.storage,
    required this.item,
    required this.onSwapSelected,
  });

  @override
  State<_SwapSheetContent> createState() => _SwapSheetContentState();
}

class _SwapSheetContentState extends State<_SwapSheetContent> {
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _candidates = [];

  @override
  void initState() {
    super.initState();
    _fetchCandidates();
  }

  Future<void> _fetchCandidates() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final client = ApiClient(widget.storage);
      final response = await client.post(
        ApiConstants.swapCandidates,
        body: {
          'food_code': widget.item.code.isNotEmpty ? widget.item.code : widget.item.id,
          'name_ar': widget.item.name,
          'source_grams': widget.item.grams,
        },
      );

      if (response.isSuccess && response.data is Map && response.data['candidates'] is List) {
        final list = response.data['candidates'] as List;
        _candidates = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      } else {
        _error = 'لا تتوفر بدائل مسجلة لهذا الصنف حالياً';
      }
    } catch (_) {
      _error = 'تعذر الاتصال بالخادم لجلب البدائل';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _applySwap(Map<String, dynamic> candidate) async {
    final candCode = candidate['food_code']?.toString() ?? '';
    if (candCode.isEmpty) return;

    try {
      final client = ApiClient(widget.storage);
      final response = await client.post(
        ApiConstants.swapFood,
        body: {
          'current_food_code': widget.item.code.isNotEmpty ? widget.item.code : widget.item.id,
          'current_portion_g': widget.item.grams,
          'target_food_code': candCode,
        },
      );

      if (response.isSuccess && response.data is Map) {
        final data = response.data;
        final swapped = data['swapped_food'] as Map<String, dynamic>?;
        final target = data['swap']?['target_food'] as Map<String, dynamic>?;

        final newGrams = ((swapped?['grams'] ?? target?['portion_g'] ?? candidate['target_grams'] ?? widget.item.grams) as num).toDouble();
        final newName = swapped?['name_ar']?.toString() ?? candidate['name_ar']?.toString() ?? widget.item.name;
        final newCal = ((target?['calories'] ?? 0) as num).round();
        final newP = ((target?['protein_g'] ?? 0) as num).toDouble();
        final newC = ((target?['carbs_g'] ?? target?['carbohydrate_g'] ?? 0) as num).toDouble();
        final newF = ((target?['fats_g'] ?? target?['fat_g'] ?? 0) as num).toDouble();

        final newItem = FoodItem(
          id: widget.item.id,
          code: candCode,
          name: newName,
          grams: newGrams,
          calories: newCal,
          protein: newP,
          carbs: newC,
          fat: newF,
        );

        widget.onSwapSelected(newItem);
        if (mounted) Navigator.of(context).pop();
      } else {
        final data = response.data;
        final err = (data is Map ? (data['message_ar'] ?? data['error'] ?? data['message']) : null)?.toString() ?? response.errorMessage ?? 'تعذر استبدال هذا الصنف';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(err, style: const TextStyle(fontWeight: FontWeight.w600)),
              backgroundColor: const Color(0xFFDC2626),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'بدائل معتمدة لـ: ${widget.item.name}',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'البدائل المحسوبة مكافئة للسعرات والمغذيات لليوم فقط دون تغيير خطتك الأساسية.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 16),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
            )
          else if (_error != null || _candidates.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  _error ?? 'لا تتوفر بدائل مسجلة لهذا الصنف حالياً',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              ),
            )
          else
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _candidates.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, idx) {
                  final cand = _candidates[idx];
                  final name = cand['name_ar']?.toString() ?? cand['display_ar']?.toString() ?? '';
                  final display = cand['display_ar']?.toString() ?? cand['serving_display_ar']?.toString() ?? name;
                  final targetGrams = cand['target_grams'] ?? cand['portion_g'];

                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                  color: Color(0xFF1C1C1E),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13.5,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                display.isNotEmpty ? display : (targetGrams != null ? '$targetGrams جرام' : ''),
                                style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11.5),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF007AFF),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9999)),
                          ),
                          onPressed: () => _applySwap(cand),
                          child: const Text('اختيار', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
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
  }
}
