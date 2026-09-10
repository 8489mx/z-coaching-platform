/// نماذج التمارين وجلسات التدريب الميداني
class WorkoutSet {
  final int setNumber;
  final String targetReps;
  double? loggedWeight;
  int? loggedReps;
  bool isCompleted;

  WorkoutSet({
    required this.setNumber,
    required this.targetReps,
    this.loggedWeight,
    this.loggedReps,
    this.isCompleted = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'set_number': setNumber,
      'target_reps': targetReps,
      'logged_weight': loggedWeight,
      'logged_reps': loggedReps,
      'is_completed': isCompleted,
    };
  }

  factory WorkoutSet.fromJson(Map<String, dynamic> json) {
    return WorkoutSet(
      setNumber: json['set_number'] ?? 1,
      targetReps: json['target_reps']?.toString() ?? '10-12',
      loggedWeight: (json['logged_weight'] as num?)?.toDouble(),
      loggedReps: json['logged_reps'] as int?,
      isCompleted: json['is_completed'] == true,
    );
  }
}

class Exercise {
  final String id;
  final String name;
  final int targetSets;
  final String targetReps;
  final int restSeconds;
  final String safetyNote;
  final String? videoUrl;
  final List<WorkoutSet> sets;
  bool isDone;
  String? workingWeight;

  Exercise({
    required this.id,
    required this.name,
    required this.targetSets,
    required this.targetReps,
    required this.restSeconds,
    required this.safetyNote,
    this.videoUrl,
    this.sets = const [],
    this.isDone = false,
    this.workingWeight,
  });

  bool get isCompleted => isDone || (sets.isNotEmpty && sets.every((s) => s.isCompleted));

  factory Exercise.fromJson(Map<String, dynamic> json, int index) {
    final numSets = (json['sets'] is int) 
        ? json['sets'] 
        : (int.tryParse(json['sets']?.toString() ?? '') ?? 3);

    final targetRepsStr = json['target_reps']?.toString() ?? 
        json['reps']?.toString() ?? 
        json['reps_target']?.toString() ?? 
        '10-12';

    // بناء الجولات الأولية
    List<WorkoutSet> setsList = [];
    if (json['logged_sets'] is List) {
      setsList = (json['logged_sets'] as List)
          .map((e) => WorkoutSet.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } else {
      for (int i = 1; i <= numSets; i++) {
        setsList.add(WorkoutSet(setNumber: i, targetReps: targetRepsStr));
      }
    }

    return Exercise(
      id: json['id']?.toString() ?? json['exercise_code']?.toString() ?? 'ex_$index',
      name: json['name']?.toString() ?? json['exercise_name']?.toString() ?? json['name_ar']?.toString() ?? 'تمرين مقاومة',
      targetSets: numSets,
      targetReps: targetRepsStr,
      restSeconds: (json['rest_seconds'] as int?) ?? (int.tryParse(json['rest_seconds']?.toString() ?? '') ?? 90),
      safetyNote: json['safety_note']?.toString() ?? json['cue']?.toString() ?? 'التحكم الكامل في مسار الحركة مع النزول البطيء',
      videoUrl: json['video_url']?.toString(),
      sets: setsList,
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

  int get totalCompletedSets => exercises.fold(
        0,
        (sum, ex) => sum + ex.sets.where((s) => s.isCompleted).length,
      );

  int get totalSets => exercises.fold(0, (sum, ex) => sum + ex.sets.length);

  double get completionProgress => totalSets > 0 ? (totalCompletedSets / totalSets) : 0.0;

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
