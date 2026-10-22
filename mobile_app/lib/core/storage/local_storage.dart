import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

/// وحدة التخزين المحلي الآمن لدعم العمل الميداني دون اتصال (Offline Mode)
class LocalStorage {
  static LocalStorage? _instance;
  static SharedPreferences? _prefs;

  LocalStorage._();

  static Future<LocalStorage> getInstance() async {
    if (_instance == null) {
      _instance = LocalStorage._();
      _prefs = await SharedPreferences.getInstance();
    }
    return _instance!;
  }

  // --- إدارة الجلسة والتوثيق (Auth & Session) ---

  Future<void> saveToken(String token) async {
    await _prefs?.setString(ApiConstants.tokenKey, token);
  }

  String? getToken() {
    return _prefs?.getString(ApiConstants.tokenKey);
  }

  Future<void> saveClientData(Map<String, dynamic> clientData) async {
    await _prefs?.setString(ApiConstants.clientDataKey, jsonEncode(clientData));
  }

  Map<String, dynamic>? getClientData() {
    final raw = _prefs?.getString(ApiConstants.clientDataKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> clearSession() async {
    await _prefs?.remove(ApiConstants.tokenKey);
    await _prefs?.remove(ApiConstants.clientDataKey);
    await _prefs?.remove(ApiConstants.activeProgramCacheKey);
  }

  // --- تفضيلات وحدات القياس (Measurement Units Preferences) ---

  Future<void> saveUnitPreferences(Map<String, dynamic> prefs) async {
    await _prefs?.setString('unit_preferences', jsonEncode(prefs));
  }

  Map<String, dynamic> getUnitPreferences() {
    final raw = _prefs?.getString('unit_preferences');
    if (raw == null || raw.isEmpty) {
      return {
        'exercise_weight_unit': 'kg',
        'body_weight_unit': 'kg',
        'measurement_unit': 'cm',
      };
    }
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return {
        'exercise_weight_unit': map['exercise_weight_unit'] == 'lb' ? 'lb' : 'kg',
        'body_weight_unit': map['body_weight_unit'] == 'lb' ? 'lb' : 'kg',
        'measurement_unit': map['measurement_unit'] == 'in' ? 'in' : 'cm',
      };
    } catch (_) {
      return {
        'exercise_weight_unit': 'kg',
        'body_weight_unit': 'kg',
        'measurement_unit': 'cm',
      };
    }
  }

  // --- التخزين المؤقت للبرنامج النشط (Active Program Offline Cache) ---

  Future<void> cacheActiveProgram(Map<String, dynamic> programData) async {
    await _prefs?.setString(ApiConstants.activeProgramCacheKey, jsonEncode(programData));
  }

  Map<String, dynamic>? getCachedActiveProgram() {
    final raw = _prefs?.getString(ApiConstants.activeProgramCacheKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // --- طابور مزامنة التمارين دون اتصال (Offline Workout Sync Queue) ---

  Future<void> queuePendingWorkoutLog(Map<String, dynamic> logEntry) async {
    final userId = logEntry['user_id']?.toString() ?? '';
    // منع إضافة أي سجل لمستخدم خاضع لقفل طبي إلى طابور الأوفلاين
    if (userId.isNotEmpty && isClientClinicallyLocked(userId)) {
      return;
    }
    final list = getPendingWorkoutLogs();
    list.add(logEntry);
    await _prefs?.setString(ApiConstants.pendingWorkoutLogsKey, jsonEncode(list));
  }

  List<Map<String, dynamic>> getPendingWorkoutLogs() {
    final raw = _prefs?.getString(ApiConstants.pendingWorkoutLogsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> clearPendingWorkoutLogs() async {
    await _prefs?.remove(ApiConstants.pendingWorkoutLogsKey);
  }

  /// يستبدل طابور التمارين بما تبقى بعد محاولة الرفع دون حذف السجلات غير المرفوعة
  Future<void> replacePendingWorkoutLogs(List<Map<String, dynamic>> remaining) async {
    if (remaining.isEmpty) {
      await clearPendingWorkoutLogs();
      return;
    }
    await _prefs?.setString(ApiConstants.pendingWorkoutLogsKey, jsonEncode(remaining));
  }

  // --- حالة القفل الطبي للسلامة السريرية (Clinical Safety Lockout State) ---

  String _cleanClientKey(String clientCode) {
    return clientCode.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '').trim();
  }

  Future<void> setClientClinicalLockout(
    String clientCode,
    bool locked, {
    String? directive,
    String? lockedAt,
  }) async {
    final clean = _cleanClientKey(clientCode);
    if (clean.isEmpty) return;
    final key = 'z_clinical_lockout_' + clean;
    if (!locked) {
      await _prefs?.remove(key);
      return;
    }
    final data = {
      'locked': true,
      'directive': directive ?? 'إيقاف النشاط التدريبي فوراً والرجوع للطبيب المعالج.',
      'locked_at': lockedAt ?? DateTime.now().toIso8601String(),
    };
    await _prefs?.setString(key, jsonEncode(data));
  }

  Map<String, dynamic>? getClientClinicalLockout(String clientCode) {
    final clean = _cleanClientKey(clientCode);
    if (clean.isEmpty) return null;
    final raw = _prefs?.getString('z_clinical_lockout_' + clean);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw);
      if (map is Map && map['locked'] == true) {
        return Map<String, dynamic>.from(map);
      }
    } catch (_) {}
    return null;
  }

  bool isClientClinicallyLocked(String clientCode) {
    return getClientClinicalLockout(clientCode) != null;
  }

  Future<void> clearClientClinicalLockout(String clientCode) async {
    await setClientClinicalLockout(clientCode, false);
  }

  // --- طابور مزامنة التقييم الأسبوعي (Offline Checkin Sync Queue) ---

  Future<void> queuePendingCheckin(Map<String, dynamic> checkinData) async {
    final list = getPendingCheckins();
    list.add(checkinData);
    await _prefs?.setString(ApiConstants.pendingCheckinsKey, jsonEncode(list));
  }

  List<Map<String, dynamic>> getPendingCheckins() {
    final raw = _prefs?.getString(ApiConstants.pendingCheckinsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) {
        return decoded.map((e) => Map<String, dynamic>.from(e as Map)).toList();
      }
    } catch (_) {}
    return [];
  }

  Future<void> clearPendingCheckins() async {
    await _prefs?.remove(ApiConstants.pendingCheckinsKey);
  }

  /// يستبدل الطابور بما تبقى بعد محاولة الرفع (يمسحه لو لم يتبق شيء).
  Future<void> replacePendingCheckins(List<Map<String, dynamic>> remaining) async {
    if (remaining.isEmpty) {
      await clearPendingCheckins();
      return;
    }
    await _prefs?.setString(ApiConstants.pendingCheckinsKey, jsonEncode(remaining));
  }

  // --- ضبط عنوان الخادم المخصص (Custom Server URL) ---

  Future<void> setCustomBaseUrl(String url) async {
    await _prefs?.setString(ApiConstants.customBaseUrlKey, url);
  }

  String getBaseUrl() {
    final custom = _prefs?.getString(ApiConstants.customBaseUrlKey);
    if (custom != null && custom.isNotEmpty) {
      return custom;
    }
    return ApiConstants.defaultBaseUrl;
  }
}
