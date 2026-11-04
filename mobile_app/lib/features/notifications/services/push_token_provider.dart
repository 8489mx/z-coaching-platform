import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'notification_service.dart';

/// P2-C7: registers this device's FCM token with the server so real push
/// delivery can reach the client even when the app is closed.
///
/// GUARDED ON PURPOSE: if Firebase is not configured yet (no Firebase
/// project, no google-services.json / GoogleService-Info.plist), init()
/// swallows the failure and returns — the in-app inbox keeps working and
/// the app never crashes. See docs/notifications-setup.md for the setup
/// checklist the owner must complete before mobile push works.
class PushTokenProvider {
  final NotificationService _service;
  bool _initialized = false;

  PushTokenProvider(this._service);

  Future<void> init(String clientCode) async {
    if (_initialized || clientCode.isEmpty) return;
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) {
        await _service.registerPushToken(clientCode, token);
      }
      messaging.onTokenRefresh.listen((newToken) {
        _service.registerPushToken(clientCode, newToken);
      });
      _initialized = true;
    } catch (_) {
      // Push not configured yet — inbox (SSE + fetch) still works.
    }
  }
}
