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
    if (cached != null && cached['nutrition'] is Map && cached['nutrition']['meals'] is List) {
      final rawMeals = cached['nutrition']['meals'] as List;
      _meals = rawMeals.asMap().entries.map((e) => Meal.fromJson(Map<String, dynamic>.from(e.value as Map), e.key)).toList();
    } else {
      // خطة وجبات افتراضية نموذجية للمتدرب
      _meals = [
        Meal(
          id: 'm1',
          name: 'وجبة 1: الإفطار المتوازن',
          time: '08:30 صباحاً',
          items: [
            FoodItem(id: 'f1', name: 'شوفان حبة كاملة', grams: 60, calories: 233, protein: 10.1, carbs: 39.6, fat: 4.1),
            FoodItem(id: 'f2', name: 'بياض بيض مطبوخ', grams: 180, calories: 94, protein: 19.8, carbs: 1.3, fat: 0.4),
            FoodItem(id: 'f3', name: 'زبدة فول سوداني طبيعية', grams: 15, calories: 88, protein: 3.8, carbs: 3.0, fat: 7.5),
          ],
        ),
        Meal(
          id: 'm2',
          name: 'وجبة 2: الغداء (قبل التمرين)',
          time: '02:00 مساءً',
          items: [
            FoodItem(id: 'f4', name: 'صدور دجاج مشوية', grams: 200, calories: 330, protein: 62.0, carbs: 0.0, fat: 7.2),
            FoodItem(id: 'f5', name: 'أرز بسمتي مسلوق', grams: 220, calories: 286, protein: 5.9, carbs: 61.6, fat: 0.7),
            FoodItem(id: 'f6', name: 'زيت زيتون بكر ممتاز', grams: 10, calories: 88, protein: 0.0, carbs: 0.0, fat: 10.0),
          ],
        ),
        Meal(
          id: 'm3',
          name: 'وجبة 3: العشاء والاستشفاء',
          time: '08:30 مساءً',
          items: [
            FoodItem(id: 'f7', name: 'سمك بلطي طازج', grams: 220, calories: 282, protein: 57.2, carbs: 0.0, fat: 5.9),
            FoodItem(id: 'f8', name: 'بطاطا حلوة مشوية', grams: 250, calories: 225, protein: 5.0, carbs: 52.5, fat: 0.5),
          ],
        ),
      ];
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
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _meals.length,
        itemBuilder: (context, mealIndex) {
          final meal = _meals[mealIndex];
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
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
                              ],
                            ),
                          ),
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
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
        },
      ),
    );
  }
}
