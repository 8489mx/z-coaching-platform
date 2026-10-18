import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../auth/models/client_user.dart';
import '../../auth/screens/login_screen.dart';
import '../../auth/services/auth_service.dart';

/// شاشة حسابي والاشتراك الخاصة بالمتدرب
/// تصميم نقي وهادئ متوافق مع الهوية البصرية لموقع كريم زكريا
class AccountScreen extends StatefulWidget {
  final LocalStorage storage;

  const AccountScreen({super.key, required this.storage});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  ClientUser? _user;
  Map<String, dynamic>? _activeProgram;
  Map<String, dynamic> _unitPrefs = {
    'exercise_weight_unit': 'kg',
    'body_weight_unit': 'kg',
    'measurement_unit': 'cm',
  };

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  void _loadUser() {
    final clientData = widget.storage.getClientData();
    if (clientData != null) {
      _user = ClientUser.fromJson(clientData);
    }
    _activeProgram = widget.storage.getCachedActiveProgram();
    _unitPrefs = widget.storage.getUnitPreferences();
    setState(() {});
  }

  void _showWhatsAppSupportDialog() {
    const defaultCoachPhone = '+201017887755';
    final clientName = _user?.fullName ?? 'مشترك كريم زكريا';
    final clientCode = _user?.clientCode ?? '';
    final message = 'مرحباً كوتش كريم، أنا $clientName (كود: $clientCode)، لدي استفسار بخصوص برنامجي التدريبي والمتابعة.';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'التواصل مع الكوتش وفريق المتابعة',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'لأي استفسارات تدريبية أو مساعدة فنية أثناء فترة اشتراكك، يمكنك التواصل المباشر مع فريق المتابعة عبر واتساب:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('رقم واتساب المعتمد:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 4),
                  const Text(defaultCoachPhone, style: TextStyle(color: AppColors.primaryDeep, fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  const Text('نص الرسالة المجهزة:', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text(message, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إغلاق', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: message));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: AppColors.success,
                  content: Text('تم نسخ نص الرسالة، يمكنك لصقها في واتساب الآن'),
                ),
              );
            },
            child: const Text('نسخ نص الرسالة'),
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
            'برامج المنظومة موجهة للياقة البدنية وتحسين النمط الحياتي والرياضي العام. البرامج والخطط ليست تشخيصاً أو علاجاً طبياً بديلاً، ويقر المتدرب بأهليته الصحية لممارسة الرياضة واتباع النظام الغذائي.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.6),
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('فهمت ذلك'),
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
            'تلتزم منظومة كريم زكريا بالسرية التامة لبيانات المشترك وسجلاته وصور التقييم، وتُحفظ البيانات في خوادم مشفرة ومحمية ولا يتم مشاركتها أو بيعها لأي جهة خارجية إطلاقاً.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.6),
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

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: const Text('هل ترغب في تسجيل الخروج من هذا الجهاز؟', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              await widget.storage.clearSession();
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => LoginScreen(storage: widget.storage)),
                  (route) => false,
                );
              }
            },
            child: const Text('تأكيد الخروج'),
          ),
        ],
      ),
    );
  }

  void _handleDeleteAccount() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('حذف الحساب نهائياً', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
        content: const Text(
          'تحذير نهائي: سيؤدي هذا الإجراء إلى مسح حسابك وكافة خططك الرياضية والغذائية وصور التقييم بشكل دائم لا يمكن استرجاعه.\n\nهل تؤكد رغبتك في حذف الحساب نهائياً؟',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء التراجع', style: TextStyle(color: AppColors.textPrimary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              Navigator.pop(ctx);
              final apiClient = ApiClient(widget.storage);
              final authService = AuthService(apiClient, widget.storage);
              await authService.deleteAccount();

              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => LoginScreen(storage: widget.storage)),
                  (route) => false,
                );
              }
            },
            child: const Text('نعم، احذف حسابي نهائياً'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final clientName = _user?.fullName ?? 'بطل كريم زكريا';
    final clientCode = _user?.clientCode ?? '-';
    final tier = (_user?.subscriptionTier ?? 'ELITE').toUpperCase();
    final isMax = tier.contains('MAX');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('حسابي'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // بطاقة بيانات المشترك الشخصية (للعرض فقط)
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
                  Row(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.secondaryTint,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: Icon(Icons.person_outline, color: AppColors.primaryDeep, size: 28),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              clientName,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'كود المشترك: $clientCode',
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(9999),
                          border: Border.all(color: AppColors.borderLight),
                        ),
                        child: const Text(
                          'للعرض فقط',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: AppColors.borderLight, height: 1),
                  const SizedBox(height: 14),
                  _buildInfoRow('رقم الهاتف المسجل', _user?.phoneNumber ?? 'غير مسجل'),
                  const SizedBox(height: 8),
                  _buildInfoRow('البريد الإلكتروني', _user?.email ?? 'غير مسجل'),
                  const SizedBox(height: 10),
                  const Text(
                    'البيانات الشخصية للقراءة فقط، لتحديث أي بيانات يرجى إبلاغ المدرب.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 11, height: 1.4),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // بطاقة الباقة والاشتراك
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border),
                boxShadow: AppColors.softCardShadow,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'تفاصيل الاشتراك الحالي',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      // شارة الباقة المعتمدة
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: isMax ? AppColors.maxGradient : AppColors.eliteGradient,
                          borderRadius: BorderRadius.circular(9999),
                        ),
                        child: Text(
                          'باقة $tier',
                          style: TextStyle(
                            color: isMax ? AppColors.textPrimary : Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(9999),
                      border: Border.all(color: const Color(0xFFA7F3D0), width: 1),
                    ),
                    child: const Text(
                      'حالة الاشتراك: نشط',
                      style: TextStyle(
                        color: Color(0xFF059669),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Alexandria',
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'نظام المتابعة الدورية مفعل لمراقبة تطورك البدني والغذائي بصورة مستمرة.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 16),

                  // زر التواصل مع الكوتش وفريق المتابعة
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isMax ? AppColors.maxGold : AppColors.primary,
                      foregroundColor: isMax ? AppColors.textPrimary : Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _showWhatsAppSupportDialog,
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('التواصل مع الكوتش وفريق المتابعة عبر واتساب'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // بطاقة تفضيلات وحدات القياس
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
                boxShadow: AppColors.softCardShadow,
              ),
              child: ListTile(
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.secondaryTint,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(Icons.tune_outlined, color: AppColors.primaryDeep, size: 20),
                  ),
                ),
                title: const Text(
                  'وحدات القياس',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${_unitPrefs['exercise_weight_unit'] == 'lb' ? 'باوند' : 'كجم'} · ${_unitPrefs['body_weight_unit'] == 'lb' ? 'باوند' : 'كجم'} · ${_unitPrefs['measurement_unit'] == 'in' ? 'بوصة' : 'سم'}',
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
                trailing: const Icon(Icons.arrow_back_ios, size: 14, color: AppColors.textMuted),
                onTap: _showUnitPreferencesSheet,
              ),
            ),
            const SizedBox(height: 16),

            // روابط الشروط والسياسات
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.description_outlined, color: AppColors.primaryDeep, size: 20),
                    title: const Text('شروط الخدمة وإخلاء المسؤولية', style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_back_ios, size: 14, color: AppColors.textMuted),
                    onTap: _showTermsDialog,
                  ),
                  const Divider(color: AppColors.borderLight, height: 1),
                  ListTile(
                    leading: const Icon(Icons.shield_outlined, color: AppColors.primaryDeep, size: 20),
                    title: const Text('سياسة الخصوصية وحماية البيانات', style: TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    trailing: const Icon(Icons.arrow_back_ios, size: 14, color: AppColors.textMuted),
                    onTap: _showPrivacyDialog,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // منطقة الأمان والخروج في الأسفل
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: const BorderSide(color: AppColors.border),
              ),
              onPressed: _handleLogout,
              icon: const Icon(Icons.logout, size: 18, color: AppColors.textSecondary),
              label: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 12),
            TextButton.icon(
              style: TextButton.styleFrom(
                foregroundColor: AppColors.danger,
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
              onPressed: _handleDeleteAccount,
              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
              label: const Text('حذف الحساب والبيانات نهائياً', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }

  void _showUnitPreferencesSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 16,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(9999),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'وحدات القياس',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'تفضيلات العرض والإدخال (تُحفظ تلقائياً)',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: AppColors.textMuted),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSegmentGroup(
                  title: 'أوزان التمارين',
                  subtitle: 'تسجيل أداء التمارين (خطوة 2.5 كجم / 5 باوند)',
                  currentVal: _unitPrefs['exercise_weight_unit'] ?? 'kg',
                  opt1Val: 'kg',
                  opt1Label: 'KG — كيلوجرام',
                  opt2Val: 'lb',
                  opt2Label: 'LB — باوند',
                  onChanged: (val) async {
                    setState(() {
                      _unitPrefs['exercise_weight_unit'] = val;
                    });
                    setSheetState(() {});
                    await widget.storage.saveUnitPreferences(_unitPrefs);
                  },
                ),
                const SizedBox(height: 12),
                _buildSegmentGroup(
                  title: 'وزن الجسم',
                  subtitle: 'إدخال المتابعة الأسبوعية (خطوة 0.5 كجم / 1 باوند)',
                  currentVal: _unitPrefs['body_weight_unit'] ?? 'kg',
                  opt1Val: 'kg',
                  opt1Label: 'KG — كيلوجرام',
                  opt2Val: 'lb',
                  opt2Label: 'LB — باوند',
                  onChanged: (val) async {
                    setState(() {
                      _unitPrefs['body_weight_unit'] = val;
                    });
                    setSheetState(() {});
                    await widget.storage.saveUnitPreferences(_unitPrefs);
                  },
                ),
                const SizedBox(height: 12),
                _buildSegmentGroup(
                  title: 'محيط الخصر والمقاسات',
                  subtitle: 'إدخال مقاسات الجسم (خطوة 0.5 سم / 0.25 بوصة)',
                  currentVal: _unitPrefs['measurement_unit'] ?? 'cm',
                  opt1Val: 'cm',
                  opt1Label: 'CM — سنتيمتر',
                  opt2Val: 'in',
                  opt2Label: 'IN — بوصة',
                  onChanged: (val) async {
                    setState(() {
                      _unitPrefs['measurement_unit'] = val;
                    });
                    setSheetState(() {});
                    await widget.storage.saveUnitPreferences(_unitPrefs);
                  },
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.secondaryTint,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'تُحفظ التفضيلات تلقائياً وتطبق على جميع الشاشات',
                        style: TextStyle(color: AppColors.primaryDeep, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                      Text('تلقائي', style: TextStyle(color: AppColors.primaryDeep, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSegmentGroup({
    required String title,
    required String subtitle,
    required String currentVal,
    required String opt1Val,
    required String opt1Label,
    required String opt2Val,
    required String opt2Label,
    required ValueChanged<String> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.secondaryTint,
                  borderRadius: BorderRadius.circular(9999),
                ),
                child: Text(
                  currentVal.toUpperCase(),
                  style: const TextStyle(color: AppColors.primaryDeep, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(subtitle, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2F6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => onChanged(opt1Val),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: currentVal == opt1Val ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: currentVal == opt1Val
                            ? [const BoxShadow(color: Color(0x0A0F172A), blurRadius: 4, offset: Offset(0, 1))]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        opt1Label,
                        style: TextStyle(
                          color: currentVal == opt1Val ? AppColors.textPrimary : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: currentVal == opt1Val ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => onChanged(opt2Val),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: currentVal == opt2Val ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: currentVal == opt2Val
                            ? [const BoxShadow(color: Color(0x0A0F172A), blurRadius: 4, offset: Offset(0, 1))]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        opt2Label,
                        style: TextStyle(
                          color: currentVal == opt2Val ? AppColors.textPrimary : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: currentVal == opt2Val ? FontWeight.bold : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
