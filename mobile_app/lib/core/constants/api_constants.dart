/// ثوابت الاتصال بخادم المنظومة المركزي (API Constants)
class ApiConstants {
  // عنوان الخادم الأساسي (يمكن تغييره وفق بيئة التشغيل أو خادم هوستنجر)
  static const String defaultBaseUrl = 'http://10.0.2.2:3000'; // للمحاكي الأندرويدي أو الشبكة المحلية
  static const String webBaseUrl = 'http://localhost:3000';
  
  // مفتاح التخزين لعنوان الخادم المخصص
  static const String customBaseUrlKey = 'custom_base_url';

  // مسارات واجهات البرمجة (Endpoints)
  static const String loginFast = '/api/v1/auth/login-fast';
  static const String loginEmail = '/api/v1/auth/login-email';
  static const String activeProgram = '/api/v1/programs/active';
  static const String submitCheckin = '/api/v1/programs/checkin/submit';
  static const String checkinHistory = '/api/v1/programs/checkin/history';
  static const String uploadPhotos = '/api/v1/photos/upload';
  static const String swapCandidates = '/api/v1/programs/swap-candidates';
  static const String swapFood = '/api/v1/programs/swap-food';
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
