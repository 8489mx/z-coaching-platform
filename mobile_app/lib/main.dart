import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/storage/local_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/home/screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storage = await LocalStorage.getInstance();
  final hasSession = storage.getToken() != null && storage.getToken()!.isNotEmpty;

  runApp(ZCoachingApp(storage: storage, hasSession: hasSession));
}

/// التطبيق الأصيل لمنظومة Z Coaching Platform
class ZCoachingApp extends StatelessWidget {
  final LocalStorage storage;
  final bool hasSession;

  const ZCoachingApp({
    super.key,
    required this.storage,
    required this.hasSession,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'منظومة Z التدريبية',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,

      // فرض اتجاه القراءة والكتابة من اليمين لليسار (RTL) بشكل أصيل للغة العربية
      locale: const Locale('ar', 'EG'),
      supportedLocales: const [
        Locale('ar', 'EG'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      home: hasSession
          ? MainNavigationScreen(storage: storage)
          : LoginScreen(storage: storage),
    );
  }
}
