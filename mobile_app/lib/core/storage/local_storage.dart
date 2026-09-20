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
