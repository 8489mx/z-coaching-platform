/// نماذج التمارين وجلسات التدريب الميداني
class Exercise {
  final String id;
  final String exerciseCode;
  final String name;
  final String? nameEn;
  final String? imageUrl;
  final String? swapName;
  final int targetSets;
  final String targetReps;
  final int? targetRir;
  final int restSeconds;
  final String cue;
  final String? videoUrl;

  // حالة التسجيل الميداني الذكي (بطاقة تسجيل واحدة لكل تمرين)
  double? loggedWeight;
  int? loggedLastSetReps;
  String loggedEffort; // 'OK', 'EASY', 'HARD'
  bool isCompleted;

  Exercise({
    required this.id,
    required this.exerciseCode,
    required this.name,
    this.nameEn,
    this.imageUrl,
    this.swapName,
    required this.targetSets,
    required this.targetReps,
    this.targetRir,
    required this.restSeconds,
    required this.cue,
    this.videoUrl,
    this.loggedWeight,
    this.loggedLastSetReps,
    this.loggedEffort = 'OK',
    this.isCompleted = false,
  });

  factory Exercise.fromJson(Map<String, dynamic> json, int index) {
    final numSets = (json['sets'] is int)
        ? json['sets']
        : (int.tryParse(json['sets']?.toString() ?? '') ?? 3);

    final targetRepsStr = json['target_reps']?.toString() ??
        json['reps']?.toString() ??
        json['reps_target']?.toString() ??
        '10-12';

    final targetRirVal = (json['target_rir'] is int)
        ? json['target_rir']
        : int.tryParse(json['target_rir']?.toString() ?? '');

    final code = json['exercise_code']?.toString() ?? json['id']?.toString() ?? 'ex_$index';
    final nameStr = json['name']?.toString() ?? json['exercise_name']?.toString() ?? json['name_ar']?.toString() ?? code;
    final nameEnStr = json['name_en']?.toString() ?? json['exercise_name_en']?.toString();
    final imgStr = json['image_url']?.toString() ?? json['image_stretch']?.toString() ?? json['thumbnail']?.toString();
    final swapStr = json['swap_name']?.toString() ?? json['alternative_name']?.toString();

    return Exercise(
      id: code,
      exerciseCode: code,
      name: nameStr,
      nameEn: nameEnStr,
      imageUrl: imgStr,
      swapName: swapStr,
      targetSets: numSets,
      targetReps: targetRepsStr,
      targetRir: targetRirVal,
      restSeconds: (json['rest_seconds'] as int?) ?? (int.tryParse(json['rest_seconds']?.toString() ?? '') ?? 90),
      cue: json['cue']?.toString() ?? json['safety_note']?.toString() ?? 'التحكم الكامل في مسار الحركة مع النزول المتزن',
      videoUrl: json['video_url']?.toString(),
    );
  }
}

class WorkoutSession {
  final String id;
  final String dayName;
  final String warmupProtocol;
  final List<Exercise> exercises;
  bool isCompleted;

  WorkoutSession({
    required this.id,
    required this.dayName,
    required this.warmupProtocol,
    required this.exercises,
    this.isCompleted = false,
  });

  int get completedExercisesCount => exercises.where((e) => e.isCompleted).length;
  double get completionProgress => exercises.isNotEmpty ? (completedExercisesCount / exercises.length) : 0.0;

  factory WorkoutSession.fromJson(Map<String, dynamic> json, int index) {
    final rawExercises = json['exercises'] ?? [];
    List<Exercise> exList = [];
    if (rawExercises is List) {
      for (int i = 0; i < rawExercises.length; i++) {
        exList.add(Exercise.fromJson(Map<String, dynamic>.from(rawExercises[i] as Map), i));
      }
    }

    return WorkoutSession(
      id: json['id']?.toString() ?? 'session_$index',
      dayName: json['session_name']?.toString() ?? json['name']?.toString() ?? json['day_name']?.toString() ?? 'اليوم التدريبي ${index + 1}',
      warmupProtocol: json['warmup_protocol']?.toString() ?? 'إحماء عام 5 دقائق + إطالات ديناميكية وتفعيل للمفاصل',
      exercises: exList,
      isCompleted: json['isCompleted'] == true,
    );
  }
}
