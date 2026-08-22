import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_endpoints.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  /// Fast login with client_code and phone_number
  Future<Map<String, dynamic>> loginFast(String clientCode, String phone) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.fastLogin),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'client_code': clientCode.trim(),
        'phone_number': phone.trim(),
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'فشل تسجيل الدخول');
    }
  }

  /// Fetch active program from MariaDB z
  Future<Map<String, dynamic>> fetchActiveProgram(String userId) async {
    final response = await http.get(
      Uri.parse(ApiEndpoints.activeProgram(userId)),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'فشل جلب البرنامج التدريبي');
    }
  }

  /// Submit weekly checkin
  Future<Map<String, dynamic>> submitCheckin(Map<String, dynamic> checkinPayload) async {
    final response = await http.post(
      Uri.parse(ApiEndpoints.submitCheckin),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(checkinPayload),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'فشل إرسال المتابعة');
    }
  }
}
