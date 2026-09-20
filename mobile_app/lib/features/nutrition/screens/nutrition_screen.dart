import 'package:flutter/material.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../models/meal_models.dart';

/// شاشة التغذية التفاعلية مع محرك تبديل الأطعمة
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
    setState(() {});
  }

  void _openSwapSheet(Meal meal, FoodItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
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
        {
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
        {
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
                'بدائل لـ: ${widget.item.name}',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppColors.textSecondary),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'البدائل المقررة من الخادم للحفاظ على نفس التوازن الغذائي.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
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
                separatorBuilder: (_, __) => const Divider(color: AppColors.border),
                itemBuilder: (context, idx) {
                  final cand = _candidates[idx];
                  final name = cand['name_ar']?.toString() ?? cand['display_ar']?.toString() ?? '';
                  final display = cand['display_ar']?.toString() ?? cand['serving_display_ar']?.toString() ?? name;
                  final targetGrams = cand['target_grams'] ?? cand['portion_g'];

                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      name,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    subtitle: Text(
                      display.isNotEmpty ? display : (targetGrams != null ? '$targetGrams جرام' : ''),
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                    ),
                    trailing: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        textStyle: const TextStyle(fontSize: 12),
                      ),
                      onPressed: () => _applySwap(cand),
                      child: const Text('اختيار'),
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
