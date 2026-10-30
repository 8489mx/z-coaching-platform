/// ثوابت الاتصال بخادم المنظومة المركزي (API Constants)
class ApiConstants {
  // عنوان الخادم الأساسي (النطاق السحابي الإنتاجي)
  static const String defaultBaseUrl = 'https://app.karimzakaria.com';
  static const String webBaseUrl = 'https://app.karimzakaria.com';
  
  // مفتاح التخزين لعنوان الخادم المخصص
  static const String customBaseUrlKey = 'custom_base_url';

  // مسارات واجهات البرمجة (Endpoints)
  static const String loginFast = '/api/v1/auth/login-fast';
  static const String setPassword = '/api/v1/auth/set-password';
  static const String loginEmail = '/api/v1/auth/login-email';
  static const String activeProgram = '/api/v1/programs/active';
  // نفس مسار استمارة المتابعة في الويب (وزن واحد، والخادم يحدد رقم الأسبوع تلقائياً)
  static const String submitCheckin = '/api/v1/checkin';
  static const String checkinHistory = '/api/v1/programs/checkin/history';
  static const String uploadPhotos = '/api/v1/photos/upload';
  static const String swapCandidates = '/api/v1/programs/swap-candidates';
  static const String swapFood = '/api/v1/programs/swap-food';
  static const String logWorkout = '/api/v1/checkin/workout-logs';
  static const String deleteAccount = '/api/v1/auth/delete-account';
  static const String privacyPolicy = '/privacy-policy';
  static const String termsOfService = '/terms-of-service';

  // مفاتيح التخزين المحلي (Storage Keys)
  static const String tokenKey = 'z_auth_token';
  static const String clientDataKey = 'z_client_data';
  static const String activeProgramCacheKey = 'z_cached_program';
  static const String pendingWorkoutLogsKey = 'z_pending_workout_logs';
  static const String pendingCheckinsKey = 'z_pending_checkins';
}
