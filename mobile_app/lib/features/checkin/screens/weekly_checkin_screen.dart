import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../services/checkin_service.dart';

/// شاشة المتابعة وسجل التطور (Check-in & Progress Hub)
/// تصميم Light Mode نقي متطابق مع موقع كريم زكريا، يجمع بين تسجيل المتابعة وسجل القياسات وملاحظات الكوتش
class WeeklyCheckinScreen extends StatefulWidget {
  final LocalStorage storage;
  const WeeklyCheckinScreen({super.key, required this.storage});

  @override
  State<WeeklyCheckinScreen> createState() => _WeeklyCheckinScreenState();
}

class _WeeklyCheckinScreenState extends State<WeeklyCheckinScreen> {
  late final CheckinService _checkinService;
  final _picker = ImagePicker();

  // وحدة التحكم بالمدخلات
  final _weightController = TextEditingController();
  final _waistController = TextEditingController();
  final _notesController = TextEditingController();

  double _adherenceRate = 90.0;
  int _sleepHours = 7;
  bool _isSubmitting = false;

  // وضع العرض: 0 = تسجيل المتابعة، 1 = سجل التطور وملاحظات الكوتش
  int _selectedView = 0;

  // سجل المتابعات السابقة المحمل من الخادم
  List<Map<String, dynamic>> _checkinHistory = [];

