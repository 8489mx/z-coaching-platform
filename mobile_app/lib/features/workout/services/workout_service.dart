import '../../../core/storage/local_storage.dart';
import '../models/workout_models.dart';

/// خدمة إدارة التمارين والتسجيل الميداني دون اتصال
class WorkoutService {
  final LocalStorage _storage;

  WorkoutService(this._storage);

  /// استخراج الجلسات التدريبية من البرنامج المخزن محلياً
  List<WorkoutSession> getSessionsFromProgram(Map<String, dynamic>? programData) {
    if (programData == null) return [];

    final training = programData['training'] ?? programData['workout'] ?? {};
    final rawSessions = training['sessions'] ?? training['days'] ?? training['split'] ?? [];

    List<WorkoutSession> sessions = [];
    if (rawSessions is List) {
      for (int i = 0; i < rawSessions.length; i++) {
        sessions.add(WorkoutSession.fromJson(Map<String, dynamic>.from(rawSessions[i] as Map), i));
      }
    }
    return sessions;
  }

  /// حفظ جلسة تمرين مكتملة في طابور المزامنة دون اتصال
  Future<void> logCompletedSession({
    required String sessionId,
    required String sessionName,
    required List<Exercise> exercises,
  }) async {
    final payload = {
      'session_id': sessionId,
      'session_name': sessionName,
      'timestamp': DateTime.now().toIso8601String(),
      'exercises': exercises.map((ex) => {
        'id': ex.id,
        'name': ex.name,
        'sets': ex.sets.map((s) => s.toJson()).toList(),
      }).toList(),
    };

    await _storage.queuePendingWorkoutLog(payload);
  }
}
