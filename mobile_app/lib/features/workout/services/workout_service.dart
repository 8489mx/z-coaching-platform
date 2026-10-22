import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../models/workout_models.dart';

enum WorkoutSubmissionStatus {
  success,
  offlineQueued,
  clinicalLockout,
  serverError,
}

/// نتيجة تفصيلية لعملية تسجيل التمرين الميداني
class WorkoutLogSubmissionResult {
  final WorkoutSubmissionStatus status;
  final String? errorMessage;
  final String? emergencyDirective;

  const WorkoutLogSubmissionResult({
    required this.status,
    this.errorMessage,
    this.emergencyDirective,
  });

  bool get isSuccess => status == WorkoutSubmissionStatus.success;
  bool get isClinicalLockout => status == WorkoutSubmissionStatus.clinicalLockout;
  bool get isOfflineQueued => status == WorkoutSubmissionStatus.offlineQueued;
}

/// خدمة إدارة التمارين والتسجيل الميداني مع الحماية السريرية ودعم الأوفلاين
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

  /// إرسال سجل التمرين مع التحقق السريري وعزل القفل الطبي
  Future<WorkoutLogSubmissionResult> submitWorkoutLog({
    required String userId,
    required String sessionTitle,
    required List<Exercise> exercises,
  }) async {
    // 1. فحص القفل الطبي المخزن محلياً لحساب هذا المتدرب
    final clientLock = _storage.getClientClinicalLockout(userId);
    if (clientLock != null && clientLock['locked'] == true) {
      return WorkoutLogSubmissionResult(
        status: WorkoutSubmissionStatus.clinicalLockout,
        errorMessage: 'تم إيقاف التدريب مؤقتاً لدواعي السلامة السريرية',
        emergencyDirective: clientLock['directive']?.toString(),
      );
    }

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
      'client_timestamp': DateTime.now().toIso8601String(),
    };

    try {
      final client = ApiClient(_storage);
      final response = await client.post(ApiConstants.logWorkout, body: payload);

      if (response.isSuccess) {
        // قبول الخادم يعني فك أي قفل قديم
        await _storage.clearClientClinicalLockout(userId);
        return const WorkoutLogSubmissionResult(status: WorkoutSubmissionStatus.success);
      }

      // رصد الرفض السريري الصريح: HTTP 403 CLINICAL_SAFETY_LOCKOUT
      if (response.statusCode == 403) {
        final data = response.data;
        final isClinicalLockout = data is Map &&
            (data['code'] == 'CLINICAL_SAFETY_LOCKOUT' ||
                data['requires_medical_clearance'] == true);

        if (isClinicalLockout) {
          final directive = data['emergency_directive']?.toString() ??
              data['error']?.toString() ??
              'إيقاف النشاط التدريبي فوراً والرجوع للطبيب المعالج.';
          await _storage.setClientClinicalLockout(
            userId,
            true,
            directive: directive,
            lockedAt: DateTime.now().toIso8601String(),
          );
          // حظر تخزين السجل في طابور الأوفلاين منعاً قاطعاً
          return WorkoutLogSubmissionResult(
            status: WorkoutSubmissionStatus.clinicalLockout,
            errorMessage: data['error']?.toString() ?? 'تم إيقاف التدريب مؤقتاً لدواعي السلامة السريرية',
            emergencyDirective: directive,
          );
        }
      }

      // انقطاع الاتصال الحقيقي بالإنترنت (statusCode == 0): يُحفظ في طابور الأوفلاين
      if (response.statusCode == 0) {
        await _storage.queuePendingWorkoutLog(payload);
        return const WorkoutLogSubmissionResult(status: WorkoutSubmissionStatus.offlineQueued);
      }

      // أخطاء خادم أخرى (400, 500)
      return WorkoutLogSubmissionResult(
        status: WorkoutSubmissionStatus.serverError,
        errorMessage: response.errorMessage ?? 'حدث خطأ في الخادم',
      );
    } catch (_) {
      // استثناء في الشبكة: يُحفظ محلياً
      await _storage.queuePendingWorkoutLog(payload);
      return const WorkoutLogSubmissionResult(status: WorkoutSubmissionStatus.offlineQueued);
    }
  }

  /// إرسال سجل التمرين (دعم التوافق الخلفي)
  Future<bool> sendWorkoutLog({
    required String userId,
    required String sessionTitle,
    required List<Exercise> exercises,
  }) async {
    final result = await submitWorkoutLog(
      userId: userId,
      sessionTitle: sessionTitle,
      exercises: exercises,
    );
    return result.isSuccess;
  }

  /// مزامنة سجلات التمارين المعلقة دون اتصال مع عزل وحماية الحالات الطبية
  Future<Map<String, int>> flushPendingWorkoutLogs() async {
    final pending = _storage.getPendingWorkoutLogs();
    if (pending.isEmpty) return {'uploaded': 0, 'kept': 0, 'locked': 0};

    final remaining = <Map<String, dynamic>>[];
    var uploaded = 0;
    var locked = 0;

    final client = ApiClient(_storage);
    for (final payload in pending) {
      final userId = payload['user_id']?.toString() ?? '';
      // إذا كان المستخدم محظوراً طبياً، لا يُعاد إرسال السجل ويبقى معزولاً
      if (userId.isNotEmpty && _storage.isClientClinicallyLocked(userId)) {
        locked++;
        remaining.add(payload);
        continue;
      }

      final response = await client.post(ApiConstants.logWorkout, body: payload);
      if (response.isSuccess) {
        uploaded++;
      } else if (response.statusCode == 403 &&
          response.data is Map &&
          response.data['code'] == 'CLINICAL_SAFETY_LOCKOUT') {
        final directive = response.data['emergency_directive']?.toString();
        if (userId.isNotEmpty) {
          await _storage.setClientClinicalLockout(userId, true, directive: directive);
        }
        locked++;
        remaining.add(payload);
      } else if (response.statusCode == 0) {
        remaining.add(payload);
      } else {
        remaining.add(payload);
      }
    }

    await _storage.replacePendingWorkoutLogs(remaining);
    return {'uploaded': uploaded, 'kept': remaining.length, 'locked': locked};
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
