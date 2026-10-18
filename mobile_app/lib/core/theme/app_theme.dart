import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// نظام التصميم والسمات الرسمية لمنظومة كريم زكريا (Karim Zakaria Platform)
/// مخصص للوضع الفاتح الهادئ والفاخر (High-End Editorial Minimal Light Mode)
class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      fontFamily: 'Alexandria',

      // ألوان المنظومة العامة
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surface,
        error: AppColors.danger,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
      ),

      // نمط شريط التطبيق العلوي (Native Minimal)
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: 'Alexandria',
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary,
          letterSpacing: -0.3,
        ),
      ),

      // نمط البطاقات الفاخرة
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: AppColors.border, width: 0.8),
        ),
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
      ),

      // نمط حقول الإدخال النظيفة والناعمة
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontFamily: 'Alexandria'),
        labelStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontFamily: 'Alexandria'),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.border, width: 0.8),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.danger, width: 1),
        ),
      ),

      // نمط الأزرار الأساسية الفاخرة
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Alexandria',
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      // نمط الأزرار الحدودية الهادئة
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.border, width: 1),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontFamily: 'Alexandria',
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // أزرار النصوص
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryDeep,
          textStyle: const TextStyle(
            fontFamily: 'Alexandria',
            fontSize: 13,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  /// نمط الأزرار الكبسولية الشبحية الناعمة (Secondary Ghost Pill Button - المستوى الثاني لنظام الأزرار)
  static ButtonStyle get ghostPillButtonStyle {
    return ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFFF8FBFF),
      foregroundColor: const Color(0xFF284C7C),
      elevation: 0,
      shadowColor: Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
      minimumSize: const Size(44, 26),
      shape: const StadiumBorder(
        side: BorderSide(color: Color(0xFFD9E7F5), width: 1),
      ),
      textStyle: const TextStyle(
        fontFamily: 'Alexandria',
        fontSize: 11,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}
