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
