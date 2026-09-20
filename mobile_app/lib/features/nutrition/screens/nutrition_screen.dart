import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/storage/local_storage.dart';
import '../models/meal_models.dart';

/// شاشة التغذية التفاعلية مع محرك تبديل الأطعمة الذكي
class NutritionScreen extends StatefulWidget {
  final LocalStorage storage;
  const NutritionScreen({super.key, required this.storage});

  @override
  State<NutritionScreen> createState() => _NutritionScreenState();
}

class _NutritionScreenState extends State<NutritionScreen> {
  DailyMacroTarget _macroTarget = DailyMacroTarget(calories: 0, protein: 0, carbs: 0, fat: 0);
  List<Meal> _meals = [];

  // قاعدة بيانات بدائل مبسطة مطابقة لمحرك المنظومة
  final Map<String, List<Map<String, dynamic>>> _smartSwapDatabase = {
    'بروتين': [
      {'name': 'صدور دجاج مشوية', 'factor': 1.0, 'calPer100': 165, 'p': 31, 'c': 0, 'f': 3.6},
      {'name': 'فيليه لحم بقري صافي', 'factor': 0.95, 'calPer100': 190, 'p': 29, 'c': 0, 'f': 8.0},
      {'name': 'سمك بلطي طازج', 'factor': 1.15, 'calPer100': 128, 'p': 26, 'c': 0, 'f': 2.7},
      {'name': 'تونة معلبة مصفاة بالماء', 'factor': 1.1, 'calPer100': 130, 'p': 28, 'c': 0, 'f': 1.0},
      {'name': 'سلمون نرويجي مشوي', 'factor': 0.85, 'calPer100': 208, 'p': 22, 'c': 0, 'f': 13.0},
      {'name': 'بياض بيض مطبوخ', 'factor': 2.4, 'calPer100': 52, 'p': 11, 'c': 0.7, 'f': 0.2},
    ],
    'كارب': [
      {'name': 'أرز بسمتي مسلوق', 'factor': 1.0, 'calPer100': 130, 'p': 2.7, 'c': 28, 'f': 0.3},
      {'name': 'بطاطا حلوة مشوية', 'factor': 1.25, 'calPer100': 90, 'p': 2.0, 'c': 21, 'f': 0.2},
      {'name': 'شوفان حبة كاملة', 'factor': 0.38, 'calPer100': 389, 'p': 16.9, 'c': 66, 'f': 6.9},
      {'name': 'مكرونة حبة كاملة مسلوقة', 'factor': 0.95, 'calPer100': 140, 'p': 5.5, 'c': 29, 'f': 0.9},
      {'name': 'بطاطس مسلوقة', 'factor': 1.4, 'calPer100': 87, 'p': 1.9, 'c': 20, 'f': 0.1},
    ],
    'دهون': [
      {'name': 'زيت زيتون بكر ممتاز', 'factor': 1.0, 'calPer100': 884, 'p': 0, 'c': 0, 'f': 100},
      {'name': 'زبدة فول سوداني طبيعية', 'factor': 1.5, 'calPer100': 588, 'p': 25, 'c': 20, 'f': 50},
      {'name': 'لوز خام غير محمص', 'factor': 1.5, 'calPer100': 579, 'p': 21, 'c': 22, 'f': 50},
      {'name': 'أفوكادو طازج', 'factor': 5.5, 'calPer100': 160, 'p': 2, 'c': 9, 'f': 15},
    ],
  };

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
    setState(() {});
  }

  void _openSwapSheet(Meal meal, FoodItem item) {
    // تحديد نوع الغذاء بناءً على محتواه الغالب
    String category = 'بروتين';
    if (item.carbs > item.protein && item.carbs > item.fat) {
      category = 'كارب';
    } else if (item.fat > item.protein && item.fat > item.carbs) {
      category = 'دهون';
    }

    final candidates = _smartSwapDatabase[category] ?? [];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
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
                    'بدائل ذكية لـ: ${item.name}',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: AppColors.textSecondary),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'يتم احتساب الجرامات المكافئة آلياً للحفاظ على نفس السعرات والماكروز المقررة.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: candidates.length,
                  separatorBuilder: (_, __) => const Divider(color: AppColors.border),
                  itemBuilder: (context, idx) {
                    final cand = candidates[idx];
                    final double factor = (cand['factor'] as num).toDouble();
                    final int newGrams = (item.grams * factor).round();
                    final int newCal = ((newGrams * (cand['calPer100'] as num)) / 100).round();
                    final double newP = ((newGrams * (cand['p'] as num)) / 100);

                    final isCurrent = cand['name'] == item.name;

                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        cand['name'] as String,
                        style: TextStyle(
                          color: isCurrent ? AppColors.primary : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      subtitle: Text(
                        '$newGrams جرام - $newCal سعرة (بروتين: ${newP.toStringAsFixed(1)}g)',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      trailing: isCurrent
                          ? const Text('الصنف الحالي', style: TextStyle(color: AppColors.primary, fontSize: 12))
                          : ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                textStyle: const TextStyle(fontSize: 12),
                              ),
                              onPressed: () {
                                setState(() {
                                  final itemIdx = meal.items.indexOf(item);
                                  if (itemIdx != -1) {
                                    meal.items[itemIdx] = FoodItem(
                                      id: item.id,
                                      name: cand['name'] as String,
                                      grams: newGrams.toDouble(),
                                      calories: newCal,
                                      protein: newP,
                                      carbs: ((newGrams * (cand['c'] as num)) / 100),
                                      fat: ((newGrams * (cand['f'] as num)) / 100),
                                    );
                                  }
                                });
                                Navigator.pop(ctx);
                              },
                              child: const Text('اختيار'),
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('خطة التغذية والوجبات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.primary),
            onPressed: _loadMeals,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_macroTarget.calories > 0) ...[
            Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'الأهداف اليومية للماكروز والسعرات',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildMacroBadge('السعرات', '${_macroTarget.calories}', AppColors.secondary),
                        _buildMacroBadge('البروتين', '${_macroTarget.protein}g', AppColors.primary),
                        _buildMacroBadge('الكارب', '${_macroTarget.carbs}g', AppColors.secondary),
                        _buildMacroBadge('الدهون', '${_macroTarget.fat}g', AppColors.warning),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          ..._meals.map((meal) {
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              child: Padding(
                padding: const EdgeInsets.all(16),
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
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${meal.totalCalories} سعرة',
                            style: const TextStyle(
                              color: AppColors.secondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: AppColors.border),
                    const SizedBox(height: 8),

                    // قائمة أصناف الوجبة
                    ...meal.items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: const TextStyle(
                                      color: AppColors.textPrimary,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${item.grams.round()}g | ${item.calories} سعرة (ب: ${item.protein.round()}g، ك: ${item.carbs.round()}g، د: ${item.fat.round()}g)',
                                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                                  ),
                                  if (item.fastingNoteAr != null && item.fastingNoteAr!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.backgroundDeep,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppColors.border),
                                      ),
                                      child: Text(
                                        item.fastingNoteAr!,
                                        style: const TextStyle(color: AppColors.secondary, fontSize: 11),
                                      ),
                                    ),
                                  ] else if (item.fastingSubstitutedFrom != null && item.fastingSubstitutedFrom!.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.backgroundDeep,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: AppColors.border),
                                      ),
                                      child: Text(
                                        'بديل من: ${item.fastingSubstitutedFrom}',
                                        style: const TextStyle(color: AppColors.secondary, fontSize: 11),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                side: const BorderSide(color: AppColors.primary, width: 0.8),
                              ),
                              onPressed: () => _openSwapSheet(meal, item),
                              icon: const Icon(Icons.swap_horiz, size: 16, color: AppColors.primary),
                              label: const Text(
                                'تبديل',
                                style: TextStyle(color: AppColors.primary, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildMacroBadge(String label, String val, Color color) {
    return Column(
      children: [
        Text(val, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
      ],
    );
  }
}
