import 'dart:async';
import 'dart:convert';
import '../../../core/network/api_client.dart';
import '../models/notification_item.dart';

/// خدمة جلب واستعراض الإشعارات الذاتية من خادم المنظومة
class NotificationService {
  final ApiClient _apiClient;

  NotificationService(this._apiClient);

  /// جلب قائمة إشعارات المتدرب من الخادم
  Future<List<NotificationItem>> fetchNotifications(String clientCode) async {
    try {
      final response = await _apiClient.get('/api/v1/notifications/client/$clientCode');
      if (response.isSuccess && response.data is Map) {
        final list = response.data['notifications'] as List? ?? [];
        return list.map((item) => NotificationItem.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  /// الاشتراك في البث المباشر (SSE) لإشعارات المتدرب. يعيد اشتراكاً يجب
  /// إلغاؤه عند التخلص من الشاشة (dispose). عند انقطاع التدفق يعيد المتصل
  /// الجلب العادي (fetchNotifications) كبديل — فالبث تحسين حيوية وليس
  /// المصدر الوحيد. يتجاهل حدث CONNECTED الافتتاحي.
  Future<StreamSubscription<String>> subscribeToStream(
    String clientCode,
    void Function(NotificationItem item) onEvent,
  ) async {
    final streamed = await _apiClient.getStream('/api/v1/notifications/stream/$clientCode');
    return streamed.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .listen((line) {
      if (!line.startsWith('data:')) return;
      final payload = line.substring(5).trim();
      if (payload.isEmpty) return;
      try {
        final decoded = jsonDecode(payload);
        if (decoded is Map<String, dynamic>) {
          if (decoded['type'] == 'CONNECTED') return;
          onEvent(NotificationItem.fromJson(decoded));
        }
      } catch (_) {
        // Ignore malformed SSE lines; the next fetch refreshes the list.
      }
    });
  }

  /// تسجيل رمز جهاز الدفع (FCM) لدى الخادم، مرتبطاً بالمستخدم المصدّق
  /// نفسه (الخادم يرفض رمزاً لكود متدرب آخر).
  Future<bool> registerPushToken(String clientCode, String token) async {
    try {
      final response = await _apiClient.post(
        '/api/v1/notifications/register-token',
        body: {
          'client_code': clientCode,
          'token': token,
          'device_info': {'platform': 'Mobile'},
        },
      );
      return response.isSuccess;
    } catch (_) {
      return false;
    }
  }

  /// تحديد الإشعارات كمقروءة
  Future<bool> markAsRead(String clientCode, {String? notificationId}) async {
    try {
      final response = await _apiClient.post(
        '/api/v1/notifications/mark-read',
        body: {
          'client_code': clientCode,
          if (notificationId != null) 'notification_id': notificationId,
        },
      );
      return response.isSuccess;
    } catch (_) {
      return false;
    }
  }
}