  // مسارات الصور الملتقطة للزوايا الثلاث
  String? _frontPhotoPath;
  String? _sidePhotoPath;
  String? _backPhotoPath;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(widget.storage);
    _checkinService = CheckinService(apiClient, widget.storage);
    _prefillFromLastCheckin(apiClient);
  }

  /// يملأ الوزن والخصر بآخر قياس سجله المتدرب، ويجلب سجل التطور.
  Future<void> _prefillFromLastCheckin(ApiClient apiClient) async {
    final response = await apiClient.get(ApiConstants.checkinHistory);
    final data = response.data;
    if (!response.isSuccess || data is! Map || data['checkins'] is! List) return;

    final checkins = data['checkins'] as List;
    if (!mounted) return;
    setState(() {
      _checkinHistory = checkins.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    });

    if (checkins.isEmpty || checkins.last is! Map) return;
    final last = checkins.last as Map;

    final weight = last['average_weight_kg'] ?? last['weight_kg'];
    final waist = last['waist_circumference_cm'];
    if (!mounted) return;
    setState(() {
      if (weight != null && _weightController.text.isEmpty) {
        _weightController.text = weight.toString();
      }
      if (waist != null && _waistController.text.isEmpty) {
        _waistController.text = waist.toString();
      }
    });
  }

  @override
  void dispose() {
    _weightController.dispose();
    _waistController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String pose) async {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppColors.primaryDeep),
              title: const Text('التقاط عبر الكاميرا', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () async {
                Navigator.pop(ctx);
                final xFile = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
                if (xFile != null) _setImagePath(pose, xFile.path);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppColors.primary),
              title: const Text('اختيار من المعرض', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () async {
                Navigator.pop(ctx);
                final xFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                if (xFile != null) _setImagePath(pose, xFile.path);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _setImagePath(String pose, String path) {
    setState(() {
      if (pose == 'front') _frontPhotoPath = path;
      if (pose == 'side') _sidePhotoPath = path;
      if (pose == 'back') _backPhotoPath = path;
    });
  }

  Future<void> _submitForm() async {
    final rawWeight = double.tryParse(_weightController.text);
    final rawWaist = double.tryParse(_waistController.text);

    if (rawWeight == null || rawWaist == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.danger,
          content: Text('يرجى إدخال الوزن ومحيط الخصر بشكل صحيح'),
        ),
      );
      return;
    }

    final prefs = widget.storage.getUnitPreferences();
    final isBwLb = prefs['body_weight_unit'] == 'lb';
    final isMsIn = prefs['measurement_unit'] == 'in';

    // Canonical values for backend: Always KG and CM
    final canonicalWeightKg = isBwLb ? (rawWeight / 2.2046226218) : rawWeight;
    final canonicalWaistCm = isMsIn ? (rawWaist * 2.54) : rawWaist;

    setState(() => _isSubmitting = true);

    final clientData = widget.storage.getClientData();
    final clientCode = clientData?['client_code']?.toString() ?? '1';

    final res = await _checkinService.submitWeeklyCheckin(
      clientCode: clientCode,
      currentWeight: canonicalWeightKg,
      waistCircumference: canonicalWaistCm,
      adherenceRate: _adherenceRate.round(),
      sleepHours: _sleepHours,
      clientNotes: _notesController.text.trim(),
      frontPhotoPath: _frontPhotoPath,
      sidePhotoPath: _sidePhotoPath,
      backPhotoPath: _backPhotoPath,
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      if (res.isSuccess) {
        // تحديث سجل المتابعات
        _prefillFromLastCheckin(ApiClient(widget.storage));
      }
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            res.isSuccess ? 'تم استلام التقييم' : 'لم يتم إرسال التقييم',
            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
          ),
          content: Text(
            res.isSuccess
                ? 'تم رفع التقييم وصور الزوايا بنجاح إلى المنظومة، وستصلك ملاحظات وتعديلات المدرب بعد المراجعة.'
                : res.errorMessage ?? 'تعذر إرسال التقييم، حاول مرة أخرى.',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('تم'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('المتابعة وسجل التطور'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // محول العرض العلوي: [ تسجيل متابعة جديدة | سجل التطور وملاحظات الكوتش ]
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
                      onTap: () => setState(() => _selectedView = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedView == 0 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'تسجيل متابعة جديدة',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _selectedView == 0 ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedView = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _selectedView == 1 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'سجل التطور والقياسات',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: _selectedView == 1 ? Colors.white : AppColors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontSize: 12.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (_selectedView == 0) ...[
              // قسم تسجيل المتابعة الجديدة
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppColors.softCardShadow,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.secondaryTint,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.assignment_outlined, color: AppColors.primaryDeep, size: 22),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'دورة المتابعة مبرمجة وفق باقتك (7 أيام MAX / 14 يوماً ELITE) مع فترة سماح 72 ساعة.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // القياسات الحيوية
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppColors.softCardShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'القياسات الحيوية (صباحاً على الريق)',
                      style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _weightController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                            decoration: const InputDecoration(
                              labelText: widget.storage.getUnitPreferences()['body_weight_unit'] == 'lb' ? 'الوزن الحالي (lb)' : 'الوزن الحالي (kg)',
                              prefixIcon: Icon(Icons.monitor_weight_outlined, color: AppColors.textMuted),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _waistController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                            decoration: const InputDecoration(
                              labelText: widget.storage.getUnitPreferences()['measurement_unit'] == 'in' ? 'محيط الخصر (in)' : 'محيط الخصر (cm)',
                              prefixIcon: Icon(Icons.straighten_outlined, color: AppColors.textMuted),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // الالتزام والنوم
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppColors.softCardShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'معدل الالتزام بالخطة الغذائية: ${_adherenceRate.round()}%',
                      style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    Slider(
                      value: _adherenceRate,
                      min: 50,
                      max: 100,
                      divisions: 10,
                      activeColor: AppColors.primary,
                      inactiveColor: AppColors.background,
                      onChanged: (val) => setState(() => _adherenceRate = val),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('متوسط ساعات النوم اليومية:', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, color: AppColors.textMuted),
                              onPressed: () {
                                if (_sleepHours > 4) setState(() => _sleepHours--);
                              },
                            ),
                            Text('$_sleepHours ساعات', style: const TextStyle(color: AppColors.primaryDeep, fontWeight: FontWeight.bold, fontSize: 13)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, color: AppColors.textMuted),
                              onPressed: () {
                                if (_sleepHours < 12) setState(() => _sleepHours++);
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // صور التقييم الثلاث (للمدرب فقط)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppColors.softCardShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'صور التطور للمدرب (3 زوايا)',
                          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          'سرية ومحمية',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'الصور محمية وتُنقل بأمان للمدرب فقط للمراجعة الفنية، ولا تظهر في واجهات العميل.',
                      style: TextStyle(color: AppColors.textMuted, fontSize: 11.5, height: 1.4),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _buildPhotoSlot('أمامي', 'front', _frontPhotoPath),
                        const SizedBox(width: 8),
                        _buildPhotoSlot('جانبي', 'side', _sidePhotoPath),
                        const SizedBox(width: 8),
                        _buildPhotoSlot('خلفي', 'back', _backPhotoPath),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // ملاحظات إضافية للكوتش
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                  boxShadow: AppColors.softCardShadow,
                ),
                child: TextField(
                  controller: _notesController,
                  maxLines: 3,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات إضافية للمدرب',
                    hintText: 'اكتب أي ملاحظات حول الطاقة أو الهضم أو الأوزان...',
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // زر الإرسال
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitForm,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('تأكيد وإرسال التقييم للمدرب'),
              ),
              const SizedBox(height: 24),
            ] else ...[
              // قسم سجل التطور والقياسات والرسوم البيانية
              if (_checkinHistory.isEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Center(
                    child: Text(
                      'لا توجد متابعات سابقة مسجلة حتى الآن. ستظهر قياساتك ورسومك البيانية فور اعتماد متابعتك الأولى.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                    ),
                  ),
                ),
              ] else ...[
                // ملخص حركة الوزن والخصر
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.border),
                    boxShadow: AppColors.softCardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'منحنى تطور الوزن عبر الأسابيع',
                        style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 16),
                      // شريط أعمدة بسيط وأنيق يمثل الأسابيع
                      SizedBox(
                        height: 100,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: _checkinHistory.map((item) {
                            final w = (item['average_weight_kg'] ?? item['weight_kg'] ?? 80).toDouble();
                            final week = item['week_number'] ?? 1;
                            return Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text('${w.round()}', style: const TextStyle(color: AppColors.primaryDeep, fontSize: 11, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Container(
                                    height: (w * 0.7).clamp(20.0, 70.0),
                                    margin: const EdgeInsets.symmetric(horizontal: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.secondaryTint,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: AppColors.primary),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('أ$week', style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // بطاقات سجل الأسابيع وملاحظة الكوتش الإلزامية
                const Text(
                  'سجل الأسابيع وملاحظات المدرب',
                  style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 10),
                ..._checkinHistory.reversed.map((entry) {
                  final week = entry['week_number'] ?? 1;
                  final weight = entry['average_weight_kg'] ?? entry['weight_kg'] ?? '-';
                  final waist = entry['waist_circumference_cm'] ?? '-';
                  final coachNote = entry['coach_review_notes'] ?? entry['coach_notes'] ?? entry['feedback'];

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                      boxShadow: AppColors.softCardShadow,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'تقييم الأسبوع $week',
                              style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.secondaryTint,
                                borderRadius: BorderRadius.circular(9999),
                              ),
                              child: const Text('معتمد', style: TextStyle(color: AppColors.primaryDeep, fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Builder(
                          builder: (context) {
                            final prefs = widget.storage.getUnitPreferences();
                            final isBwLb = prefs['body_weight_unit'] == 'lb';
                            final isMsIn = prefs['measurement_unit'] == 'in';
                            String weightDisp = '-';
                            if (weight != '-') {
                              final nw = double.tryParse(weight.toString());
                              weightDisp = nw != null
                                  ? (isBwLb ? '${(nw * 2.2046226218).toStringAsFixed(1)} باوند' : '${nw.toStringAsFixed(1)} كجم')
                                  : '$weight كجم';
                            }
                            String waistDisp = '-';
                            if (waist != '-') {
                              final nms = double.tryParse(waist.toString());
                              waistDisp = nms != null
                                  ? (isMsIn ? '${(nms / 2.54).toStringAsFixed(1)} بوصة' : '${nms.toStringAsFixed(1)} سم')
                                  : '$waist سم';
                            }
                            return Row(
                              children: [
                                Text('الوزن: $weightDisp', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                                const SizedBox(width: 16),
                                Text('الخصر: $waistDisp', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            );
                          },
                        ),
                        if (coachNote != null && coachNote.toString().trim().isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.borderLight),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('ملاحظة وتوجيه الكوتش:', style: TextStyle(color: AppColors.primaryDeep, fontWeight: FontWeight.bold, fontSize: 11.5)),
                                const SizedBox(height: 4),
                                Text(
                                  coachNote.toString(),
                                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoSlot(String title, String pose, String? path) {
    final hasImage = path != null && File(path).existsSync();

    return Expanded(
      child: GestureDetector(
        onTap: () => _pickImage(pose),
        child: Container(
          height: 110,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasImage ? AppColors.primary : AppColors.border,
              width: hasImage ? 1.5 : 1,
            ),
          ),
          child: hasImage
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(13),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.file(File(path), fit: BoxFit.cover),
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        child: Container(
                          color: Colors.black54,
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Text(
                            title,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add_a_photo_outlined, color: AppColors.textMuted, size: 24),
                    const SizedBox(height: 6),
                    Text(
                      title,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
