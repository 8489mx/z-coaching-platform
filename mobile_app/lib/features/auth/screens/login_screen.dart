import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../home/screens/main_navigation_screen.dart';
import '../services/auth_service.dart';

/// شاشة تسجيل الدخول التنفيذية لمتدربي المنظومة
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
        title: const Text('إعدادات اتصال الخادم', style: TextStyle(color: AppColors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'أدخل رابط خادم المنظومة (مثال: خادم هوستنجر أو السيرفر المحلي):',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'https://api.yourdomain.com',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء', style: TextStyle(color: AppColors.textSecondary)),
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
        title: const Text('شروط الخدمة وإخلاء المسؤولية الطبي', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text(
                '1. إخلاء المسؤولية الطبي:',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              SizedBox(height: 4),
              Text(
                'المنظومة لأغراض التوجيه البدني واللياقة الرياضية العامة فقط، وليست بديلاً عن الاستشارة أو التشخيص الطبي المتخصص. يجب استشارة طبيبك قبل بدء أي حمية أو تمرين مكثف.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              SizedBox(height: 12),
              Text(
                '2. شرط السن (18+):',
                style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              SizedBox(height: 4),
              Text(
                'المنظومة مخصصة للبالغين من سن 18 عاماً فما فوق، ويقر المتدرب بأهليته القانونية والصحية لممارسة النشاط الرياضي.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              SizedBox(height: 12),
              Text(
                '3. ضوابط صور التقييم الأسبوعي:',
                style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              SizedBox(height: 4),
              Text(
                'تُستخدم الصور حصراً لمتابعة قياسات الجسم الرياضية، ويحظر تماماً رفع أي محتوى مخل بالآداب، مع الحظر الفوري للحساب المخالف.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
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
        title: const Text('سياسة الخصوصية وحماية البيانات', style: TextStyle(color: AppColors.textPrimary, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text(
                'سرية وتشفير البيانات:',
                style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              SizedBox(height: 4),
              Text(
                'تُحفظ كافة بياناتك وصورك الأسبوعية في خوادم مشفرة وآمنة، ولا يمكن الاطلاع عليها إلا من قبلك وكوتشك المعتمد فقط. لا يتم بيع أو مشاركة بياناتك مع أي طرف ثالث إطلاقاً.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              SizedBox(height: 12),
              Text(
                'حق الحذف التام (Apple 5.1.1(v)):',
                style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              SizedBox(height: 4),
              Text(
                'يحق لك في أي وقت حذف حسابك وكافة صورك وسجلاتك نهائياً من داخل التطبيق بضغطة زر واحدة دون رجعة.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
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
      backgroundColor: AppColors.backgroundDeep,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // شعار المنظومة
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary, width: 2),
                    ),
                    child: const Icon(
                      Icons.fitness_center,
                      size: 36,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'منظومة Z التدريبية',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'بوابة المتدرب المعتمدة لمتابعة الخطة الرياضية والغذائية',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 32),

                // تبديل نمط الدخول (دخول سريع بكود المشترك / بريد وكلمة مرور)
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
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
                              borderRadius: BorderRadius.circular(8),
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
                              borderRadius: BorderRadius.circular(8),
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
                const SizedBox(height: 24),

                // حقول الإدخال
                if (_isFastMode) ...[
                  TextField(
                    controller: _clientCodeController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    keyboardType: TextInputType.text,
                    decoration: const InputDecoration(
                      labelText: 'كود المشترك',
                      hintText: 'مثال: 1 أو 1024',
                      prefixIcon: Icon(Icons.badge_outlined, color: AppColors.textSecondary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _phoneController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'رقم الهاتف المسجل',
                      hintText: 'مثال: 01000000000',
                      prefixIcon: Icon(Icons.phone_android_outlined, color: AppColors.textSecondary),
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
                      prefixIcon: Icon(Icons.email_outlined, color: AppColors.textSecondary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'كلمة المرور',
                      prefixIcon: Icon(Icons.lock_outline, color: AppColors.textSecondary),
                    ),
                  ),
                ],

                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.danger),
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

                // إقرار السن (18+) والموافقة على الشروط الطبية والخصوصية
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _acceptedTermsAndAge ? AppColors.border : AppColors.warning,
                    ),
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
                              style: TextStyle(color: AppColors.secondary, fontSize: 11),
                            ),
                          ),
                          Container(width: 1, height: 14, color: AppColors.border),
                          TextButton(
                            onPressed: _showPrivacyDialog,
                            child: const Text(
                              'سياسة الخصوصية وحماية البيانات',
                              style: TextStyle(color: AppColors.secondary, fontSize: 11),
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
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('تسجيل الدخول ومزامنة الخطة'),
                ),

                const SizedBox(height: 24),

                // رابط ضبط الخادم
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
