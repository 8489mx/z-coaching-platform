/// نماذج خطة التغذية والوجبات اليومية
class DailyMacroTarget {
  final int calories;
  final int protein;
  final int carbs;
  final int fat;
  final double waterLiters;

  DailyMacroTarget({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.waterLiters = 3.5,
  });

  factory DailyMacroTarget.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return DailyMacroTarget(calories: 0, protein: 0, carbs: 0, fat: 0);
    }
    return DailyMacroTarget(
      calories: _toInt(json['calories'] ?? json['target_calories'] ?? 0),
      protein: _toInt(json['protein_g'] ?? json['protein'] ?? 0),
      carbs: _toInt(json['carbs_g'] ?? json['carbs'] ?? 0),
      fat: _toInt(json['fat_g'] ?? json['fats_g'] ?? json['fat'] ?? 0),
      waterLiters: (json['water_liters'] ?? json['hydration_target'] ?? 3.5).toDouble(),
    );
  }

  static int _toInt(dynamic val) {
    if (val is int) return val;
    if (val is double) return val.round();
    return int.tryParse(val?.toString() ?? '0') ?? 0;
  }
}

class FoodItem {
  final String id;
  final String code;
  final String name;
  final double grams;
  final int calories;
  final double protein;
  final double carbs;
  final double fat;
  final String? note;
  final String? fastingSubstitutedFrom;
  final String? fastingNoteAr;
  final bool fastingBlocked;
  final bool isLocked;
  final String? lockReason;
  bool isCompleted;

  FoodItem({
    required this.id,
    this.code = '',
    required this.name,
    required this.grams,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.note,
    this.fastingSubstitutedFrom,
    this.fastingNoteAr,
    this.fastingBlocked = false,
    this.isLocked = false,
    this.lockReason,
    this.isCompleted = false,
  });

  String get imageAsset {
    final lower = name.toLowerCase();
    if (lower.contains('شوفان') && lower.contains('سريع')) return 'assets/food/quick_oats.jpg';
    if (lower.contains('شوفان')) return 'assets/food/oats.jpg';
    if (lower.contains('بيض')) return 'assets/food/eggs.jpg';
    if (lower.contains('دجاج')) return 'assets/food/chicken.jpg';
    if (lower.contains('أرز') || lower.contains('ارز')) return 'assets/food/rice.jpg';
    if (lower.contains('زيت') && lower.contains('خضار')) return 'assets/food/veggies_oil.jpg';
    if (lower.contains('زيت')) return 'assets/food/olive_oil.jpg';
    if (lower.contains('موز')) return 'assets/food/banana.jpg';
    if (lower.contains('سمك') || lower.contains('فيليه')) return 'assets/food/fish.jpg';
    if (lower.contains('لحم') || lower.contains('بقري')) return 'assets/food/beef.jpg';
    if (lower.contains('تونة')) return 'assets/food/tuna.jpg';
    if (lower.contains('قريش')) return 'assets/food/cottage_cheese.jpg';
    if (lower.contains('كينوا')) return 'assets/food/quinoa.jpg';
    if (lower.contains('بطاطا')) return 'assets/food/sweet_potato.jpg';
    if (lower.contains('بطاطس')) return 'assets/food/potato.jpg';
    if (lower.contains('توست')) return 'assets/food/toast_bread.jpg';
    if (lower.contains('طحينة')) return 'assets/food/tahini.jpg';
    return 'assets/food/oats.jpg';
  }

