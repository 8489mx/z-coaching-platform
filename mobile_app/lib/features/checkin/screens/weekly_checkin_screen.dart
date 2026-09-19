import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../services/checkin_service.dart';

/// شاشة التقييم الأسبوعي ورفع صور الزوايا الثلاث
class WeeklyCheckinScreen extends StatefulWidget {
  final LocalStorage storage;
  const WeeklyCheckinScreen({super.key, required this.storage});

  @override
  State<WeeklyCheckinScreen> createState() => _WeeklyCheckinScreenState();
}

class _WeeklyCheckinScreenState extends State<WeeklyCheckinScreen> {
  late final CheckinService _checkinService;
  final _picker = ImagePicker();

  final _weightController = TextEditingController(text: '82.5');
  final _waistController = TextEditingController(text: '84.0');
  final _notesController = TextEditingController();

  double _adherenceRate = 90.0;
  int _sleepHours = 7;
  bool _isSubmitting = false;

  // مسارات الصور الملتقطة للزوايا الثلاث
  String? _frontPhotoPath;
  String? _sidePhotoPath;
  String? _backPhotoPath;

  @override
  void initState() {
    super.initState();
    final apiClient = ApiClient(widget.storage);
    _checkinService = CheckinService(apiClient, widget.storage);
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
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppColors.primary),
              title: const Text('التقاط عبر الكاميرا', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () async {
                Navigator.pop(ctx);
                final xFile = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
                if (xFile != null) _setImagePath(pose, xFile.path);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: AppColors.secondary),
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
    final weight = double.tryParse(_weightController.text);
    final waist = double.tryParse(_waistController.text);

    if (weight == null || waist == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.danger,
          content: Text('يرجى إدخال الوزن ومحيط الخصر بشكل صحيح'),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final clientData = widget.storage.getClientData();
    final clientCode = clientData?['client_code']?.toString() ?? '1';

    final res = await _checkinService.submitWeeklyCheckin(
      clientCode: clientCode,
      currentWeight: weight,
      waistCircumference: waist,
      adherenceRate: _adherenceRate.round(),
      sleepHours: _sleepHours,
      clientNotes: _notesController.text.trim(),
      frontPhotoPath: _frontPhotoPath,
      sidePhotoPath: _sidePhotoPath,
      backPhotoPath: _backPhotoPath,
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.surface,
          title: Text(
            res.isSuccess ? 'تم استلام التقييم الأسبوعي' : 'لم يتم إرسال التقييم',
            style: const TextStyle(color: AppColors.textPrimary),
          ),
          content: Text(
            res.isSuccess
                ? 'تم رفع التقييم وصور الزوايا الثلاث بنجاح إلى المنظومة، وسيتم إخطار الكوتش للمراجعة والاعتماد.'
                : res.errorMessage ?? 'تعذر إرسال التقييم، حاول مرة أخرى.',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
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
        title: const Text('استمارة التقييم الأسبوعي'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // بطاقة التوجيه
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: const Row(
                children: [
                  Icon(Icons.assignment_outlined, color: AppColors.primary, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'التقييم الأسبوعي يساعد الكوتش على ضبط سعراتك وتمارينك وفق التطور الفعلي لجسمك.',
                      style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // القياسات الحيوية
            const Text(
              'القياسات الحيوية (صباحاً على الريق)',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _weightController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'الوزن الحالي (kg)',
                      prefixIcon: Icon(Icons.monitor_weight_outlined, color: AppColors.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _waistController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      labelText: 'محيط الخصر (cm)',
                      prefixIcon: Icon(Icons.straighten_outlined, color: AppColors.textSecondary),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // الالتزام والنوم
            Text(
              'معدل الالتزام بالخطة الغذائية: ${_adherenceRate.round()}%',
              style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600),
            ),
            Slider(
              value: _adherenceRate,
              min: 50,
              max: 100,
              divisions: 10,
              activeColor: AppColors.primary,
              inactiveColor: AppColors.surfaceLight,
              onChanged: (val) => setState(() => _adherenceRate = val),
            ),
            const SizedBox(height: 12),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('متوسط ساعات النوم اليومية:', style: TextStyle(color: AppColors.textPrimary, fontSize: 14)),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline, color: AppColors.textSecondary),
                      onPressed: () {
                        if (_sleepHours > 4) setState(() => _sleepHours--);
                      },
                    ),
                    Text('$_sleepHours ساعات', style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, color: AppColors.textSecondary),
                      onPressed: () {
                        if (_sleepHours < 12) setState(() => _sleepHours++);
                      },
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),

            // صور التقييم الثلاث
            const Text(
              'صور التطور الأسبوعي (3 زوايا)',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.secondary.withValues(alpha: 0.4)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_outlined, color: AppColors.secondary, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'خصوصية وأمان: صور التقييم مشفرة وسرية ومحصورة بينك وبين كوتشك لقياس التطور العضلي فقط. يمنع منعاً باتاً رفع أي محتوى غير رياضي أو مخل بالآداب (سياسة عدم التسامح المطلق).',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 11.5, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            Row(
              children: [
                _buildPhotoSlot('أمامي', 'front', _frontPhotoPath),
                const SizedBox(width: 8),
                _buildPhotoSlot('جانبي', 'side', _sidePhotoPath),
                const SizedBox(width: 8),
                _buildPhotoSlot('خلفي', 'back', _backPhotoPath),
              ],
            ),
            const SizedBox(height: 20),

            // ملاحظات إضافية
            TextField(
              controller: _notesController,
              maxLines: 3,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'ملاحظات إضافية للكوتش (طاقة، هضم، أوزان التمارين)',
                hintText: 'اكتب أي صعوبات واجهتها هذا الأسبوع...',
              ),
            ),
            const SizedBox(height: 24),

            // زر إرسال التقييم
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitForm,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('تأكيد وإرسال التقييم الأسبوعي'),
            ),
            const SizedBox(height: 24),
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
          height: 130,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: hasImage ? AppColors.primary : AppColors.border,
              width: hasImage ? 1.5 : 1,
            ),
          ),
          child: hasImage
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(11),
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
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add_a_photo_outlined, color: AppColors.textSecondary, size: 28),
                    const SizedBox(height: 8),
                    Text(
                      title,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
