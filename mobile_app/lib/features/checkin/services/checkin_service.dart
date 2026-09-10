import 'dart:convert';
import 'dart:io';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';

/// خدمة استمارة التقييم الأسبوعي ورفع الصور
class CheckinService {
  final ApiClient _apiClient;
  final LocalStorage _storage;

  CheckinService(this._apiClient, this._storage);

  /// إرسال التقييم الأسبوعي مع الصور إلى الخادم المركزي
  Future<ApiResponse<dynamic>> submitWeeklyCheckin({
    required String clientCode,
    required double currentWeight,
    required double waistCircumference,
    required int adherenceRate,
    required int sleepHours,
    required String clientNotes,
    String? frontPhotoPath,
    String? sidePhotoPath,
    String? backPhotoPath,
  }) async {
    // تحويل الصور محلياً إلى Base64 لسرعة النقل والتكامل مع خادم هوستنجر
    String? frontBase64;
    String? sideBase64;
    String? backBase64;

    try {
      if (frontPhotoPath != null && File(frontPhotoPath).existsSync()) {
        frontBase64 = base64Encode(await File(frontPhotoPath).readAsBytes());
      }
      if (sidePhotoPath != null && File(sidePhotoPath).existsSync()) {
        sideBase64 = base64Encode(await File(sidePhotoPath).readAsBytes());
      }
      if (backPhotoPath != null && File(backPhotoPath).existsSync()) {
        backBase64 = base64Encode(await File(backPhotoPath).readAsBytes());
      }
    } catch (_) {}

    final payload = {
      'client_code': clientCode,
      'weight': currentWeight,
      'waist': waistCircumference,
      'adherence_rate': adherenceRate,
      'sleep_hours': sleepHours,
      'client_notes': clientNotes,
      'submission_date': DateTime.now().toIso8601String(),
      'photos': {
        if (frontBase64 != null) 'front': 'data:image/jpeg;base64,$frontBase64',
        if (sideBase64 != null) 'side': 'data:image/jpeg;base64,$sideBase64',
        if (backBase64 != null) 'back': 'data:image/jpeg;base64,$backBase64',
      }
    };

    // محاولة الإرسال الحي
    final response = await _apiClient.post(
      ApiConstants.submitCheckin,
      body: payload,
    );

    if (response.isSuccess) {
      return response;
    } else {
      // حفظ محلي في طابور الأوفلاين إن فشل الاتصال
      await _storage.queuePendingCheckin(payload);
      return ApiResponse.failure(
        'تم حفظ التقييم محلياً لعدم استقرار الشبكة، وسيتم رفعه تلقائياً فور الاتصال.',
        statusCode: 202,
      );
    }
  }
}
