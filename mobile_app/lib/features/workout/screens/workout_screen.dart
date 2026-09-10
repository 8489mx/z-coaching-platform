import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/storage/local_storage.dart';
import '../models/workout_models.dart';
import '../services/workout_service.dart';

/// شاشة التدريب الميداني وتسجيل الجولات والأوزان في الصالة الرياضية (Gym Logger)
class WorkoutScreen extends StatefulWidget {
  final LocalStorage storage;
  const WorkoutScreen({super.key, required this.storage});

  @override
  State<WorkoutScreen> createState() => _WorkoutScreenState();
}

class _WorkoutScreenState extends State<WorkoutScreen> {
  late final WorkoutService _workoutService;

  List<WorkoutSession> _sessions = [];
  int _selectedSessionIndex = 0;
  String _dailyReadiness = 'OPTIMAL';
  bool _showWorkoutGuide = false;

  @override
  void initState() {
    super.initState();
    _workoutService = WorkoutService(widget.storage);
    _loadWorkoutSessions();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _loadWorkoutSessions() {
    final cached = widget.storage.getCachedActiveProgram();
    final loaded = _workoutService.getSessionsFromProgram(cached);

    if (loaded.isNotEmpty) {
      _sessions = loaded;
    } else {
      // جلسات افتراضية احترافية
      _sessions = [
        WorkoutSession(
          id: 's1',
          dayName: 'اليوم الأول: دفع وصدر وأكتاف أمامية',
          warmupProtocol: 'إحماء عام 5 دقائق دراجة + إطالات ديناميكية لعضلات الصدر وروتاتور كاف',
          exercises: [
            Exercise(
              id: 'ex1',
              name: 'باربل بنش برس مستوي (Barbell Bench Press)',
              targetSets: 4,
              targetReps: '6-8',
              restSeconds: 120,
              safetyNote: 'تثبيت لوحي الكتف للخلف والأسفل والنزول المتحكم به حتى منتصف الصدر',
              sets: [
                WorkoutSet(setNumber: 1, targetReps: '8'),
                WorkoutSet(setNumber: 2, targetReps: '8'),
                WorkoutSet(setNumber: 3, targetReps: '6-8'),
                WorkoutSet(setNumber: 4, targetReps: '6-8'),
              ],
            ),
            Exercise(
              id: 'ex2',
              name: 'ضغط دمبل مائل عالي (Incline DB Press)',
              targetSets: 3,
              targetReps: '8-10',
              restSeconds: 90,
              safetyNote: 'زاوية المقعد 30 درجة لتركيز الحمل على الألياف الترقوية العلوية',
              sets: [
                WorkoutSet(setNumber: 1, targetReps: '10'),
                WorkoutSet(setNumber: 2, targetReps: '10'),
                WorkoutSet(setNumber: 3, targetReps: '8-10'),
              ],
            ),
            Exercise(
              id: 'ex3',
              name: 'تفتيح كيبل للصدر مع ضغط (Cable Flyes)',
              targetSets: 3,
              targetReps: '12-15',
              restSeconds: 60,
              safetyNote: 'عصر العضلة في نهاية المدى مع ثبات ثانية واحدة',
              sets: [
                WorkoutSet(setNumber: 1, targetReps: '15'),
                WorkoutSet(setNumber: 2, targetReps: '12-15'),
                WorkoutSet(setNumber: 3, targetReps: '12-15'),
              ],
            ),
            Exercise(
              id: 'ex4',
              name: 'ترايسبس حبل كيبل لأسفل (Rope Pushdown)',
              targetSets: 4,
              targetReps: '12',
              restSeconds: 60,
              safetyNote: 'تثبيت المرفقين بجانب الجذع دون تأرجح',
              sets: [
                WorkoutSet(setNumber: 1, targetReps: '12'),
                WorkoutSet(setNumber: 2, targetReps: '12'),
                WorkoutSet(setNumber: 3, targetReps: '12'),
                WorkoutSet(setNumber: 4, targetReps: '12'),
              ],
            ),
          ],
        ),
        WorkoutSession(
          id: 's2',
          dayName: 'اليوم الثاني: سحب وظهر وبايسبس',
          warmupProtocol: 'سحب خفيف على الكيبل + تعليق حر لتمديد عضلات الظهر العريضة',
          exercises: [
            Exercise(
              id: 'ex5',
              name: 'سحب ظهر عريض أمامي (Lat Pulldown)',
              targetSets: 4,
              targetReps: '8-10',
              restSeconds: 90,
              safetyNote: 'بدء السحب بتنزيل لوحي الكتف ثم سحب المرفقين للجوانب',
              sets: [
                WorkoutSet(setNumber: 1, targetReps: '10'),
                WorkoutSet(setNumber: 2, targetReps: '10'),
                WorkoutSet(setNumber: 3, targetReps: '8-10'),
                WorkoutSet(setNumber: 4, targetReps: '8-10'),
              ],
            ),
          ],
        ),
      ];
    }
    setState(() {});
  }



  Future<void> _completeSession(WorkoutSession session) async {
    await _workoutService.logCompletedSession(
      sessionId: session.id,
      sessionName: session.dayName,
      exercises: session.exercises,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.primary,
          content: Text(
            'تم تسجيل وحفظ جلسة التمرين بنجاح في الذاكرة المحلية والربط مع الخادم',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sessions.isEmpty) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Text('لا توجد جلسات تدريبية متاحة حالياً', style: TextStyle(color: AppColors.textSecondary)),
        ),
      );
    }

