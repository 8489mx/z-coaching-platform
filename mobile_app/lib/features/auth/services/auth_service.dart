import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../models/client_user.dart';

/// خدمة المصادقة وإدارة جلسات المشتركين
class AuthService {
  final ApiClient _apiClient;
  final LocalStorage _storage;

  AuthService(this._apiClient, this._storage);

  /// التحقق السريع باستخدام كود المشترك ورقم الهاتف وكلمة المرور.
  /// كلمة المرور مطلوبة متى كان للحساب كلمة مرور؛ وحساب بلا كلمة مرور
  /// يرد 403 ويدخل في مسار اختيار كلمة المرور (setPassword) بدلاً من ذلك.
  Future<ApiResponse<ClientUser>> loginFast({
    required String clientCode,
    required String phoneNumber,
    String? password,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.loginFast,
      body: {
        'client_code': clientCode.trim(),
        'phone_number': phoneNumber.trim(),
        if (password != null && password.isNotEmpty) 'password': password,
      },
    );

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map<String, dynamic>;
      final token = data['token']?.toString();
      final userData = data['user'] as Map<String, dynamic>?;

      if (token != null && userData != null) {
        await _storage.saveToken(token);
        await _storage.saveClientData(userData);
        final user = ClientUser.fromJson(userData);
        return ApiResponse.success(user, statusCode: response.statusCode);
      }
    }

    return ApiResponse.failure(
      response.errorMessage ?? 'تعذر تسجيل الدخول، تحقق من الكود ورقم الهاتف وكلمة المرور',
      statusCode: response.statusCode,
    );
  }

  /// اختيار كلمة المرور لأول مرة لحساب منشأ بدون كلمة مرور، ويثبتها
  /// الخادم مرة واحدة فقط؛ ويسجل الدخول مباشرة مثل أي دخول ناجح.
  Future<ApiResponse<ClientUser>> setPassword({
    required String clientCode,
    required String phoneNumber,
    required String newPassword,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.setPassword,
      body: {
        'client_code': clientCode.trim(),
        'phone_number': phoneNumber.trim(),
        'new_password': newPassword,
      },
    );

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map<String, dynamic>;
      final token = data['token']?.toString();
      final userData = data['user'] as Map<String, dynamic>?;

      if (token != null && userData != null) {
        await _storage.saveToken(token);
        await _storage.saveClientData(userData);
        final user = ClientUser.fromJson(userData);
        return ApiResponse.success(user, statusCode: response.statusCode);
      }
    }

    return ApiResponse.failure(
      response.errorMessage ?? 'تعذر حفظ كلمة المرور، حاول مرة أخرى',
      statusCode: response.statusCode,
    );
  }

  /// تسجيل الدخول عبر البريد الإلكتروني وكلمة المرور
  Future<ApiResponse<ClientUser>> loginEmail({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      ApiConstants.loginEmail,
      body: {
        'email': email.trim(),
        'password': password.trim(),
      },
    );

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map<String, dynamic>;
      final token = data['token']?.toString();
      final userData = data['user'] as Map<String, dynamic>?;

      if (token != null && userData != null) {
        await _storage.saveToken(token);
        await _storage.saveClientData(userData);
        final user = ClientUser.fromJson(userData);
        return ApiResponse.success(user, statusCode: response.statusCode);
      }
    }

    return ApiResponse.failure(
      response.errorMessage ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      statusCode: response.statusCode,
    );
  }

  /// استرجاع بيانات المشترك المحفوظة محلياً دون الحاجة لاتصال
  ClientUser? getCurrentClientLocally() {
    final data = _storage.getClientData();
    if (data != null) {
      try {
        return ClientUser.fromJson(data);
      } catch (_) {}
    }
    return null;
  }

  /// هل الجلسة نشطة وموثقة؟
  bool isLoggedIn() {
    final token = _storage.getToken();
    return token != null && token.isNotEmpty;
  }

  /// تسجيل الخروج ومسح بيانات الجلسة
  Future<void> logout() async {
    await _storage.clearSession();
  }

  /// حذف حساب المتدرب وكافة بياناته وصوره نهائياً (امتثالاً لقواعد متجر أبل)
  Future<ApiResponse<dynamic>> deleteAccount() async {
    final clientData = _storage.getClientData();
    final clientCode = clientData?['client_code']?.toString();
    final userId = clientData?['id'];

    final response = await _apiClient.post(
      ApiConstants.deleteAccount,
      body: {
        if (clientCode != null) 'client_code': clientCode,
        if (userId != null) 'user_id': userId,
      },
    );

    if (response.isSuccess) {
      await logout();
    }
    return response;
  }
}
