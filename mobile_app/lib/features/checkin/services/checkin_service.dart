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
    } catch (_) {
      return ApiResponse.failure(
        'تعذر قراءة ملفات الصور المختارة للمتابعة. يرجى إعادة اختيار الصور أو التحقق من أذونات التخزين.',
        statusCode: 400,
      );
    }

    // الخادم لا يخزن ساعات النوم كحقل مستقل، فتصل للكوتش ضمن الملاحظات
    final sleepLine = 'متوسط النوم: $sleepHours ساعات';
    final notes = clientNotes.trim().isEmpty ? sleepLine : '$sleepLine\n$clientNotes';

    // نفس حقول استمارة الويب التي يقرأها الخادم (POST /api/v1/checkin)
    final payload = {
      'user_id': clientCode,
      'weight_kg': currentWeight,
      'waist_circumference_cm': waistCircumference,
      'nutrition_adherence_percent': adherenceRate,
      'sleep_hours': sleepHours,
      'client_notes': notes,
      'photos': [
        if (frontBase64 != null) {'pose': 'FRONT', 'photo_url': 'data:image/jpeg;base64,$frontBase64'},
        if (sideBase64 != null) {'pose': 'SIDE', 'photo_url': 'data:image/jpeg;base64,$sideBase64'},
        if (backBase64 != null) {'pose': 'BACK', 'photo_url': 'data:image/jpeg;base64,$backBase64'},
      ],
    };

    // محاولة الإرسال الحي
    final response = await _apiClient.post(
      ApiConstants.submitCheckin,
      body: payload,
    );

    if (response.isSuccess) {
      return response;
    }
    if (response.statusCode == 0) {
      // فشل الشبكة فقط: نحفظ نسخة على الجهاز حتى لا تضيع البيانات
      await _storage.queuePendingCheckin(payload);
      return ApiResponse.failure(
        'تعذر الاتصال بالخادم. تم حفظ نسخة من التقييم على جهازك، أعد الإرسال عند عودة الإنترنت.',
        statusCode: 0,
      );
    }
    // رفض من الخادم (بيانات غير صالحة أو متابعة مكررة): نعرض السبب ولا نضعه في الطابور
    return response;
  }

  /// يرفع المتابعات المحفوظة على الجهاز بعد عودة الاتصال.
  /// ما يفشل بسبب الشبكة يبقى في الطابور، وما يرفضه الخادم يخرج منه حتى لا تتكرر المحاولة بلا نهاية.
  Future<Map<String, int>> flushPendingCheckins() async {
    final pending = _storage.getPendingCheckins();
    if (pending.isEmpty) return {'uploaded': 0, 'kept': 0, 'rejected': 0};

    final remaining = <Map<String, dynamic>>[];
    var uploaded = 0;
    var rejected = 0;

    for (final payload in pending) {
      final response = await _apiClient.post(ApiConstants.submitCheckin, body: payload);
      if (response.isSuccess) {
        uploaded++;
      } else if (response.statusCode == 0) {
        remaining.add(payload);
      } else {
        rejected++;
      }
    }

    await _storage.replacePendingCheckins(remaining);
    return {'uploaded': uploaded, 'kept': remaining.length, 'rejected': rejected};
  }
}