  factory FoodItem.fromJson(Map<String, dynamic> json) {
    final rawName = json['name']?.toString() ?? json['food_name']?.toString() ?? json['name_ar']?.toString() ?? 'عنصر غذائي';
    final bool locked = json['is_locked'] == true ||
        json['locked'] == true ||
        rawName.contains('زيت زيتون') ||
        rawName.contains('خضار مشكل');

    return FoodItem(
      id: json['id']?.toString() ?? json['item_code']?.toString() ?? UniqueKeyHelper.generate(),
      code: json['code']?.toString() ?? json['food_code']?.toString() ?? '',
      name: rawName,
      grams: _toDouble(json['amount'] ?? json['grams'] ?? json['quantity'] ?? 100),
      calories: _toInt(json['cal'] ?? json['calories'] ?? 0),
      protein: _toDouble(json['p'] ?? json['protein'] ?? json['protein_g'] ?? 0),
      carbs: _toDouble(json['c'] ?? json['carbs'] ?? json['carbs_g'] ?? 0),
      fat: _toDouble(json['f'] ?? json['fat'] ?? json['fats_g'] ?? 0),
      note: json['note']?.toString(),
      fastingSubstitutedFrom: json['fasting_substituted_from']?.toString(),
      fastingNoteAr: json['fasting_note_ar']?.toString(),
      fastingBlocked: json['fasting_blocked'] == true,
      isLocked: locked,
      lockReason: json['lock_reason']?.toString() ?? 'صنف أساسي لتوازن الدهون الصحية والألياف ولا يمكن استبداله.',
      isCompleted: json['isCompleted'] == true,
    );
  }

  static double _toDouble(dynamic val) {
    if (val is double) return val;
    if (val is int) return val.toDouble();
    return double.tryParse(val?.toString() ?? '0') ?? 0.0;
  }

  static int _toInt(dynamic val) {
    if (val is int) return val;
    if (val is double) return val.round();
    return int.tryParse(val?.toString() ?? '0') ?? 0;
  }
}

class Meal {
  final String id;
  final String name;
  final String? time;
  final String? ramadanSlot;
  final List<FoodItem> items;
  final String? coachNote;
  bool isCompleted;

  Meal({
    required this.id,
    required this.name,
    this.time,
    this.ramadanSlot,
    required this.items,
    this.coachNote,
    this.isCompleted = false,
  });

  int get totalCalories => items.fold(0, (sum, i) => sum + i.calories);
  double get totalProtein => items.fold(0.0, (sum, i) => sum + i.protein);
  double get totalCarbs => items.fold(0.0, (sum, i) => sum + i.carbs);
  double get totalFat => items.fold(0.0, (sum, i) => sum + i.fat);

  factory Meal.fromJson(Map<String, dynamic> json, int index) {
    final rawItems = json['items'] ?? json['foods'] ?? [];
    List<FoodItem> itemsList = [];
    if (rawItems is List) {
      itemsList = rawItems.map((e) => FoodItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    }

    return Meal(
      id: json['id']?.toString() ?? 'meal_$index',
      name: json['title']?.toString() ?? json['name']?.toString() ?? json['meal_name']?.toString() ?? 'الوجبة ${index + 1}',
      time: json['time']?.toString() ?? json['meal_time']?.toString(),
      ramadanSlot: json['ramadan_slot']?.toString(),
      items: itemsList,
      coachNote: json['coach_note']?.toString() ?? json['note']?.toString() ?? json['instructions']?.toString(),
      isCompleted: json['isCompleted'] == true,
    );
  }
}

class SupplementItem {
  final String name;
  final String dosage;
  final String timing;
  bool isTaken;

  SupplementItem({
    required this.name,
    required this.dosage,
    required this.timing,
    this.isTaken = false,
  });

  factory SupplementItem.fromJson(Map<String, dynamic> json) {
    return SupplementItem(
      name: json['name']?.toString() ?? json['supplement']?.toString() ?? 'مكمل غذائي',
      dosage: json['dosage']?.toString() ?? json['amount']?.toString() ?? 'حصة واحدة',
      timing: json['timing']?.toString() ?? json['instruction']?.toString() ?? 'مع الوجبة الأولى',
      isTaken: json['isTaken'] == true,
    );
  }
}

class UniqueKeyHelper {
  static int _counter = 0;
  static String generate() {
    _counter++;
    return 'item_${DateTime.now().millisecondsSinceEpoch}_$_counter';
  }
}
