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
      return DailyMacroTarget(calories: 2200, protein: 160, carbs: 220, fat: 65);
    }
    return DailyMacroTarget(
      calories: _toInt(json['calories'] ?? json['target_calories'] ?? 2200),
      protein: _toInt(json['protein'] ?? json['protein_g'] ?? 160),
      carbs: _toInt(json['carbs'] ?? json['carbs_g'] ?? 220),
      fat: _toInt(json['fat'] ?? json['fats_g'] ?? json['fat_g'] ?? 65),
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
  final String name;
  final double grams;
  final int calories;
  final double protein;
  final double carbs;
  final double fat;
  final String? note;
  bool isCompleted;

  FoodItem({
    required this.id,
    required this.name,
    required this.grams,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.note,
    this.isCompleted = false,
  });

  factory FoodItem.fromJson(Map<String, dynamic> json) {
    return FoodItem(
      id: json['id']?.toString() ?? json['item_code']?.toString() ?? UniqueKeyHelper.generate(),
      name: json['name']?.toString() ?? json['food_name']?.toString() ?? json['name_ar']?.toString() ?? 'عنصر غذائي',
      grams: _toDouble(json['grams'] ?? json['quantity'] ?? json['amount'] ?? 100),
      calories: _toInt(json['calories'] ?? 0),
      protein: _toDouble(json['protein'] ?? json['protein_g'] ?? 0),
      carbs: _toDouble(json['carbs'] ?? json['carbs_g'] ?? 0),
      fat: _toDouble(json['fat'] ?? json['fats_g'] ?? 0),
      note: json['note']?.toString(),
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
  final List<FoodItem> items;
  bool isCompleted;

  Meal({
    required this.id,
    required this.name,
    this.time,
    required this.items,
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
      name: json['name']?.toString() ?? json['meal_name']?.toString() ?? 'الوجبة ${index + 1}',
      time: json['time']?.toString() ?? json['meal_time']?.toString(),
      items: itemsList,
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
