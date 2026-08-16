import 'dart:io';

class ApiEndpoints {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web, or your local network IP for physical devices
  static String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }

  static String get fastLogin => '$baseUrl/auth/login-fast';
  static String activeProgram(String userId) => '$baseUrl/programs/active/$userId';
  static String get submitCheckin => '$baseUrl/programs/checkin/submit';
  static String get swapFood => '$baseUrl/programs/swap-food';
}
