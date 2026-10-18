import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../home/screens/main_navigation_screen.dart';
import '../services/auth_service.dart';

/// شاشة تسجيل الدخول المعتمدة لمتدربي كريم زكريا
/// تصميم Light Mode نقي وفاخر
class LoginScreen extends StatefulWidget {
  final LocalStorage storage;
  const LoginScreen({super.key, required this.storage});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _clientCodeController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isFastMode = true;
  bool _isLoading = false;
  bool _acceptedTermsAndAge = true;
  String? _errorMessage;

  late final AuthService _authService;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(widget.storage);
    _authService = AuthService(apiClient, widget.storage);
  }

  @override
  void dispose() {
    _clientCodeController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_acceptedTermsAndAge) {
      setState(() {
        _errorMessage = 'يجب تأكيد بلوغ سن 18 عاماً والموافقة على الشروط الطبية والخصوصية للمتابعة';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (_isFastMode) {
        final code = _clientCodeController.text.trim();
        final phone = _phoneController.text.trim();

        if (code.isEmpty || phone.isEmpty) {
          setState(() {
            _errorMessage = 'يرجى إدخال كود المشترك ورقم الهاتف معاً';
            _isLoading = false;
          });
          return;
        }

        final res = await _authService.loginFast(clientCode: code, phoneNumber: phone);
        if (res.isSuccess && mounted) {
          _navigateToHome();
        } else {
          setState(() {
            _errorMessage = res.errorMessage ?? 'بيانات الدخول غير صحيحة';
          });
        }
      } else {
        final email = _emailController.text.trim();
        final password = _passwordController.text;

        if (email.isEmpty || password.isEmpty) {
          setState(() {
            _errorMessage = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
            _isLoading = false;
          });
          return;
        }

        final res = await _authService.loginEmail(email: email, password: password);
        if (res.isSuccess && mounted) {
          _navigateToHome();
        } else {
          setState(() {
            _errorMessage = res.errorMessage ?? 'بيانات الدخول غير صحيحة';
          });
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'حدث خطأ غير متوقع: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => MainNavigationScreen(storage: widget.storage),
      ),
    );
  }

  void _showServerConfigDialog() {
    final controller = TextEditingController(text: widget.storage.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('إعدادات اتصال الخادم', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'أدخل رابط خادم المنظومة المعتمد:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'https://app.karimzakaria.com',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              await widget.storage.setCustomBaseUrl(controller.text.trim());
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }

  void _showTermsDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('شروط الخدمة وإخلاء المسؤولية', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
        content: const SingleChildScrollView(
          child: Text(
            'برامج المنظومة مخصصة للبالغين من سن 18 عاماً فما فوق لأغراض اللياقة البدنية والنمط الحياتي الرياضي العام، وليست تشخيصاً أو علاجاً طبياً متخصصاً.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('فهمت وموافق'),
          ),
        ],
      ),
    );
  }

  void _showPrivacyDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('سياسة الخصوصية وحماية البيانات', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
        content: const SingleChildScrollView(
          child: Text(
            'تُحفظ كافة بياناتك وصور التقييم في خوادم مشفرة وآمنة ومحصورة بمراجعة مدربك فقط، ولا تتم مشاركتها مع أي طرف ثالث إطلاقاً.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إغلاق'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // شعار البراند
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border),
                      boxShadow: AppColors.softCardShadow,
                    ),
                    child: const Center(
                      child: Icon(
                        Icons.fitness_center_outlined,
                        size: 38,
                        color: AppColors.primaryDeep,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'كريم زكريا',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'بوابة المتدرب لمتابعة الخطة الرياضية والغذائية',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 28),

                // تبديل نمط الدخول (دخول سريع بكود المشترك / بريد وكلمة مرور)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isFastMode = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: _isFastMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'الدخول السريع بالكود',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: _isFastMode ? Colors.white : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isFastMode = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: !_isFastMode ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              'البريد الإلكتروني',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: !_isFastMode ? Colors.white : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // بطاقة حقول الإدخال
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border),
                    boxShadow: AppColors.softCardShadow,
                  ),
                  child: Column(
                    children: [
                      if (_isFastMode) ...[
                        TextField(
                          controller: _clientCodeController,
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                          keyboardType: TextInputType.text,
                          decoration: const InputDecoration(
                            labelText: 'كود المشترك',
                            hintText: 'مثال: 1 أو 1024',
                            prefixIcon: Icon(Icons.badge_outlined, color: AppColors.textMuted),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _phoneController,
                          style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'رقم الهاتف المسجل',
                            hintText: 'مثال: 01000000000',
                            prefixIcon: Icon(Icons.phone_android_outlined, color: AppColors.textMuted),
                          ),
                        ),
                      ] else ...[
                        TextField(
                          controller: _emailController,
                          style: const TextStyle(color: AppColors.textPrimary),
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'البريد الإلكتروني',
                            hintText: 'client@example.com',
                            prefixIcon: Icon(Icons.email_outlined, color: AppColors.textMuted),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          style: const TextStyle(color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                            labelText: 'كلمة المرور',
                            prefixIcon: Icon(Icons.lock_outline, color: AppColors.textMuted),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.dangerLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(color: AppColors.danger, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 16),

                // إقرار السن (18+) والموافقة على الشروط
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Checkbox(
                            value: _acceptedTermsAndAge,
                            activeColor: AppColors.primary,
                            onChanged: (val) {
                              setState(() => _acceptedTermsAndAge = val ?? false);
                            },
                          ),
                          const Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(top: 8),
                              child: Text(
                                'أقر بأن عمري 18 عاماً فما فوق، ولائق صحياً، وأوافق على إخلاء المسؤولية الطبي وشروط الخدمة وسياسة الخصوصية.',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 12,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          TextButton(
                            onPressed: _showTermsDialog,
                            child: const Text(
                              'شروط الخدمة وإخلاء المسؤولية',
                              style: TextStyle(color: AppColors.primaryDeep, fontSize: 11),
                            ),
                          ),
                          Container(width: 1, height: 14, color: AppColors.borderLight),
                          TextButton(
                            onPressed: _showPrivacyDialog,
                            child: const Text(
                              'سياسة الخصوصية وحماية البيانات',
                              style: TextStyle(color: AppColors.primaryDeep, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // زر تسجيل الدخول
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('تسجيل الدخول ومزامنة الخطة'),
                ),
                const SizedBox(height: 20),

                // رابط تهيئة الخادم
                Center(
                  child: TextButton.icon(
                    onPressed: _showServerConfigDialog,
                    icon: const Icon(Icons.settings_ethernet, size: 16, color: AppColors.textMuted),
                    label: const Text(
                      'تهيئة رابط الخادم',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
