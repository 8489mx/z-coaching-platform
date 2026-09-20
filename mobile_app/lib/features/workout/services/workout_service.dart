import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../models/workout_models.dart';

/// خدمة إدارة التمارين والتسجيل الميداني دون اتصال
class WorkoutService {
  final LocalStorage _storage;

  WorkoutService(this._storage);

  /// استخراج الجلسات التدريبية من البرنامج المخزن محلياً (الأولوية لـ client_view)
  List<WorkoutSession> getSessionsFromProgram(Map<String, dynamic>? programData) {
    if (programData == null) return [];

    // الأولوية لكتلة جلسة اليوم المجهزة على الخادم
    final clientView = programData['client_view'] as Map<String, dynamic>?;
    if (clientView != null && clientView['training_session'] is Map) {
      final sessionMap = Map<String, dynamic>.from(clientView['training_session'] as Map);
      return [WorkoutSession.fromJson(sessionMap, 0)];
    }

    final training = programData['training'] ?? programData['training_program'] ?? programData['workout'] ?? {};
    final rawSessions = training['sessions'] ?? training['days'] ?? training['split'] ?? [];

    List<WorkoutSession> sessions = [];
    if (rawSessions is List) {
      for (int i = 0; i < rawSessions.length; i++) {
        sessions.add(WorkoutSession.fromJson(Map<String, dynamic>.from(rawSessions[i] as Map), i));
      }
    }
    return sessions;
  }

  /// إرسال سجل التمرين إلى مسار تسجيل التمارين بالخادم
  Future<bool> sendWorkoutLog({
    required String userId,
    required String sessionTitle,
    required List<Exercise> exercises,
  }) async {
    final loggedList = exercises
        .where((ex) => ex.loggedWeight != null && ex.loggedLastSetReps != null)
        .map((ex) => {
              'exercise_code': ex.exerciseCode,
              'name': ex.name,
              'weight_kg': ex.loggedWeight,
              'last_set_reps': ex.loggedLastSetReps,
              'effort': ex.loggedEffort,
            })
        .toList();

    final payload = {
      'user_id': userId,
      'session_title': sessionTitle,
      'logged_exercises': loggedList,
      'is_quick_completed': loggedList.isEmpty,
    };

    try {
      final client = ApiClient(_storage);
      final response = await client.post(ApiConstants.logWorkout, payload);
      if (response.isSuccess) {
        return true;
      }
    } catch (_) {}

    // عند فشل الشبكة يتم الحفظ في طابور المزامنة دون اتصال
    await _storage.queuePendingWorkoutLog(payload);
    return false;
  }

  /// للتوافق الخلفي
  Future<void> logCompletedSession({
    required String sessionId,
    required String sessionName,
    required List<Exercise> exercises,
    String? userId,
  }) async {
    await sendWorkoutLog(
      userId: userId ?? 'client',
      sessionTitle: sessionName,
      exercises: exercises,
    );
  }
}
