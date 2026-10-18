import 'package:flutter/material.dart';

/// نظام الألوان والأسطح لمنظومة كريم زكريا (Karim Zakaria Platform)
/// أسلوب عالمي فاخر فائق النقاء والهدوء (High-End Editorial Minimal Light Mode)
class AppColors {
  // خلفيات المنظومة والأسطح
  static const Color background = Color(0xFFFAFBFC);      // Canvas الخلفية العامة
  static const Color backgroundDeep = Color(0xFFF1F5F9);  // Slate 100 للخلفيات البديلة
  static const Color surface = Color(0xFFFFFFFF);         // أسطح الكروت النقية
  static const Color surfaceMuted = Color(0xFFF8FAFC);    // أسطح داخلية فائقة النعومة
  static const Color card = Color(0xFFFFFFFF);            // كروت بيضاء ناصعة

  // اللون الأساسي للبراند (Brand Primary)
  static const Color primary = Color(0xFF58B4E5);         // أزرق البراند السماوي
  static const Color primaryHover = Color(0xFF48A4D5);    // أزرق أعمق للتفاعل
  static const Color primaryDeep = Color(0xFF0284C7);     // Sky 700 للمسات المركزة
  static const Color primaryLight = Color(0xFFF0F7FF);    // صبغة سماوية بالغة الرقة
  static const Color primaryDark = Color(0xFF0369A1);     // كحلي أزرق
  static const Color secondaryTint = Color(0xFFF0F7FF);   // مساحات زرقاء ناعمة

  // لون الصبغة الثانوية (Secondary)
  static const Color secondary = Color(0xFF0284C7);
  static const Color accentSky = Color(0xFF38BDF8);

  // هوية باقة ELITE (Sky Blue Identity)
  static const Color elitePrimary = Color(0xFF58B4E5);
  static const Color eliteAccent = Color(0xFF0EA5E9);
  static const Color eliteDeep = Color(0xFF0284C7);
  static const Color eliteTint = Color(0xFFF0F9FF);
  static const LinearGradient eliteGradient = LinearGradient(
    colors: [Color(0xFF0284C7), Color(0xFF38BDF8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // هوية باقة MAX (Champagne / Royal Gold Identity)
  static const Color maxPrimary = Color(0xFFC4952D);
  static const Color maxGold = Color(0xFFE5B951);
  static const Color maxSoftGold = Color(0xFFFDF0A6);
  static const Color maxDeepGold = Color(0xFF9A7524);
  static const Color maxTint = Color(0xFFFEFCE8);
  static const LinearGradient maxGradient = LinearGradient(
    colors: [Color(0xFFC4952D), Color(0xFFE5B951)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // حالات النظام والمؤشرات الوظيفية الهادئة
  static const Color success = Color(0xFF10B981);         // أخضر نجاح هادئ
  static const Color successLight = Color(0xFFF0FDF4);    // خلفية نجاح ناعمة
  static const Color warning = Color(0xFFF59E0B);         // كهرماني تحذير
  static const Color warningLight = Color(0xFFFFFBEB);    // خلفية تحذير ناعمة
  static const Color danger = Color(0xFFEF4444);          // أحمر تحذير
  static const Color dangerLight = Color(0xFFFEF2F2);     // خلفية خطأ ناعمة
  static const Color info = Color(0xFF0284C7);            // أزرق معلومات

  // ألوان النصوص (Editorial Hierarchy)
  static const Color textPrimary = Color(0xFF0F172A);     // Slate 900 النص الأساسي والعناوين
  static const Color textSecondary = Color(0xFF475569);   // Slate 600 النص الثانوي والتسميات
  static const Color textMuted = Color(0xFF94A3B8);       // Slate 400 نصوص فرعية وهوامش
  static const Color textDisabled = Color(0xFFCBD5E1);    // Slate 300 عناصر غير مفعلة

  // الحدود والفواصل (Subtle & Non-Intrusive)
  static const Color border = Color(0xFFEAEFF5);          // حدود كروت فائقة النعومة
  static const Color borderLight = Color(0xFFF1F5F9);     // خطوط داخلية مجهرية
  static const Color divider = Color(0xFFF8FAFC);         // فواصل أقسام طبيعية

  // حقول الإدخال
  static const Color inputBackground = Color(0xFFF8FAFC); // خلفية حقول الإدخال الهادئة
  static const Color overlay = Color(0x220F172A);

  // ظلال فاخرة وهوائية (Airy High-End Elevation)
  static const List<BoxShadow> softCardShadow = [
    BoxShadow(
      color: Color(0x060F172A),
      blurRadius: 24,
      offset: Offset(0, 8),
      spreadRadius: -2,
    ),
  ];

  static const List<BoxShadow> heroCardShadow = [
    BoxShadow(
      color: Color(0x0A0F172A),
      blurRadius: 32,
      offset: Offset(0, 12),
      spreadRadius: -4,
    ),
  ];
}
