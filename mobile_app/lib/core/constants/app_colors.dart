import 'package:flutter/material.dart';

/// نظام الألوان التنفيذي لمنظومة Z Coaching Platform
/// مصمم للهوية البصرية الداكنة مع درجات الكحلي والزمردي
class AppColors {
  // خلفيات المنظومة
  static const Color background = Color(0xFF0F172A);      // Slate 900
  static const Color backgroundDeep = Color(0xFF020617);  // Slate 950
  static const Color surface = Color(0xFF1E293B);         // Slate 800
  static const Color surfaceLight = Color(0xFF334155);    // Slate 700
  static const Color card = Color(0xFF1E293B);

  // الألوان الأساسية والتنفيذية
  static const Color primary = Color(0xFF10B981);         // Emerald 500
  static const Color primaryHover = Color(0xFF059669);    // Emerald 600
  static const Color primaryLight = Color(0xFFD1FAE5);
  static const Color primaryDark = Color(0xFF065F46);

  // الألوان الإضافية والبيانية
  static const Color secondary = Color(0xFF06B6D4);       // Cyan 500
  static const Color accentBlue = Color(0xFF3B82F6);       // Blue 500
  static const Color accentSky = Color(0xFF38BDF8);        // Sky 400
  static const Color accentIndigo = Color(0xFF6366F1);     // Indigo 500

  // حالات النظام والمؤشرات
  static const Color success = Color(0xFF10B981);         // أخضر نجاح
  static const Color warning = Color(0xFFF59E0B);         // كهرماني تحذير
  static const Color danger = Color(0xFFEF4444);          // أحمر خطر
  static const Color info = Color(0xFF0EA5E9);            // أزرق معلومات

  // ألوان النصوص
  static const Color textPrimary = Color(0xFFF8FAFC);     // Slate 50
  static const Color textSecondary = Color(0xFF94A3B8);   // Slate 400
  static const Color textMuted = Color(0xFF64748B);       // Slate 500
  static const Color textDisabled = Color(0xFF475569);    // Slate 600

  // الحدود والفواصل
  static const Color border = Color(0xFF334155);          // Slate 700
  static const Color borderLight = Color(0xFF475569);     // Slate 600
  static const Color divider = Color(0xFF1E293B);

  // العناصر التفاعلية
  static const Color inputBackground = Color(0xFF0F172A);
  static const Color overlay = Color(0x80000000);
}
