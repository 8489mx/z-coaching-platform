import 'dart:convert';
import 'package:http/http.dart' as http;
import '../storage/local_storage.dart';

/// نتيجة استدعاء واجهات البرمجة (API Response Wrapper)
class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String? errorMessage;
  final int statusCode;

  ApiResponse({
    required this.isSuccess,
    this.data,
    this.errorMessage,
    required this.statusCode,
  });

  factory ApiResponse.success(T data, {int statusCode = 200}) {
    return ApiResponse(isSuccess: true, data: data, statusCode: statusCode);
  }

  factory ApiResponse.failure(String message, {int statusCode = 500}) {
    return ApiResponse(isSuccess: false, errorMessage: message, statusCode: statusCode);
  }
}

/// عميل الاتصال الشبكي الموحد بخادم المنظومة
class ApiClient {
  final LocalStorage _storage;

  ApiClient(this._storage);

  String get _baseUrl => _storage.getBaseUrl();

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
    final token = _storage.getToken();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// طلب GET
  Future<ApiResponse<dynamic>> get(String endpoint) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final response = await http
          .get(uri, headers: _buildHeaders())
          .timeout(const Duration(seconds: 15));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse.failure('تعذر الاتصال بالخادم: $e', statusCode: 0);
    }
  }

  /// طلب POST
  Future<ApiResponse<dynamic>> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final encodedBody = body != null ? jsonEncode(body) : null;
      final response = await http
          .post(uri, headers: _buildHeaders(), body: encodedBody)
          .timeout(const Duration(seconds: 20));

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse.failure('تعذر الاتصال بالخادم: $e', statusCode: 0);
    }
  }

  /// طلب رفع ملفات متعددة (Multipart Request)
  Future<ApiResponse<dynamic>> uploadFiles(
    String endpoint, {
    required Map<String, String> fields,
    required Map<String, String> filePaths, // key -> filePath
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl$endpoint');
      final request = http.MultipartRequest('POST', uri);

      final token = _storage.getToken();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }

      request.fields.addAll(fields);

      for (final entry in filePaths.entries) {
        request.files.add(
          await http.MultipartFile.fromPath(entry.key, entry.value),
        );
      }

      final streamedResponse = await request.send().timeout(const Duration(seconds: 45));
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse.failure('فشل رفع الملفات: $e', statusCode: 0);
    }
  }

  ApiResponse<dynamic> _handleResponse(http.Response response) {
    dynamic decoded;
    try {
      decoded = jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      decoded = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return ApiResponse.success(decoded, statusCode: response.statusCode);
    } else {
      String message = 'حدث خطأ في الخادم (${response.statusCode})';
      if (decoded is Map && decoded['message'] != null) {
        message = decoded['message'].toString();
      } else if (decoded is Map && decoded['error'] != null) {
        message = decoded['error'].toString();
      }
      return ApiResponse.failure(message, statusCode: response.statusCode);
    }
  }
}