    final currentSession = _sessions[_selectedSessionIndex];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل التمارين الميداني'),
      ),
      body: Column(
        children: [
          // شريط اختيار الجلسة التدريبية
          Container(
            height: 52,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: AppColors.backgroundDeep,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _sessions.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final isSelected = idx == _selectedSessionIndex;
                return ChoiceChip(
                  label: Text('جلسة ${idx + 1}'),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : AppColors.textSecondary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  onSelected: (val) {
                    if (val) setState(() => _selectedSessionIndex = idx);
                  },
                );
              },
            ),
          ),



          // محتوى التمارين
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // عنوان الجلسة وبروتوكول الإحماء
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        currentSession.dayName,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.info_outline, size: 16, color: AppColors.primary),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              currentSession.warmupProtocol,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // بطاقة الجاهزية اليومية والتنظيم الذاتي (Autoregulation Directive)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'الجاهزية اليومية والتنظيم الذاتي (RPE)',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'حدد حالتك البدنية لتكييف الشدة ورفع الحرج العصبي:',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('نشيط')),
                              selected: _dailyReadiness == 'OPTIMAL',
                              selectedColor: const Color(0xFFDCFCE7),
                              backgroundColor: AppColors.backgroundDeep,
                              labelStyle: TextStyle(
                                color: _dailyReadiness == 'OPTIMAL' ? const Color(0xFF166534) : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              onSelected: (val) {
                                if (val) setState(() => _dailyReadiness = 'OPTIMAL');
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('معتدل')),
                              selected: _dailyReadiness == 'MODERATE',
                              selectedColor: AppColors.primaryLight,
                              backgroundColor: AppColors.backgroundDeep,
                              labelStyle: TextStyle(
                                color: _dailyReadiness == 'MODERATE' ? AppColors.primary : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              onSelected: (val) {
                                if (val) setState(() => _dailyReadiness = 'MODERATE');
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: ChoiceChip(
                              label: const Center(child: Text('إجهاد')),
                              selected: _dailyReadiness == 'FATIGUED',
                              selectedColor: const Color(0xFFFEE2E2),
                              backgroundColor: AppColors.backgroundDeep,
                              labelStyle: TextStyle(
                                color: _dailyReadiness == 'FATIGUED' ? const Color(0xFF991B1B) : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                              onSelected: (val) {
                                if (val) setState(() => _dailyReadiness = 'FATIGUED');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: _dailyReadiness == 'FATIGUED' ? const Color(0xFFFEF2F2) : AppColors.backgroundDeep,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _dailyReadiness == 'FATIGUED' ? const Color(0xFFFCA5A5) : AppColors.border,
                          ),
                        ),
                        child: Text(
                          _dailyReadiness == 'FATIGUED'
                              ? 'توجيه ليوم الإجهاد: طاقتك تتأثر بنومك وضغوط يومك وهذا تذبذب عصبي طبيعي؛ من الاحترافية خفض الأوزان بنسبة 10-20% والتركيز على المدى الحركي الآمن وتفادي الفشل التام. قوتك ستعود بكامل طاقتها الأسبوع القادم.'
                              : 'قاعدة الجاهزية (RPE): اضبط أوزانك وفق طاقتك الحالية مع إبقاء 1-2 تكرار في الاحتياط قبل الفشل العضلي بتكنيك آمن ومحكم.',
                          style: TextStyle(
                            color: _dailyReadiness == 'FATIGUED' ? const Color(0xFF991B1B) : AppColors.textSecondary,
                            fontSize: 11,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // بطاقة دليل تنفيذ الخطة وفهم الرموز
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.menu_book, size: 18, color: AppColors.primary),
                              SizedBox(width: 8),
                              Text(
                                'دليل تنفيذ الخطة وفهم الرموز',
                                style: TextStyle(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          TextButton(
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              backgroundColor: _showWorkoutGuide ? AppColors.backgroundDeep : AppColors.primaryLight,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () => setState(() => _showWorkoutGuide = !_showWorkoutGuide),
                            child: Text(
                              _showWorkoutGuide ? 'إخفاء' : 'استعراض',
                              style: TextStyle(
                                color: _showWorkoutGuide ? AppColors.textSecondary : AppColors.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_showWorkoutGuide) ...[
                        const SizedBox(height: 10),
                        const Divider(height: 1, color: AppColors.border),
                        const SizedBox(height: 10),
                        _buildGuideItem('1. مجموعات العمل الفعالة (Working Sets)', 'المجموعات المكتوبة (مثال: 3 جولات) هي مجموعات عمل أساسية بنفس الوزن التشغيلي. التسخين يتم مسبقاً ولا يُحسب ضمن جولات الجدول.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('2. كيف تحدد وزنك لأول مرة؟', 'لا نحدد لك وزناً ثابتاً في البداية؛ اختر وزناً تجريبياً يمكنك من إتمام العدات المطلوبة مع بقاء 1-2 عدة في الاحتياط قبل الفشل (RPE 8-9)، وسجله في خانة أفضل وزن اليوم.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('3. ماذا يعني النطاق التكراري (8-10 عدات)؟', 'اختيار وزن لا تستطيع عمل أقل من 8 به ولا تتجاوز 10 بتكنيك محكم.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('4. فترات الراحة (60 - 90 ثانية)', 'إلزامية لاستعادة مخازن الطاقة (ATP) لرفع نفس الوزن في المجموعة التالية.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('5. متى ترفع الوزن؟ (الزيادة التدريجية)', 'في الأسبوع القادم فقط عندما تتقن الحد الأقصى للتكرارات في كافة المجموعات.'),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // بطاقات التمارين الفردية
                ...currentSession.exercises.map((exercise) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            exercise.name,
                            style: const TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'توجيه: ${exercise.safetyNote}',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                          ),
                          const SizedBox(height: 12),

                          // شريط الوصفة التدريبية الاسترشادية (Prescription Reference Only)
                          Container(
                            decoration: BoxDecoration(
                              color: AppColors.backgroundDeep,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.border),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildPrescriptionBadge('${exercise.targetSets} مجموعات', 'الحجم المستهدف'),
                                Container(width: 1, height: 24, color: AppColors.border),
                                _buildPrescriptionBadge('${exercise.targetReps} عدات', 'النطاق التكراري'),
                                Container(width: 1, height: 24, color: AppColors.border),
                                _buildPrescriptionBadge('${exercise.restSeconds} ثانية', 'فترة الراحة'),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // زر تحديد كمنجز (اختياري للاسترشاد)
                          InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () {
                              setState(() {
                                exercise.isDone = !exercise.isDone;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
                              decoration: BoxDecoration(
                                color: exercise.isDone ? const Color(0xFFF0FDF4) : AppColors.backgroundDeep,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: exercise.isDone ? const Color(0xFFBBF7D0) : AppColors.border,
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    exercise.isDone ? Icons.check_circle : Icons.check_circle_outline,
                                    size: 18,
                                    color: exercise.isDone ? const Color(0xFF16A34A) : AppColors.textSecondary,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    exercise.isDone ? 'تم إنجاز هذا التمرين' : 'تحديد كمنجز (اختياري)',
                                    style: TextStyle(
                                      color: exercise.isDone ? const Color(0xFF166534) : AppColors.textSecondary,
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),

                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => _completeSession(currentSession),
                  icon: const Icon(Icons.check, size: 20),
                  label: const Text('إنهاء الجلسة وحفظ السجل الميداني'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrescriptionBadge(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
      ],
    );
  }

  Widget _buildGuideItem(String title, String desc) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.backgroundDeep,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(desc, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, height: 1.4)),
        ],
      ),
    );
  }
}
