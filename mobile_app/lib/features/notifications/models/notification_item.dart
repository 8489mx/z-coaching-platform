/// نموذج الإشعار الذاتي المستقل داخل تطبيق المتدرب
class NotificationItem {
  final String id;
  final String clientCode;
  final String title;
  final String body;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? payload;

  NotificationItem({
    required this.id,
    required this.clientCode,
    required this.title,
    required this.body,
    required this.isRead,
    required this.createdAt,
    this.payload,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id']?.toString() ?? '',
      clientCode: json['client_code']?.toString() ?? '',
      title: json['title']?.toString() ?? 'إشعار من الكوتش',
      body: json['body']?.toString() ?? '',
      isRead: json['is_read'] == true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      payload: json['payload'] is Map<String, dynamic> ? json['payload'] as Map<String, dynamic> : null,
    );
  }
}
